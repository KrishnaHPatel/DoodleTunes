"""
Dynamic pacing algorithm for poetic delivery
"""
from typing import List, Dict

MOOD_PROFILES = {
    "Calm": {
        "bpm": 80,
        "basePauseMs": 450,
        "pauseScale": 1.15
    },
    "Sad": {
        "bpm": 70,
        "basePauseMs": 520,
        "pauseScale": 1.25
    },
    "Romantic": {
        "bpm": 85,
        "basePauseMs": 500,
        "pauseScale": 1.2
    },
    "Happy": {
        "bpm": 120,
        "basePauseMs": 320,
        "pauseScale": 0.95
    },
    "Energetic": {
        "bpm": 150,
        "basePauseMs": 240,
        "pauseScale": 0.85
    },
    "Angry": {
        "bpm": 140,
        "basePauseMs": 220,
        "pauseScale": 0.8
    }
}

def get_mood_profile(mood: str) -> Dict:
    """Get mood profile or default to Calm"""
    return MOOD_PROFILES.get(mood, MOOD_PROFILES["Calm"])

def compute_pauses(lyrics_lines: List[str], mood_profile: Dict) -> List[int]:
    """
    Compute pause duration (in ms) after each line
    
    Rules:
    - Ends with . ! ? → +250ms
    - Ends with , ; : → +120ms
    - Long line (wordCount > 9) → +150ms
    - Short line (wordCount < 4) → +80ms
    - Contains ... → +300ms
    """
    pauses = []
    base_pause = mood_profile["basePauseMs"]
    pause_scale = mood_profile["pauseScale"]
    
    for line in lyrics_lines:
        line = line.strip()
        if not line:
            pauses.append(300)  # Default pause for empty lines
            continue
        
        # Count words
        words = line.split()
        word_count = len(words)
        
        # Start with base pause
        pause_ms = base_pause
        
        # Punctuation rules
        last_char = line[-1] if line else ''
        if last_char in '.!?':
            pause_ms += 250
        elif last_char in ',;:':
            pause_ms += 120
        
        # Length rules
        if word_count > 9:
            pause_ms += 150
        elif word_count < 4:
            pause_ms += 80
        
        # Ellipsis rule
        if '...' in line:
            pause_ms += 300
        
        # Apply mood scale
        pause_ms = pause_ms * pause_scale
        
        # Clamp between 120ms and 900ms
        pause_ms = max(120, min(900, int(pause_ms)))
        
        pauses.append(pause_ms)
    
    return pauses

