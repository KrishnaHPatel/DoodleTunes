# --------------- NEW VERSION -------------------------- #
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import torch
from torchvision import transforms
from transformers import BeitForImageClassification, BeitImageProcessor
# ----------- Initialize Flask -----------
app = Flask(__name__)
CORS(app)

# ----------- Load BEiT Sketch Model -----------
# This is the kmewhort/beit-sketch-classifier
MODEL_NAME = "kmewhort/beit-sketch-classifier"

processor = BeitImageProcessor.from_pretrained(MODEL_NAME, use_safetensors=True)
model = BeitForImageClassification.from_pretrained(MODEL_NAME, use_safetensors=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

# ----------- Prediction Endpoint -----------
@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json()
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
        return jsonify({"error": f"Model inference failed: {str(e)}"}), 500

    return jsonify({"label": label})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
