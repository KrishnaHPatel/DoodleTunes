# DoodleTunes 🎵

### Turning doodles into short, AI-generated musical clips

## Overview

DoodleTunes is an interactive AI system that transforms simple sketches into short musical pieces. Users draw or upload three images, let AI generate lyrics inspired by the drawings, choose a mood, and hear a personalized tune come to life.

The goal of DoodleTunes is to explore how AI can bridge visual art and music, offering a playful, creative experience rather than aiming for polished commercial-quality songs.

## Features

### Sketch Recognition
Uses BEiT (Bidirectional Encoder representation from Image Transformers) to classify user sketches and extract object labels.

### AI-Generated Lyrics
Uses Hugging Face Router API with Qwen models to create short 8-line lyrics grounded in both the recognized sketches and the user-selected mood.

### Mood-Based Melody Mapping
The system uses predefined melody templates tied to different moods (Happy, Sad, Calm, Angry, Energetic, Romantic). Lyrics are synthesized with mood-matched voices using Piper TTS.

### Text-to-Speech Synthesis
Piper TTS generates natural-sounding speech with mood-specific voices, synchronized with background melodies.

### End-to-End Experience
Draw/Upload → Recognize → Generate Lyrics → Select Mood → Produce Singing Clip

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd DoodleTunes
   ```

2. **Follow the setup instructions:**
   See [SETUP.md](SETUP.md) for complete setup instructions.

3. **Run the server:**
   ```bash
   cd backend
   python app.py
   ```

4. **Open in browser:**
   Navigate to **http://localhost:8001**

## Setup Requirements

For detailed setup instructions, see [SETUP.md](SETUP.md).

**Quick checklist:**
- Python 3.8 to 3.13
- Install Python dependencies: `pip install -r backend/requirements.txt`
- Set `HF_TOKEN` environment variable (for LLM lyric generation)
- Install `piper-tts` package
- Download voice model files (6 moods, ~500MB total). See [SETUP.md](SETUP.md) for details.
- Install `torch`, `transformers`, `Pillow` for image recognition (~2GB)

## Application Flow

1. **Intro Page** → Welcome screen with "Get Started" button
2. **Page 1 (Drawing)** → Sketch or upload 3 images → BEiT generates labels
3. **Page 2 (Lyrics)** → Labels auto-filled → Select mood → Generate lyrics → Click "Next"
4. **Page 3 (Playback)** → Lyrics + mood auto-loaded → Click "Play" to hear TTS + melody

## Technology Stack

- **Backend:** Flask (Python)
- **Image Recognition:** BEiT model (transformers)
- **Lyric Generation:** Hugging Face Router API (LLM)
- **Text-to-Speech:** Piper TTS
- **Frontend:** HTML, CSS, JavaScript
- **Audio:** Tone.js, Web Audio API

## Project Structure

```
DoodleTunes/
├── backend/
│   ├── app.py              # Unified Flask server (run this!)
│   ├── requirements.txt    # Python dependencies
│   ├── lyric_generator.py  # LLM lyric generation module
│   ├── evaluation.py       # Evaluation utilities
│   ├── test_lyrics.py      # Test script for lyric generation
│   ├── voices/             # Voice model files (download required)
│   │   ├── Happy/
│   │   ├── Sad/
│   │   ├── Calm/
│   │   ├── Angry/
│   │   ├── Romantic/
│   │   └── Energetic/
│   └── src/
│       └── tts/            # TTS implementation
│           ├── piper.py    # Piper TTS wrapper
│           └── pacing.py   # Mood-based pacing and pauses
├── frontend/
│   ├── intro.html          # Welcome page (root /)
│   ├── drawing.html        # Page 1: Image recognition
│   ├── index.html          # Page 2: Lyric generation
│   ├── playback.html       # Page 3: Audio playback
│   ├── script.js           # Lyric generation page logic
│   ├── package.json        # Frontend dependencies
│   ├── melodies/           # Custom melody audio files
│   │   ├── Happy_Melody.wav
│   │   ├── Sad_Melody.wav
│   │   ├── Calm_Melody.wav
│   │   ├── Angry_Melody.wav
│   │   ├── Romantic_Melody.wav
│   │   └── Energetic_Melody.wav
│   └── src/
│       ├── api/
│       │   └── client.js   # API client for backend calls
│       ├── audio/
│       │   ├── melody.js    # Mood-based melody player
│       │   ├── mixer.js    # Audio mixing (voice + music)
│       │   └── voicePlayer.js  # Voice playback handler
│       ├── drawing.js       # Drawing page logic (canvas, BEiT API)
│       ├── playback.js     # Playback page controller
│       └── ui/
│           └── style.css   # Shared UI styles
├── README.md               # Project overview and quick start
├── SETUP.md                # Detailed setup instructions
├── package.json            # Root package.json (if present)
└── .gitignore             # Git ignore rules
```

## API Endpoints

- `POST /api/predict` - BEiT image classification
- `POST /api/generate-lyrics` - Generate lyrics from labels + mood
- `POST /api/render` - Render lyrics to speech (TTS)

## Pages

- `/` - Intro/welcome page
- `/drawing.html` - Drawing/upload page
- `/lyrics.html` - Lyric generation page
- `/playback.html` - Audio playback page

## Team

- **Selena Liu** (sl2663)
- **Reva Agrawal** (ra548)
- **Krishna Patel** (khp42)

## Troubleshooting

See [SETUP.md](SETUP.md) for details.
