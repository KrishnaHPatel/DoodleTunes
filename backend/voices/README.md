# Voice Files

This folder contains Piper TTS voice model files for each mood.

## Required Structure

```
voices/
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

## Download Instructions

See the main [SETUP.md](../SETUP.md) file for download links and instructions.

Each voice file is 60-120MB, so downloading all 6 moods requires ~500MB of space.

## Verification

After downloading, verify the structure:
```bash
ls -la backend/voices/*/*.onnx
ls -la backend/voices/*/*.onnx.json
```

You should see 12 files total (6 moods × 2 files each).

