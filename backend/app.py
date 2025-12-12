from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from lyric_generator import LyricGenerator, LyricRequest
import os
import sys
import base64
import hashlib
from typing import List, Dict

# Add src to path for TTS imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from tts.piper import synthesize_text
from tts.pacing import compute_pauses, get_mood_profile

# Optional BEiT model imports (lazy load)
_beit_model = None
_beit_processor = None
_beit_device = None

def load_beit_model():
    """Lazy load BEiT model only when needed"""
    global _beit_model, _beit_processor, _beit_device
    
    # If model failed previously, reset and try again (in case dependencies were installed)
    if _beit_model is False:
        print("⚠ BEiT model failed previously, resetting and retrying...")
        _beit_model = None
        _beit_processor = None
        _beit_device = None
    
    if _beit_model is None:
        try:
            import torch
            from transformers import BeitForImageClassification, BeitImageProcessor
            
            MODEL_NAME = "kmewhort/beit-sketch-classifier"
            print(f"Loading BEiT model: {MODEL_NAME}...")
            _beit_processor = BeitImageProcessor.from_pretrained(MODEL_NAME, use_safetensors=True)
            _beit_model = BeitForImageClassification.from_pretrained(MODEL_NAME, use_safetensors=True)
            _beit_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            _beit_model.to(_beit_device)
            _beit_model.eval()
            print(f"✓ BEiT model loaded successfully on {_beit_device}")
        except ImportError as e:
            print("⚠ Warning: torch/transformers not installed. BEiT endpoint will not work.")
            print("  Install with: pip install torch transformers pillow")
            print(f"  Import error: {e}")
            _beit_model = False  # Mark as failed to load
            raise
        except Exception as e:
            print(f"⚠ Warning: Failed to load BEiT model: {e}")
            import traceback
            traceback.print_exc()
            _beit_model = False  # Mark as failed to load
            raise
    
    if _beit_model is False:
        raise Exception("BEiT model failed to load. Please check that torch and transformers are installed.")
        
    return _beit_model, _beit_processor, _beit_device

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Serve static files (including melodies folder)
@app.route('/melodies/<path:filename>')
def serve_melody(filename):
    """Serve melody files from frontend/melodies/"""
    return send_from_directory(os.path.join(app.static_folder, "melodies"), filename)

# Single generator instance; defaults to Qwen-only setup
generator = LyricGenerator(provider="huggingface", model=os.getenv("LLM_MODEL", "qwen3"))

# In-memory cache for TTS results
tts_cache: Dict[str, bytes] = {}


@app.route("/api/generate-lyrics", methods=["POST"])
def generate_lyrics_api():
    """Generate lyrics from labels and emotion"""
    data = request.get_json(force=True)
    labels = data.get("labels", [])
    emotion = data.get("emotion", "happy")
    num_lines = int(data.get("num_lines", 8))
    mode = (data.get("mode") or "auto").lower()  # 'auto' | 'llm' | 'template'

    req = LyricRequest(labels=labels, emotion=emotion, num_lines=num_lines)
    # Support forced mode selection
    if mode == "template":
        lyrics = generator._generate_with_template(req)
        return jsonify({
            "lyrics": lyrics,
            "source": "template",
            "model": generator.model_name,
            "labels": req.labels,
            "emotion": req.emotion,
            "num_lines": num_lines,
            "mode_requested": mode
        })
    elif mode == "llm":
        lyrics = generator._generate_with_llm(req)
        # If LLM fails, gracefully fall back to template
        if not lyrics:
            lyrics = generator._generate_with_template(req)
            source = "template"
        else:
            source = "llm"
        return jsonify({
            "lyrics": lyrics,
            "source": source,
            "model": generator.model_name,
            "labels": req.labels,
            "emotion": req.emotion,
            "num_lines": num_lines,
            "mode_requested": mode
        })
    else:
        resp = generator.generate_lyrics(req)
        return jsonify({
            "lyrics": resp.lyrics,
            "source": resp.source,
            "model": resp.model,
            "labels": resp.labels_used,
            "emotion": resp.emotion,
            "num_lines": num_lines,
            "mode_requested": "auto"
        })


