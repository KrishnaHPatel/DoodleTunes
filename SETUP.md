# Setup Instructions

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Download Piper voice model:**
   
   Option A (using piper-tts package):
   ```bash
   python -m piper.download_voices --output-dir voices en_US-lessac-medium
   ```
   
   Option B (manual download):
   - Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium
   - Download:
     - `en_US-lessac-medium.onnx`
     - `en_US-lessac-medium.onnx.json`
   - Place both files in `backend/voices/`

3. **Start backend server:**
   ```bash
   cd backend
   python src/server.py
   ```
   Server runs on http://localhost:5000

## Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start frontend server:**
   ```bash
   npm start
   ```
   Frontend runs on http://localhost:3000

## Usage

1. Make sure backend is running (port 5000)
2. Open http://localhost:3000 in browser
3. Enter lyrics in the textarea (one line per verse)
4. Select a mood
5. Click "Play" to hear the poetic voice with mood-matched melody

## Troubleshooting

- **Backend error "Voice files not found"**: Make sure you downloaded the Piper voice files to `backend/voices/`
- **CORS errors**: Make sure backend is running and Flask-CORS is installed
- **Audio not playing**: Check browser console for errors, make sure you click "Play" (required for audio context)

