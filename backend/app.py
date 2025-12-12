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

    req = LyricRequest(labels=labels, emotion=emotion, num_lines=num_lines)
    resp = generator.generate_lyrics(req)
    return jsonify({
        "lyrics": resp.lyrics,
        "source": resp.source,
        "model": resp.model,
        "labels": resp.labels_used,
        "emotion": resp.emotion,
        "num_lines": num_lines
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
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    print("🎵 DoodleTunes Unified Server starting...")
    print(f"Server running on http://localhost:{port}")
    print("Endpoints:")
    print("  - /api/generate-lyrics (POST) - Generate lyrics from labels")
    print("  - /api/render (POST) - Render lyrics to speech")
    app.run(host="0.0.0.0", port=port, debug=True)


