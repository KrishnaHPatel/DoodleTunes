# Piper TTS Setup Guide

## Option 1: Use Piper Binary (Recommended - Easiest)

1. **Download Piper binary:**
   - Go to: https://github.com/rhasspy/piper/releases
   - Download the latest release for your OS (e.g., `piper_macos_amd64.tar.gz` for Mac)
   - Extract and place `piper` binary somewhere in your PATH, or set `PIPER_BINARY` environment variable

2. **Download voice model:**
   - Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium
   - Download:
     - `en_US-lessac-medium.onnx`
     - `en_US-lessac-medium.onnx.json`
   - Place both files in `backend/voices/`

3. **Set environment variable (if piper not in PATH):**
   ```bash
   export PIPER_BINARY=/path/to/piper
   ```

## Option 2: Use Python Package (If Available)

Some forks of piper have Python packages, but the main rhasspy/piper repo is archived.

Try:
```bash
pip install piper-tts
```

If that doesn't work, use Option 1 (binary).

## Testing

After setup, test:
```bash
cd backend
python -c "from src.tts.piper import synthesize_text; print('Piper loaded successfully')"
```

