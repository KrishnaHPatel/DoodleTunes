"""
Piper TTS wrapper using onnxruntime
"""
import json
import os
import subprocess
import sys
from pathlib import Path

# Voice model path
VOICE_DIR = Path(__file__).parent.parent.parent / "voices"
VOICE_NAME = "en_US-lessac-medium"
VOICE_ONNX = VOICE_DIR / f"{VOICE_NAME}.onnx"
VOICE_JSON = VOICE_DIR / f"{VOICE_NAME}.onnx.json"

def synthesize_text(text: str) -> bytes:
    """
    Synthesize text to speech using Piper
    
    Args:
        text: Text to synthesize
        
    Returns:
        WAV audio bytes
    """
    # Check if voice files exist
    if not VOICE_ONNX.exists() or not VOICE_JSON.exists():
        raise FileNotFoundError(
            f"Voice files not found. Please download {VOICE_NAME} to {VOICE_DIR}/\n"
            f"Expected files: {VOICE_ONNX.name} and {VOICE_JSON.name}\n"
            f"Download from: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium"
        )
    
    # Use piper binary (most reliable approach)
    # Check for piper in backend directory first, then PATH, then env var
    backend_dir = Path(__file__).parent.parent.parent
    piper_local = backend_dir / "piper" / "piper"  # Binary is in piper/piper after extraction
    piper_alt = backend_dir / "piper"  # Or might be directly in backend
    
    if piper_local.exists() and os.access(piper_local, os.X_OK):
        piper_binary = str(piper_local)
    elif piper_alt.exists() and os.access(piper_alt, os.X_OK) and piper_alt.is_file():
        piper_binary = str(piper_alt)
    else:
        piper_binary = os.environ.get('PIPER_BINARY', 'piper')
    
    try:
        # Set working directory to piper directory (needed for espeak-ng-data)
        piper_dir = backend_dir / "piper" if (backend_dir / "piper").is_dir() else backend_dir
        
        result = subprocess.run(
            [piper_binary, '--model', str(VOICE_ONNX), '--output_file', '-'],
            input=text.encode('utf-8'),
            capture_output=True,
            check=True,
            cwd=str(piper_dir)  # Set working directory for dependencies
        )
        return result.stdout
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise RuntimeError(
            f"Piper TTS binary not found or failed. Error: {e}\n\n"
            f"Binary path tried: {piper_binary}\n"
            "To fix:\n"
            "1. Download piper binary from: https://github.com/rhasspy/piper/releases\n"
            "2. Extract tar.gz (creates piper/ directory)\n"
            "3. Binary should be at: backend/piper/piper\n"
            "4. Or set: export PIPER_BINARY=/path/to/piper\n"
            f"5. Make sure voice files are in: {VOICE_DIR}/\n"
            f"   Files needed: {VOICE_ONNX.name} and {VOICE_JSON.name}\n"
            f"   Download from: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium"
        )

