"""
Quick test script for lyric generation
Run this to test different LLM providers and see results
"""

from lyric_generator import LyricGenerator, LyricRequest


def test_generator(provider="huggingface", model=None):
    """Test lyric generation with different scenarios"""
    
    print(f"\n{'='*60}")
    label = f"{provider.upper()} Provider" + (f" | Model: {model}" if model else "")
    print(f"Testing {label}")
    print(f"{'='*60}\n")
    
    generator = LyricGenerator(provider=provider, model=model)
    
    test_cases = [
        {
            "labels": ["cat", "moon"],
            "emotion": "calm",
            "description": "Calm cat and moon"
        },
        {
            "labels": ["sun", "flower"],
            "emotion": "happy",
            "description": "Happy sun and flower"
        },
        {
            "labels": ["rain"],
            "emotion": "sad",
            "description": "Sad rain"
        },
        {
            "labels": ["bird", "tree", "sky"],
            "emotion": "energetic",
            "description": "energetic bird, tree, and sky"
        },
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {case['description']}")
        print("-" * 60)
        
        request = LyricRequest(
            labels=case["labels"],
            emotion=case["emotion"],
            num_lines=8
        )
        
        try:
            response = generator.generate_lyrics(request)
            
            print(f"Source: {response.source}")
            print(f"Labels: {', '.join(response.labels_used)}")
            print(f"Emotion: {response.emotion}")
            print(f"\nLyrics:\n{response.lyrics}\n")
            
        except Exception as e:
            print(f"Error: {e}\n")
    
    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    import sys
    
    # Test Hugging Face (default, no API key needed)
    print("Testing Hugging Face (free tier, no API key required)...")
    test_generator("huggingface", model="mistral")
    test_generator("huggingface", model="qwen3")
    
    # Uncomment to test other providers (requires setup)
    # if os.getenv("GROQ_API_KEY"):
    #     print("Testing Groq...")
    #     test_generator("groq")
    # 
    # print("Testing Ollama (requires Ollama to be running)...")
    # test_generator("ollama")

