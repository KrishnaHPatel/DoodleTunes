from flask import Flask, request, jsonify, send_from_directory
from lyric_generator import LyricGenerator, LyricRequest
import os

app = Flask(__name__, static_folder="static", static_url_path="")

# Single generator instance; defaults to Qwen-only setup
generator = LyricGenerator(provider="huggingface", model=os.getenv("LLM_MODEL", "qwen3"))


@app.route("/api/generate-lyrics", methods=["POST"])
def generate_lyrics_api():
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


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=True)


