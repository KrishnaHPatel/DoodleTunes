# DoodleTunes Setup Guide

Complete setup instructions for running DoodleTunes on a new machine.

## Prerequisites

- Python 3.8 to 3.13
- pip (Python package manager)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd DoodleTunes
```

## Step 2: Install Python Dependencies

Install all required Python packages:

```bash
cd backend
pip install -r requirements.txt
```

**Required packages:**
- `flask` - Web server framework
- `flask-cors` - Cross-origin resource sharing
- `piper-tts` - Text-to-speech synthesis
- `requests` - HTTP library for API calls
- `torch`, `transformers`, `Pillow` - For BEiT image recognition (~2GB total download)

## Step 3: Set Up Hugging Face Token (for LLM)

The lyric generation feature requires a Hugging Face API token.

1. **Get your token:**
   - Go to https://huggingface.co/settings/tokens
   - Create a new token (read access is sufficient)

2. **Add token to your shell configuration:**
   ```bash
   nano ~/.zshrc
   ```
   
   Add this line (replace `your_token_here` with your actual token):
   ```bash
   export HF_TOKEN="your_token_here"
   ```

3. **Reload your shell configuration:**
   ```bash
   source ~/.zshrc
   ```

4. **Verify it's set:**
   ```bash
   echo $HF_TOKEN
   ```

**Note:** If you don't set `HF_TOKEN`, the app will fall back to template-based lyrics instead of using the LLM.

## Step 4: Install Piper TTS and Download Voice Files

### Install Piper TTS Package

```bash
pip install piper-tts
```

### Download Voice Files

The app needs voice model files for each mood. You need to download 6 voice models (one for each mood).

**Voice files structure:**
```
backend/voices/
├── Happy/
│   ├── en_US-ryan-high.onnx
│   └── en_US-ryan-high.onnx.json
├── Sad/
│   ├── en_US-libritts-high.onnx
│   └── en_US-libritts-high.onnx.json
├── Calm/
│   ├── en_US-kristin-medium.onnx
│   └── en_US-kristin-medium.onnx.json
├── Angry/
│   ├── en_US-john-medium.onnx
│   └── en_US-john-medium.onnx.json
├── Romantic/
│   ├── en_GB-northern_english_male-medium.onnx
│   └── en_GB-northern_english_male-medium.onnx.json
└── Energetic/
    ├── en_GB-semaine-medium.onnx
    └── en_GB-semaine-medium.onnx.json
```

**How to download:**

2. Navigate to each voice folder and download both `.onnx` and `.onnx.json` files:

   **Happy:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/high
   - Download: `en_US-ryan-high.onnx` and `en_US-ryan-high.onnx.json`
   - Place in: `backend/voices/Happy/`

   **Sad:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/libritts/high
   - Download: `en_US-libritts-high.onnx` and `en_US-libritts-high.onnx.json`
   - Place in: `backend/voices/Sad/`

   **Calm:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/kristin/medium
   - Download: `en_US-kristin-medium.onnx` and `en_US-kristin-medium.onnx.json`
   - Place in: `backend/voices/Calm/`

   **Angry:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/john/medium
   - Download: `en_US-john-medium.onnx` and `en_US-john-medium.onnx.json`
   - Place in: `backend/voices/Angry/`

   **Romantic:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/northern_english_male/medium
   - Download: `en_GB-northern_english_male-medium.onnx` and `en_GB-northern_english_male-medium.onnx.json`
   - Place in: `backend/voices/Romantic/`

   **Energetic:**
   - https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/semaine/medium
   - Download: `en_GB-semaine-medium.onnx` and `en_GB-semaine-medium.onnx.json`
   - Place in: `backend/voices/Energetic/`

**Note:** Each voice file is 60-120MB, so downloading all 6 moods requires ~500MB of space.

**Verify your voice files:**
```bash
ls -la backend/voices/*/*.onnx
ls -la backend/voices/*/*.onnx.json
```

You should see 12 files total (6 moods × 2 files each).

## Step 5: Run the Server

```bash
cd backend
python app.py
```

You should see:
```
Server running on http://localhost:8001
```

## Step 6: Open in Browser

Navigate to: **http://localhost:8001**

The app will load the intro page, and you can start using DoodleTunes!

---

## Application Flow

1. **Intro Page** → Welcome screen with "Get Started" button
2. **Page 1 (Drawing)** → Sketch or upload 3 images → BEiT generates labels
3. **Page 2 (Lyrics)** → Labels auto-filled → Select mood → Generate lyrics → Click "Next"
4. **Page 3 (Playback)** → Lyrics + mood auto-loaded → Click "Play" to hear TTS + melody

---

## File Structure

```
DoodleTunes/
├── backend/
│   ├── app.py              # Unified Flask server (run this!)
│   ├── requirements.txt    # Python dependencies
│   ├── voices/             # Voice model files (download required)
│   │   ├── Happy/
│   │   ├── Sad/
│   │   ├── Calm/
│   │   ├── Angry/
│   │   ├── Romantic/
│   │   └── Energetic/
│   └── src/
│       └── tts/           # TTS implementation
├── frontend/
│   ├── intro.html         # Welcome page
│   ├── drawing.html       # Page 1: Image recognition
│   ├── index.html         # Page 2: Lyric generation
│   ├── playback.html      # Page 3: Audio playback
│   ├── melodies/          # melody files
│   └── src/               # Frontend JavaScript
└── SETUP.md               # This file
```

---

## API Endpoints

- `POST /api/predict` - BEiT image classification
- `POST /api/generate-lyrics` - Generate lyrics from labels + mood
- `POST /api/render` - Render lyrics to speech (TTS)

## Pages

- `/` - Intro/welcome page
- `/drawing.html` - Drawing/upload page
- `/lyrics.html` - Lyric generation page
- `/playback.html` - Audio playback page

---

## Troubleshooting

### "Voice files not found" error
- Make sure you downloaded all voice files to `backend/voices/<Mood>/`
- Each mood folder should contain both `.onnx` and `.onnx.json` files
- Check file names match exactly (case-sensitive)

### "401 Unauthorized" or lyrics using templates
- Make sure `HF_TOKEN` is set in your environment
- Restart the Flask server after setting the token
- Verify with: `echo $HF_TOKEN`
- Check your token is valid at https://huggingface.co/settings/tokens

### BEiT image recognition not working
- Ensure dependencies installed: `pip install torch transformers Pillow`
- The model downloads automatically on first use (may take a few minutes)
- Check server logs for import errors
- **NumPy compatibility**: `numpy` must be below version 2.0. If you encounter numpy-related errors, install a compatible version:
  ```bash
  pip install "numpy<2.0"
  ```
- **If having trouble loading the model**, you can modify `backend/app.py` in the `load_beit_model()` function to add `use_auth_token=False`:
  ```python
  processor = BeitImageProcessor.from_pretrained(MODEL_NAME, use_safetensors=True, use_auth_token=False)
  model = BeitForImageClassification.from_pretrained(MODEL_NAME, use_safetensors=True, use_auth_token=False)
  ```
  Make sure `use_auth_token=False` is set in both calls.
