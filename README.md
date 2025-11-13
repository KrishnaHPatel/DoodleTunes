# DoodleTunes 🎵
### Turning doodles into short, AI-generated musical clips

## Overview
DoodleTunes is an interactive AI system that transforms simple sketches into short musical pieces. Users draw an object—or several—and optionally choose a mood. The system then identifies the doodled objects, generates lyrics based on them, selects an appropriate melody, and produces a short vocalized clip.

The goal of DoodleTunes is to explore how AI can bridge visual art and music, offering a playful, creative experience rather than aiming for polished commercial-quality songs.

## Features

### 🎨 Sketch Recognition
Uses a lightweight QuickDraw/TF.js model to classify user doodles and extract 2–3 likely object labels.

### ✍️ AI-Generated Lyrics
A language model creates short 8–10 line lyrics grounded in both the recognized sketches and the user-selected mood.

### 🎶 Mood-Based Melody Mapping
The system uses predefined melody templates tied to different moods. Lyrics are syllabified and aligned to melody notes using simple heuristics to ensure they can be sung naturally.

### 🗣️ Lightweight Singing Synthesis
Tone.js and sampled vocal-like sounds approximate singing, producing a short musical clip that reflects both mood and doodle content.

### 🔄 End-to-End Experience
Draw → Recognize → Generate Lyrics → Select Melody → Produce Singing Clip

## Usage
1. Open the DoodleTunes web application.
2. Draw a doodle on the provided canvas.
3. Select a mood from the predefined list.
4. Click **Generate Song**.
5. Listen to the AI-generated singing clip created from your doodle.

## Team
- **Selena Liu** (sl2663)
- **Reva Agrawal** (ra548)
- **Krishna Patel** (khp42)