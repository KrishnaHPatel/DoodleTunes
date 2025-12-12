# Quick Start - Piper TTS Setup

## Step 1: Install Backend Dependencies ✅
```bash
cd backend
pip install -r requirements.txt
```
**Done!** (You just did this)

## Step 2: Download Piper Binary

**Option A: Download Pre-built Binary (Easiest)**

1. Go to: https://github.com/rhasspy/piper/releases
2. Download for your OS:
   - Mac (Intel): `piper_macos_amd64.tar.gz`
   - Mac (Apple Silicon): `piper_macos_arm64.tar.gz`
   - Linux: `piper_linux_amd64.tar.gz`
   - Windows: `piper_windows_amd64.zip`
3. Extract the `piper` binary
4. Make it executable: `chmod +x piper`
5. Either:
   - Add to PATH, OR
   - Set environment variable: `export PIPER_BINARY=/full/path/to/piper`

**Option B: Build from Source**
- See: https://github.com/rhasspy/piper#building

## Step 3: Download Voice Model

1. Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium
2. Download these 2 files:
   - `en_US-lessac-medium.onnx` (the model)
   - `en_US-lessac-medium.onnx.json` (the config)
3. Place both files in: `backend/voices/`

## Step 4: Test

```bash
cd backend
# Test piper binary works
piper --help

# Test with voice
echo "Hello world" | piper --model voices/en_US-lessac-medium.onnx --output_file test.wav
# Play test.wav to verify it works
```

## Step 5: Start Server

```bash
cd backend
python src/server.py
```

Server should start on http://localhost:5000

## Troubleshooting

- **"piper: command not found"**: Set `PIPER_BINARY` environment variable
- **"Voice files not found"**: Make sure both .onnx and .onnx.json files are in `backend/voices/`
- **Permission denied**: Run `chmod +x piper` on the binary

