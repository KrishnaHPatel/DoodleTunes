"""
Piper TTS wrapper using piper-tts Python package
"""
import io
from pathlib import Path
from typing import Optional
from piper.voice import PiperVoice

# Voice model path
VOICE_DIR = Path(__file__).parent.parent.parent / "voices"

# Mood to voice mapping (based on folder structure)
MOOD_VOICE_MAP = {
    "Happy": "en_US-ryan-high",
    "Sad": "en_US-libritts-high",
    "Calm": "en_US-kristin-medium",
    "Angry": "en_US-john-medium",
    "Romantic": "en_GB-northern_english_male-medium",
    "Energetic": "en_GB-semaine-medium",
}

# Cache for loaded voices
_voice_cache: dict[str, PiperVoice] = {}

def get_voice_paths_for_mood(mood: str) -> tuple[Path, Path]:
    """
    Get paths to voice model files based on mood
    
    Args:
        mood: Mood name (e.g., "Happy", "Sad")
        
    Returns:
        Tuple of (onnx_path, json_path)
    """
    # Get voice name for this mood
    voice_name = MOOD_VOICE_MAP.get(mood, MOOD_VOICE_MAP["Calm"])
    
    # Voice files are in mood-specific folders
    mood_dir = VOICE_DIR / mood
    onnx_path = mood_dir / f"{voice_name}.onnx"
    json_path = mood_dir / f"{voice_name}.onnx.json"
    
    return onnx_path, json_path, voice_name

def get_voice_paths(voice_name: str) -> tuple[Path, Path]:
    """
    Get paths to voice model files (legacy method for direct voice name)
    
    Args:
        voice_name: Name of the voice (e.g., "en_US-ljspeech-high")
        
    Returns:
        Tuple of (onnx_path, json_path)
    """
    # Try to find in any mood folder
    for mood_dir in VOICE_DIR.iterdir():
        if mood_dir.is_dir():
            onnx_path = mood_dir / f"{voice_name}.onnx"
            json_path = mood_dir / f"{voice_name}.onnx.json"
            if onnx_path.exists() and json_path.exists():
                return onnx_path, json_path
    
    # Fallback to old structure (if voice was in root)
    onnx_path = VOICE_DIR / f"{voice_name}.onnx"
    json_path = VOICE_DIR / f"{voice_name}.onnx.json"
    return onnx_path, json_path

def load_voice_for_mood(mood: str) -> PiperVoice:
    """
    Load a Piper voice model based on mood (with caching)
    
    Args:
        mood: Mood name (e.g., "Happy", "Sad")
        
    Returns:
        Loaded PiperVoice instance
    """
    # Get voice name for this mood
    voice_name = MOOD_VOICE_MAP.get(mood, MOOD_VOICE_MAP["Calm"])
    cache_key = f"{mood}:{voice_name}"
    
    if cache_key in _voice_cache:
        return _voice_cache[cache_key]
    
    onnx_path, json_path, actual_voice_name = get_voice_paths_for_mood(mood)
    
    if not onnx_path.exists() or not json_path.exists():
        raise FileNotFoundError(
            f"Voice files not found for mood '{mood}'.\n"
            f"Expected files: {onnx_path.name} and {json_path.name}\n"
            f"Place them in: {onnx_path.parent}/\n"
            f"Download from: https://huggingface.co/rhasspy/piper-voices"
        )
    
    voice = PiperVoice.load(str(onnx_path), str(json_path))
    _voice_cache[cache_key] = voice
    return voice

def load_voice(voice_name: str = None, mood: str = None) -> PiperVoice:
    """
    Load a Piper voice model (with caching)
    
    Args:
        voice_name: Name of the voice model (legacy, use mood instead)
        mood: Mood name (preferred method)
        
    Returns:
        Loaded PiperVoice instance
    """
    if mood:
        return load_voice_for_mood(mood)
    
    # Legacy: direct voice name
    if not voice_name:
        voice_name = MOOD_VOICE_MAP["Calm"]
    
    if voice_name in _voice_cache:
        return _voice_cache[voice_name]
    
    onnx_path, json_path = get_voice_paths(voice_name)
    
    if not onnx_path.exists() or not json_path.exists():
        raise FileNotFoundError(
            f"Voice files not found for {voice_name}.\n"
            f"Expected files: {onnx_path.name} and {json_path.name}\n"
            f"Place them in: {VOICE_DIR}/\n"
            f"Download from: https://huggingface.co/rhasspy/piper-voices"
        )
    
    voice = PiperVoice.load(str(onnx_path), str(json_path))
    _voice_cache[voice_name] = voice
    return voice

def synthesize_text(text: str, mood: str = "Calm", voice_name: str = None) -> bytes:
    """
    Synthesize text to speech using Piper
    
    Args:
        text: Text to synthesize
        mood: Mood name to select appropriate voice (preferred)
        voice_name: Name of the voice model to use (legacy, overrides mood if provided)
        
    Returns:
        WAV audio bytes
    """
    if voice_name:
        voice = load_voice(voice_name=voice_name)
    else:
        voice = load_voice(mood=mood)
    
    # Synthesize text - returns generator of AudioChunk objects
    audio_chunks = list(voice.synthesize(text))
    
    if not audio_chunks:
        raise RuntimeError("No audio generated from text")
    
    # Get audio parameters from first chunk
    sample_rate = audio_chunks[0].sample_rate
    num_channels = audio_chunks[0].sample_channels
    bits_per_sample = audio_chunks[0].sample_width * 8
    
    # Combine all audio data
    audio_data = b''.join(chunk.audio_int16_bytes for chunk in audio_chunks)
    data_size = len(audio_data)
    
    # WAV header (44 bytes)
    wav_header = b'RIFF'
    wav_header += (36 + data_size).to_bytes(4, 'little')  # File size - 8
    wav_header += b'WAVE'
    wav_header += b'fmt '
    wav_header += (16).to_bytes(4, 'little')  # fmt chunk size
    wav_header += (1).to_bytes(2, 'little')  # Audio format (PCM)
    wav_header += num_channels.to_bytes(2, 'little')
    wav_header += sample_rate.to_bytes(4, 'little')
    wav_header += (sample_rate * num_channels * bits_per_sample // 8).to_bytes(4, 'little')  # Byte rate
    wav_header += (num_channels * bits_per_sample // 8).to_bytes(2, 'little')  # Block align
    wav_header += bits_per_sample.to_bytes(2, 'little')
    wav_header += b'data'
    wav_header += data_size.to_bytes(4, 'little')
    
    return wav_header + audio_data

