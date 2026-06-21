import os
import glob
import json
import time
import librosa
import torch
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def get_audio_files():
    # Load all class_0 (Real/Human) and class_1 (Fake/AI) from the data directory
    # class_0 -> label 0
    # class_1 -> label 1
    files = []
    
    # Path is relative to the backend folder when running this script, so ../data
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    
    class_0_files = glob.glob(os.path.join(data_dir, "class_0", "*.wav")) + glob.glob(os.path.join(data_dir, "class_0", "*.mp3"))
    for f in class_0_files:
        files.append((f, 0))
        
    class_1_files = glob.glob(os.path.join(data_dir, "class_1", "*.wav")) + glob.glob(os.path.join(data_dir, "class_1", "*.mp3"))
    for f in class_1_files:
        files.append((f, 1))
        
    return files

def get_fake_label_index(id2label):
    # Dynamically find which index corresponds to "fake", "spoof", "ai"
    # and which is "real", "human", "bonafide"
    fake_idx = 1 # default
    for idx, label in id2label.items():
        l_lower = label.lower()
        if "fake" in l_lower or "spoof" in l_lower or "ai" in l_lower:
            fake_idx = idx
            break
    return fake_idx

def benchmark():
    models_to_test = [
        "garystafford/wav2vec2-deepfake-voice-detector",
        "Bisher/wav2vec2_ASV_deepfake_audio_detection"
    ]
    
    audio_files = get_audio_files()
    if not audio_files:
        print("No audio files found in ../../data/class_0 or ../../data/class_1")
        return
        
    print(f"Found {len(audio_files)} total audio files for benchmarking.")
    
    results = {}
    
    for model_name in models_to_test:
        print(f"\n======================================")
        print(f"Loading Model: {model_name}")
        
        try:
            feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
            model = AutoModelForAudioClassification.from_pretrained(model_name)
            
            fake_idx = get_fake_label_index(model.config.id2label)
            print(f"Dynamic Label Mapping -> Fake/AI is index {fake_idx}")
            
            y_true = []
            y_pred = []
            
            start_time = time.time()
            
            for file_path, true_label in audio_files:
                # Target sample rate is typically 16000 for wav2vec2 models
                target_sr = feature_extractor.sampling_rate if hasattr(feature_extractor, "sampling_rate") else 16000
                
                y, sr = librosa.load(file_path, sr=target_sr, mono=True)
                
                inputs = feature_extractor(y, sampling_rate=target_sr, return_tensors="pt", padding=True)
                
                with torch.no_grad():
                    logits = model(**inputs).logits
                    probabilities = torch.nn.functional.softmax(logits, dim=-1)
                    probs = probabilities[0].tolist()
                    
                predicted_idx = 0 if probs[0] > probs[1] else 1
                
                # If predicted_idx matches fake_idx, the model predicted Fake (1). Else Real (0).
                predicted_label = 1 if predicted_idx == fake_idx else 0
                
                y_true.append(true_label)
                y_pred.append(predicted_label)
                
            elapsed = time.time() - start_time
            
            # Calculate metrics
            accuracy = accuracy_score(y_true, y_pred)
            # Use zero_division=0 to handle cases where it predicts all one class
            precision = precision_score(y_true, y_pred, zero_division=0)
            recall = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            
            print(f"Metrics for {model_name}:")
            print(f"  Accuracy:  {accuracy:.4f}")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1 Score:  {f1:.4f}")
            print(f"  Time:      {elapsed:.2f}s")
            
            results[model_name] = {
                "accuracy": round(accuracy, 4),
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1, 4),
                "total_time_seconds": round(elapsed, 2)
            }
            
        except Exception as e:
            print(f"Error benchmarking {model_name}: {e}")
            results[model_name] = {
                "error": str(e)
            }
            
    # Save results
    output_file = os.path.join(os.path.dirname(__file__), "..", "..", "benchmark_results.json")
    with open(output_file, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"\nBenchmark complete. Results saved to {output_file}")

if __name__ == "__main__":
    benchmark()
