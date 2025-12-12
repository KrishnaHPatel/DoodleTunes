"""
DoodleTunes Backend - Piper TTS Service
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import base64
import hashlib
from typing import List, Dict
import sys
import os

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tts.piper import synthesize_text
from tts.pacing import compute_pauses, get_mood_profile

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# In-memory cache for TTS results
tts_cache: Dict[str, bytes] = {}

@app.route('/')
def index():
    return jsonify({"message": "DoodleTunes TTS Server", "status": "running"})

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
        "voice": "en_US-lessac-medium",
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
        # (voice parameter is ignored, mood determines the voice)
        
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

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    print("🎵 DoodleTunes TTS Server starting...")
    print(f"Server running on http://localhost:{port}")
    app.run(debug=True, port=port)

