"""
Lyric Generator Module for DoodleTunes
Generates 8-10 line lyrics based on object labels and emotions using free LLM APIs.
"""

import os
import json
import random
import requests
from typing import List, Dict, Optional
from dataclasses import dataclass
import re


API_URL = "https://router.huggingface.co/v1/chat/completions"



@dataclass
class LyricRequest:
    """Request structure for lyric generation"""
    labels: List[str]  # Object labels from sketch recognition
    emotion: str  # User-selected mood/emotion
    num_lines: int = 8  # Target number of lines (8-10)


@dataclass
class LyricResponse:
    """Response structure for generated lyrics"""
    lyrics: str
    source: str  # 'llm' or 'template'
    labels_used: List[str]
    emotion: str
    model: Optional[str] = None


class LyricGenerator:
    """Main class for generating lyrics using LLM with template fallback"""
    
    def __init__(self, api_key: Optional[str] = None, provider: str = "huggingface", model: Optional[str] = None):
        """
        Initialize the lyric generator.
        
        Args:
            api_key: API key for LLM service (optional for some providers)
            provider: LLM provider ('huggingface', 'groq', 'ollama')
            model: Model identifier or alias. Examples:
                   - 'mistral' (default)
                   - 'qwen3'
                   - 'Qwen/Qwen3-1.7B'
                   - full router id like 'Qwen/Qwen3-1.7B:featherless-ai'
        """
        self.api_key = api_key 
        self.provider = provider
        self.model_name = self._resolve_model_name(model or os.getenv("LLM_MODEL") or "mistral")
        self.templates = self._load_templates()
    
    def _resolve_model_name(self, requested: str) -> str:
        """Map friendly aliases to full router model ids"""
        provider_suffix = os.getenv("HF_PROVIDER", "featherless-ai")
        alias = requested.strip().lower()
        
        # Common aliases
        if alias in ("mistral", "mistral-7b", "mistralai"):
            return f"mistralai/Mistral-7B-Instruct-v0.2:{provider_suffix}"
        if alias in ("qwen3", "qwen3-1.7b", "qwen"):
            return f"Qwen/Qwen3-1.7B:{provider_suffix}"
        
        # If already contains a provider suffix, accept as-is
        if ":" in requested:
            return requested
        
        # Otherwise, append provider suffix
        return f"{requested}:{provider_suffix}"
        
    def _load_templates(self) -> Dict[str, List[str]]:
        """Load template fallback lyrics organized by emotion"""
        return {
            "happy": [
                "I see {label} in the bright blue sky,\n"
                "Dancing freely, flying high.\n"
                "Joyful moments pass us by,\n"
                "With {label} we can touch the sky.\n"
                "Laughter fills the air so sweet,\n"
                "Every moment is a treat.\n"
                "Together we are complete,\n"
                "With {label} our hearts will beat."
            ],
            "sad": [
                "The {label} stands alone and still,\n"
                "As shadows fall upon the hill.\n"
                "Memories that time can't kill,\n"
                "The {label} waits with patient will.\n"
                "Tears fall like gentle rain,\n"
                "Easing moments of the pain.\n"
                "Through the darkness we remain,\n"
                "The {label} helps us to sustain."
            ],
            "energetic": [
                "The {label} moves with power and might,\n"
                "Bursting forward into the light.\n"
                "Energy flows both day and night,\n"
                "The {label} fills us with delight.\n"
                "Rhythm pulses through the air,\n"
                "Nothing can compare.\n"
                "The {label} shows us how to care,\n"
                "With energy beyond compare."
            ],
            "calm": [
                "The {label} rests in peaceful grace,\n"
                "Moving slowly through time and space.\n"
                "A gentle smile upon its face,\n"
                "The {label} finds its quiet place.\n"
                "Softly flowing like a stream,\n"
                "Fulfilling every dream.\n"
                "The {label} helps us to redeem,\n"
                "A calm and tranquil theme."
            ],
            "energetic": [
                "The {label} moves with power and might,\n"
                "Bursting forward into the light.\n"
                "Energy flows both day and night,\n"
                "The {label} fills us with delight.\n"
                "Rhythm pulses through the air,\n"
                "Nothing can compare.\n"
                "The {label} shows us how to care,\n"
                "With energy beyond compare."
            ],
            "romantic": [
                "The {label} blooms in spring's embrace,\n"
                "Filling hearts with gentle grace.\n"
                "Love flows through time and space,\n"
                "The {label} finds its perfect place.\n"
                "Softly touching hand in hand,\n"
                "Together we will stand.\n"
                "The {label} helps us understand,\n"
                "The beauty of this land."
            ]
        }
    
    def generate_lyrics(self, request: LyricRequest) -> LyricResponse:
        """
        Generate lyrics based on labels and emotion.
        Tries LLM first, falls back to templates if needed.
        """
        # Try LLM generation first
        try:
            lyrics = self._generate_with_llm(request)
            if lyrics:
                # Try validation, but be lenient - if LLM returned something, use it
                if self._validate_lyrics(lyrics, request) or len(lyrics.strip()) > 50:
                    return LyricResponse(
                        lyrics=lyrics,
                        source="llm",
                        labels_used=request.labels,
                        emotion=request.emotion,
                        model=self.model_name
                    )
                else:
                    print(f"LLM response failed validation, but using it anyway: {len(lyrics)} chars")
                    return LyricResponse(
                        lyrics=lyrics,
                        source="llm",
                        labels_used=request.labels,
                        emotion=request.emotion,
                        model=self.model_name
                    )
        except Exception as e:
            print(f"LLM generation failed: {e}")
        
        # Fall back to template only if LLM completely failed
        print("Falling back to template - LLM generation failed")
        lyrics = self._generate_with_template(request)
        return LyricResponse(
            lyrics=lyrics,
            source="template",
            labels_used=request.labels,
            emotion=request.emotion,
            model=self.model_name
        )
    
    def _generate_with_llm(self, request: LyricRequest) -> Optional[str]:
        """Generate lyrics using LLM API"""
        prompt = self._create_prompt(request)
        
        if self.provider == "huggingface":
            result = self._call_huggingface(prompt)
            if result:
                return result
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    def _create_prompt(self, request: LyricRequest) -> str:
        """Create a well-crafted prompt for lyric generation"""
        labels_str = ", ".join(request.labels)
        
        prompt = f"""
        Write a short poem verse with exactly {request.num_lines} lines about {labels_str}.
Requirements:
- Make it easy to sing, easy to understand, and easy to remember
- change up the structure of the poem, use longer sentences and shorter sentences
- Use simple vocabulary and grammar and avoid end rhymes
- Reference the objects ({labels_str}) naturally
- Match the {request.emotion} mood
example poem: The Road Not Taken - Robert Frost: 
Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.

example poem 2: Walking Like a Robin - Bernadette Mayer:
take 3 or 4 steps then stop
look smell taste touch & hear
is there anything to eat?
oh look, there’s some caviar
it must be my birthday, thanks
i must be very old, like seventy…

Write ONLY the lyrics, don't include any other text,one line per line, no numbering or labels:"""
        
        # Soft switch to discourage thinking mode in Qwen3 (the model may still
        # emit an empty <think> block; we strip any remaining think content later)
        prompt += "\n/no_think"
        return prompt
    
    def _wrap_mistral_inst(self, content: str) -> str:
        """Wrap content using Mistral's [INST]...[/INST] chat format."""
        return f"<s>[INST] {content.strip()} [/INST]"
    
    def _call_huggingface(self, prompt: str) -> Optional[str]:
        """Call Hugging Face Router chat/completions"""
        api_key = os.getenv("HF_TOKEN") or self.api_key
        
        url = "https://router.huggingface.co/v1/chat/completions"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        # Sampling parameters (use milder settings to reduce repetition)
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        presence_penalty = float(os.getenv("LLM_PRESENCE_PENALTY", "1.0"))
        max_tokens = int(os.getenv("LLM_MAX_TOKENS", "220"))
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": self.model_name,
            "temperature": temperature,
            "presence_penalty": presence_penalty,
            "max_tokens": max_tokens
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                cleaned = self._clean_lyrics(content)
                if cleaned:
                    return cleaned
            elif response.status_code == 401:
                # Try without auth token - some public models work without auth
                if api_key:
                    headers_no_auth = {"Content-Type": "application/json"}
                    response_no_auth = requests.post(url, headers=headers_no_auth, json=payload, timeout=30)
                    if response_no_auth.status_code == 200:
                        result = response_no_auth.json()
                        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        cleaned = self._clean_lyrics(content)
                        if cleaned:
                            return cleaned
                print(f"Hugging Face Router authentication error: {response.status_code}. Please set HF_TOKEN environment variable.")
            else:
                print(f"Hugging Face Router error: {response.status_code} - {response.text[:200]}")
            return None
        except Exception as e:
            print(f"Hugging Face Router exception: {e}")
            return None
    
    def _call_huggingface_new_api(self, prompt: str, model: str) -> Optional[str]:
        """Deprecated shim; retained for compatibility but not used."""
        return None
    
    def _call_huggingface_fallback(self, prompt: str) -> Optional[str]:
        """Fallback to a smaller, always-available model"""
        # For now, return None to trigger template fallback
        print("Hugging Face API unavailable, using template fallback")
        return None
    
    def _clean_lyrics(self, text: str) -> str:
        """Clean and format generated lyrics"""
        if not text:
            return ""
        
        # Remove Qwen3 thinking content, if present
        # Strip any <think>...</think> blocks (case-insensitive, dotall)
        text = re.sub(r"(?is)<think>.*?</think>", "", text)
        
        # Remove prompt if it was included
        lines = text.strip().split('\n')
        
        # Filter out empty lines and lines that look like prompts
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith(('Write', 'Requirements', 'The lyrics', 'Emotion', 'thinking content:', 'content:')):
                # Remove numbering and bullets
                line = line.lstrip('0123456789.-) ')
                if line:
                    cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _validate_lyrics(self, lyrics: str, request: LyricRequest) -> bool:
        """Validate that lyrics meet basic requirements"""
        lines = [l.strip() for l in lyrics.split('\n') if l.strip()]
        
        # Check line count (allow some flexibility)
        if len(lines) < request.num_lines - 2 or len(lines) > request.num_lines + 2:
            return False
        
        # Check if labels are mentioned (at least one)
        lyrics_lower = lyrics.lower()
        labels_mentioned = any(label.lower() in lyrics_lower for label in request.labels)
        
        return labels_mentioned and len(lines) >= 6
    
    def _generate_with_template(self, request: LyricRequest) -> str:
        """Generate lyrics using template fallback"""
        emotion = request.emotion.lower()
        
        # Get template for emotion, or use 'happy' as default
        template = self.templates.get(emotion, self.templates.get("happy", list(self.templates.values())[0]))
        
        # Select a random template if multiple exist
        if isinstance(template, list):
            template = random.choice(template)
        
        # Replace label placeholders
        # Use first label, or combine multiple labels
        if len(request.labels) > 0:
            label = request.labels[0]  # Use first label primarily
            lyrics = template.format(label=label)
            
            # If multiple labels, try to incorporate them
            if len(request.labels) > 1:
                lyrics = lyrics.replace(label, f"{label} and {request.labels[1]}", 1)
        else:
            lyrics = template.format(label="the world")
        
        return lyrics


# Example usage and testing
if __name__ == "__main__":
    # Initialize generator (no API key needed for Hugging Face free tier)
    generator = LyricGenerator(provider="huggingface")
    
    # Example request
    request = LyricRequest(
        labels=["cat", "moon"],
        emotion="energetic",
        num_lines=8
    )
    
    print("Generating lyrics...")
    response = generator.generate_lyrics(request)
    
    print(f"\nSource: {response.source}")
    print(f"Labels: {response.labels_used}")
    print(f"Emotion: {response.emotion}")
    print(f"\nLyrics:\n{response.lyrics}")

