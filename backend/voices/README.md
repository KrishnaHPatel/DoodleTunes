# Piper Voice Models

Download Piper voice models here.

## Required Voice

Download `en_US-lessac-medium` from:
- https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium

You need two files:
- `en_US-lessac-medium.onnx`
- `en_US-lessac-medium.onnx.json`

Place both files in this directory.

## Quick Download (using piper-tts package)

```bash
cd backend
python -m piper.download_voices --output-dir voices en_US-lessac-medium
```

Or manually download from Hugging Face and place files here.

