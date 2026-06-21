import time
import torch
import numpy as np
from dataclasses import dataclass

@dataclass
class DetectionResult:
    human_probability: float
    ai_probability: float
    prediction: str
    confidence: float
    inference_time_ms: float

class EnsembleDetector:
    """
    Runs inference on multiple deepfake detection models and aggregates the results.
    Specifically uses a 'Max-Ensemble' strategy: The final AI probability is the 
    maximum AI probability across all models. This ensures robustness against both
    standard synthetic voices and SOTA deepfakes (like ElevenLabs).
    """
    def __init__(self, gary_model, gary_fe, bisher_model, bisher_fe, sample_rate: int = 16000):
        self.gary_model = gary_model
        self.gary_fe = gary_fe
        self.bisher_model = bisher_model
        self.bisher_fe = bisher_fe
        self.target_sample_rate = sample_rate

    def _get_probs(self, model, fe, waveform) -> tuple[float, float]:
        """Returns (human_prob, ai_prob) for a single model."""
        inputs = fe(
            waveform, 
            sampling_rate=self.target_sample_rate, 
            return_tensors="pt", 
            padding=True
        )
        with torch.no_grad():
            logits = model(**inputs).logits
            probabilities = torch.nn.functional.softmax(logits, dim=-1)
            
        id2label = model.config.id2label
        fake_idx = 1
        for idx, label in id2label.items():
            l_lower = label.lower()
            if "fake" in l_lower or "spoof" in l_lower or "ai" in l_lower:
                fake_idx = idx
                break
        
        human_idx = 1 if fake_idx == 0 else 0
        probs = probabilities[0].tolist()
        return probs[human_idx], probs[fake_idx]

    def analyze(self, waveform: np.ndarray, sample_rate: int = 16000) -> DetectionResult:
        if sample_rate != self.target_sample_rate:
            raise ValueError(f"Detector requires sample rate of {self.target_sample_rate}Hz. Got {sample_rate}Hz.")

        start_time = time.time()
        
        # Cap waveform to 10 seconds to prevent OOM and quadratic attention lag
        max_samples = 10 * self.target_sample_rate
        if len(waveform) > max_samples:
            waveform = waveform[:max_samples]
            
        try:
            # 1. Run Garystafford model
            g_hp, g_ap = self._get_probs(self.gary_model, self.gary_fe, waveform)
            
            # 2. Run Bisher model
            b_hp, b_ap = self._get_probs(self.bisher_model, self.bisher_fe, waveform)
            
            # 3. Aggregate (Max-Ensemble for AI probability)
            final_ai_prob = max(g_ap, b_ap)
            final_human_prob = 1.0 - final_ai_prob
            
            is_human = final_human_prob > final_ai_prob
            prediction = "LIKELY HUMAN" if is_human else "LIKELY AI GENERATED"
            confidence = final_human_prob if is_human else final_ai_prob
            
            inference_time_ms = (time.time() - start_time) * 1000
            
            return DetectionResult(
                human_probability=final_human_prob,
                ai_probability=final_ai_prob,
                prediction=prediction,
                confidence=confidence,
                inference_time_ms=inference_time_ms
            )
            
        except Exception as e:
            raise RuntimeError(f"Deepfake ensemble detection failed during inference: {str(e)}")

    def _get_batch_probs(self, model, fe, chunks, batch_size=10) -> list[tuple[float, float]]:
        """Returns list of (human_prob, ai_prob) for a batch of chunks."""
        all_probs = []
        
        # Determine the fake index dynamically once
        id2label = model.config.id2label
        fake_idx = 1
        for idx, label in id2label.items():
            l_lower = label.lower()
            if "fake" in l_lower or "spoof" in l_lower or "ai" in l_lower:
                fake_idx = idx
                break
        human_idx = 1 if fake_idx == 0 else 0
        
        # Process in smaller batches to prevent OOM
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            inputs = fe(
                batch, 
                sampling_rate=self.target_sample_rate, 
                return_tensors="pt", 
                padding=True
            )
            with torch.no_grad():
                logits = model(**inputs).logits
                probabilities = torch.nn.functional.softmax(logits, dim=-1)
                
            probs_list = probabilities.tolist()
            all_probs.extend([(p[human_idx], p[fake_idx]) for p in probs_list])
            
        return all_probs

    def analyze_timeline(self, waveform: np.ndarray, sample_rate: int = 16000) -> list:
        if sample_rate != self.target_sample_rate:
            raise ValueError(f"Detector requires sample rate of {self.target_sample_rate}Hz. Got {sample_rate}Hz.")
        
        window_size = sample_rate # 1 second windows
        segments = []
        num_windows = len(waveform) // window_size
        
        chunks = []
        for i in range(num_windows):
            start_sample = i * window_size
            end_sample = start_sample + window_size
            chunks.append(waveform[start_sample:end_sample])
            
        has_remainder = False
        if len(waveform) % window_size > int(window_size * 0.1):
            start_sample = num_windows * window_size
            chunks.append(waveform[start_sample:])
            has_remainder = True
            
        if not chunks:
            return []
            
        try:
            g_probs = self._get_batch_probs(self.gary_model, self.gary_fe, chunks)
            b_probs = self._get_batch_probs(self.bisher_model, self.bisher_fe, chunks)
            
            for i in range(len(chunks)):
                g_hp, g_ap = g_probs[i]
                b_hp, b_ap = b_probs[i]
                
                final_ap = max(g_ap, b_ap)
                final_hp = 1.0 - final_ap
                
                if final_hp > 0.70:
                    lbl = "Human-like"
                elif final_ap > 0.70:
                    lbl = "Suspicious"
                else:
                    lbl = "Neutral"
                    
                start_sec = float(i)
                end_sec = float(i + 1)
                
                if has_remainder and i == len(chunks) - 1:
                    end_sec = float(len(waveform) / sample_rate)
                    
                segments.append({
                    "start": start_sec,
                    "end": end_sec,
                    "label": lbl,
                    "human_probability": float(final_hp),
                    "ai_probability": float(final_ap)
                })
        except Exception as e:
            for i in range(len(chunks)):
                start_sec = float(i)
                end_sec = float(i + 1) if not (has_remainder and i == len(chunks) - 1) else float(len(waveform) / sample_rate)
                segments.append({
                    "start": start_sec,
                    "end": end_sec,
                    "label": "Neutral",
                    "human_probability": 0.5,
                    "ai_probability": 0.5
                })
                
        return segments