@app.route('/api/render', methods=['POST'])
def render():
    """
    Render lyrics with Piper TTS and return audio chunks with pauses
    
    Request:
    {
      "lyricsLines": ["line 1", "line 2", ...],
      "mood": "Happy"
    }
    
    Response:
    {
      "chunks": [
        {"audioBase64": "...", "pauseMs": 420},
        ...
      ],
      "meta": {
        "voice": "en_US-ryan-high",
        "mood": "Happy",
        "estimatedTotalMs": 28000
      }
    }
    """
    try:
        data = request.get_json()
        lyrics_lines = data.get('lyricsLines', [])
        mood = data.get('mood', 'Calm')
        
        if not lyrics_lines:
            return jsonify({'error': 'No lyrics provided'}), 400
        
        # Get mood profile
        mood_profile = get_mood_profile(mood)
        
        # Compute pauses for each line
        pauses = compute_pauses(lyrics_lines, mood_profile)
        
        # Synthesize each line
        chunks = []
        total_ms = 0
        
        # Voice is automatically selected based on mood
        for i, line in enumerate(lyrics_lines):
            # Generate cache key using mood (since voice is mood-based)
            cache_key = hashlib.md5(f"{mood}:{line}".encode()).hexdigest()
            
            # Check cache
            if cache_key in tts_cache:
                wav_bytes = tts_cache[cache_key]
            else:
                # Synthesize with Piper using mood to select voice
                wav_bytes = synthesize_text(line, mood=mood)
                tts_cache[cache_key] = wav_bytes
            
            # Encode to base64
            audio_base64 = base64.b64encode(wav_bytes).decode('utf-8')
            
            # Get pause for this chunk
            pause_ms = pauses[i] if i < len(pauses) else 300
            
            chunks.append({
                "audioBase64": audio_base64,
                "pauseMs": pause_ms
            })
            
            # Estimate duration (rough: ~150ms per word + pause)
            word_count = len(line.split())
            estimated_line_ms = word_count * 150 + pause_ms
            total_ms += estimated_line_ms
        
        # Adjust if duration is off target (25-30 seconds)
        if total_ms < 22000:
            # Too short - add to pauses
            for chunk in chunks:
                chunk['pauseMs'] = min(chunk['pauseMs'] + 60, 900)
            total_ms = sum(c['pauseMs'] for c in chunks) + len(chunks) * 200
        elif total_ms > 34000:
            # Too long - reduce pauses
            for chunk in chunks:
                chunk['pauseMs'] = max(chunk['pauseMs'] - 40, 120)
            total_ms = sum(c['pauseMs'] for c in chunks) + len(chunks) * 200
        
        # Get the actual voice name used for this mood
        from tts.piper import MOOD_VOICE_MAP
        actual_voice = MOOD_VOICE_MAP.get(mood, MOOD_VOICE_MAP["Calm"])
        
        return jsonify({
            "chunks": chunks,
            "meta": {
                "voice": actual_voice,
                "mood": mood,
                "estimatedTotalMs": int(total_ms)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route("/")
def index():
    # Intro/welcome page
    return send_from_directory(app.static_folder, "intro.html")

@app.route("/drawing.html")
def drawing():
    # Drawing page (page 1)
    return send_from_directory(app.static_folder, "drawing.html")

@app.route("/lyrics.html")
def lyrics():
    return send_from_directory(app.static_folder, "lyrics.html")

@app.route("/playback.html")
def playback():
    return send_from_directory(app.static_folder, "playback.html")

@app.route("/api/predict", methods=["POST", "OPTIONS"])
def predict():
    """BEiT sketch classification endpoint"""
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        model, processor, device = load_beit_model()
        if model is None or processor is None:
            return jsonify({"error": "Model not loaded"}), 503
    except Exception as e:
        print(f"Error loading BEiT model: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Model not available: {str(e)}"}), 503
    
    try:
        from PIL import Image
        import io
        import torch
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        img_data = data.get("image")

        if not img_data:
            return jsonify({"error": "No image provided"}), 400

        # Strip the data:image/png;base64, header if it exists
        if "," in img_data:
            img_data = img_data.split(",")[1]

        # Convert base64 to PIL Image
        try:
            image_bytes = io.BytesIO(base64.b64decode(img_data))
            image = Image.open(image_bytes).convert("RGB")
        except Exception as e:
            print(f"Error parsing image: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to parse image: {str(e)}"}), 400

        # Preprocess and run BEiT
        try:
            inputs = processor(images=image, return_tensors="pt")
            inputs = {k: v.to(device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                pred_idx = logits.argmax(-1).item()
                label = model.config.id2label[pred_idx]
        except Exception as e:
            print(f"Error during model inference: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Model inference failed: {str(e)}"}), 500

        return jsonify({"label": label})
    except Exception as e:
        print(f"Unexpected error in predict endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    print("🎵 DoodleTunes Unified Server starting...")
    print(f"Server running on http://localhost:{port}")
    print("Endpoints:")
    print("  - /api/predict (POST) - BEiT sketch classification")
    print("  - /api/generate-lyrics (POST) - Generate lyrics from labels")
    print("  - /api/render (POST) - Render lyrics to speech")
    print("Pages:")
    print("  - /drawing.html - Draw images and get labels")
    print("  - /lyrics.html - Generate lyrics")
    print("  - /playback.html - Play audio")
    app.run(host="0.0.0.0", port=port, debug=True)


