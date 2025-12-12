"""
Evaluation Framework for Lyric Relevance Study
Helps conduct user studies to evaluate how well generated lyrics match labels and emotions.
"""

import json
import csv
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from lyric_generator import LyricGenerator, LyricRequest, LyricResponse


@dataclass
class EvaluationEntry:
    """Single evaluation entry from a user"""
    timestamp: str
    labels: List[str]
    emotion: str
    lyrics: str
    source: str  # 'llm' or 'template'
    model: Optional[str] = None
    
    # User ratings (1-5 scale)
    label_relevance: Optional[int] = None  # How well lyrics match labels
    emotion_match: Optional[int] = None  # How well lyrics match emotion
    overall_quality: Optional[int] = None  # Overall lyric quality
    singability: Optional[int] = None  # How singable the lyrics are
    
    # Optional feedback
    comments: Optional[str] = None
    user_id: Optional[str] = None


class LyricEvaluator:
    """Framework for evaluating lyric generation quality"""
    
    def __init__(self, results_file: str = "evaluation_results.json"):
        self.results_file = results_file
        self.evaluations: List[EvaluationEntry] = []
        self._load_existing_results()
    
    def _load_existing_results(self):
        """Load existing evaluation results"""
        try:
            with open(self.results_file, 'r') as f:
                data = json.load(f)
                self.evaluations = [
                    EvaluationEntry(**entry) for entry in data
                ]
        except FileNotFoundError:
            self.evaluations = []
    
    def save_evaluation(self, entry: EvaluationEntry):
        """Save a single evaluation entry"""
        entry.timestamp = datetime.now().isoformat()
        self.evaluations.append(entry)
        self._save_results()
    
    def _save_results(self):
        """Save all evaluations to file"""
        data = [asdict(eval_entry) for eval_entry in self.evaluations]
        with open(self.results_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def export_to_csv(self, csv_file: str = "evaluation_results.csv"):
        """Export evaluations to CSV for analysis"""
        with open(csv_file, 'w', newline='') as f:
            if not self.evaluations:
                return
            
            fieldnames = [
                'timestamp', 'user_id', 'labels', 'emotion', 'source', 'model',
                'label_relevance', 'emotion_match', 'overall_quality', 'singability',
                'comments', 'lyrics'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for entry in self.evaluations:
                row = asdict(entry)
                row['labels'] = ', '.join(row['labels'])
                writer.writerow(row)
    
    def generate_evaluation_set(self, generator: LyricGenerator, 
                                test_cases: List[Dict]) -> List[EvaluationEntry]:
        """
        Generate a set of lyrics for evaluation.
        
        Args:
            generator: LyricGenerator instance
            test_cases: List of dicts with 'labels' and 'emotion' keys
        
        Returns:
            List of EvaluationEntry objects ready for user evaluation
        """
        evaluation_set = []
        
        for case in test_cases:
            request = LyricRequest(
                labels=case['labels'],
                emotion=case['emotion'],
                num_lines=case.get('num_lines', 8)
            )
            
            response = generator.generate_lyrics(request)
            
            entry = EvaluationEntry(
                timestamp=datetime.now().isoformat(),
                labels=response.labels_used,
                emotion=response.emotion,
                lyrics=response.lyrics,
                source=response.source,
                model=getattr(response, "model", None)
            )
            
            evaluation_set.append(entry)
        
        return evaluation_set
    
    def generate_evaluation_set_for_models(self, generators: List[LyricGenerator], 
                                           test_cases: List[Dict]) -> List[EvaluationEntry]:
        """Generate combined evaluation entries across multiple generators/models"""
        combined: List[EvaluationEntry] = []
        for gen in generators:
            combined.extend(self.generate_evaluation_set(gen, test_cases))
        return combined
    
    def get_statistics(self) -> Dict:
        """Calculate statistics from all evaluations"""
        if not self.evaluations:
            return {"error": "No evaluations found"}
        
        # Filter entries with complete ratings
        complete = [e for e in self.evaluations 
                   if all([e.label_relevance, e.emotion_match, e.overall_quality])]
        
        if not complete:
            return {"error": "No complete evaluations found"}
        
        stats = {
            "total_evaluations": len(self.evaluations),
            "complete_evaluations": len(complete),
            "average_label_relevance": sum(e.label_relevance for e in complete) / len(complete),
            "average_emotion_match": sum(e.emotion_match for e in complete) / len(complete),
            "average_overall_quality": sum(e.overall_quality for e in complete) / len(complete),
            "llm_vs_template": {
                "llm_count": sum(1 for e in complete if e.source == "llm"),
                "template_count": sum(1 for e in complete if e.source == "template"),
                "llm_avg_quality": sum(e.overall_quality for e in complete if e.source == "llm") / 
                                 max(1, sum(1 for e in complete if e.source == "llm")),
                "template_avg_quality": sum(e.overall_quality for e in complete if e.source == "template") / 
                                      max(1, sum(1 for e in complete if e.source == "template"))
            }
        }
        
        if any(e.singability for e in complete):
            stats["average_singability"] = sum(e.singability for e in complete if e.singability) / \
                                          len([e for e in complete if e.singability])
        
        return stats
    
    def print_statistics(self):
        """Print statistics in a readable format"""
        stats = self.get_statistics()
        
        if "error" in stats:
            print(f"Error: {stats['error']}")
            return
        
        print("\n" + "="*50)
        print("EVALUATION STATISTICS")
        print("="*50)
        print(f"Total evaluations: {stats['total_evaluations']}")
        print(f"Complete evaluations: {stats['complete_evaluations']}")
        print(f"\nAverage Ratings (1-5 scale):")
        print(f"  Label Relevance: {stats['average_label_relevance']:.2f}")
        print(f"  Emotion Match: {stats['average_emotion_match']:.2f}")
        print(f"  Overall Quality: {stats['average_overall_quality']:.2f}")
        if 'average_singability' in stats:
            print(f"  Singability: {stats['average_singability']:.2f}")
        
        print(f"\nLLM vs Template Comparison:")
        print(f"  LLM entries: {stats['llm_vs_template']['llm_count']}")
        print(f"  Template entries: {stats['llm_vs_template']['template_count']}")
        print(f"  LLM avg quality: {stats['llm_vs_template']['llm_avg_quality']:.2f}")
        print(f"  Template avg quality: {stats['llm_vs_template']['template_avg_quality']:.2f}")
        print("="*50 + "\n")


def create_evaluation_interface():
    """Create a simple CLI interface for user evaluation"""
    print("\n" + "="*60)
    print("LYRIC EVALUATION INTERFACE")
    print("="*60)
    print("Rate each lyric on a scale of 1-5")
    print("1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent\n")


def evaluate_lyric_interactive(entry: EvaluationEntry) -> EvaluationEntry:
    """Interactive evaluation of a single lyric entry"""
    print(f"\nLabels: {', '.join(entry.labels)}")
    print(f"Emotion: {entry.emotion}")
    print(f"Source: {entry.source}")
    if getattr(entry, "model", None):
        print(f"Model: {entry.model}")
    print(f"\nLyrics:\n{entry.lyrics}\n")
    
    try:
        entry.label_relevance = int(input("Label Relevance (1-5): "))
        entry.emotion_match = int(input("Emotion Match (1-5): "))
        entry.overall_quality = int(input("Overall Quality (1-5): "))
        entry.singability = int(input("Singability (1-5): "))
        entry.comments = input("Comments (optional): ").strip() or None
        entry.user_id = input("User ID (optional): ").strip() or None
    except ValueError:
        print("Invalid input. Please enter numbers only.")
    except KeyboardInterrupt:
        print("\nEvaluation cancelled.")
    
    return entry


# Example usage
if __name__ == "__main__":
    # Create generator (Qwen only)
    qwen_gen = LyricGenerator(provider="huggingface", model="qwen3")
    print("Initialized generators for Mistral and Qwen3")
    
    # Create evaluator
    evaluator = LyricEvaluator()
    
    # Define test cases
    test_cases = [
        {"labels": ["cat", "moon"], "emotion": "energetic", "num_lines": 8},
        {"labels": ["sun", "flower"], "emotion": "happy", "num_lines": 8},
        {"labels": ["rain", "umbrella"], "emotion": "sad", "num_lines": 8},
        {"labels": ["bird", "tree"], "emotion": "calm", "num_lines": 8},
    ]
    
    # Generate evaluation set (Qwen only)
    print("Generating lyrics for evaluation (Qwen3)...")
    evaluation_set = evaluator.generate_evaluation_set(qwen_gen, test_cases)
    
    # Interactive evaluation
    create_evaluation_interface()
    for entry in evaluation_set:
        evaluate_lyric_interactive(entry)
        evaluator.save_evaluation(entry)
        print("\n" + "-"*60)
    
    # Print statistics
    evaluator.print_statistics()
    evaluator.export_to_csv()

