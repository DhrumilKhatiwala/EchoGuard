import numpy as np
import librosa

class ForensicsAnalyzer:
    """
    Independent Audio Forensics Engine.
    Evaluates raw DSP features to compute Voice Naturalness and Audio Quality.
    Does not rely on or mirror the ML deepfake predictions.
    """

    @staticmethod
    def analyze(waveform: np.ndarray, sr: int, ai_probability: float = 0.0) -> dict:
        # ai_probability is kept in the signature to avoid breaking API consumers
        # but it is entirely ignored in the logic to ensure independent forensic evaluation.
        
        # --- 1. Multi-Window Analysis ---
        window_duration = 5 * sr
        if len(waveform) > 15 * sr:
            # Extract 3 representative windows
            w1 = waveform[:window_duration]
            mid_start = len(waveform) // 2 - window_duration // 2
            w2 = waveform[mid_start : mid_start + window_duration]
            w3 = waveform[-window_duration:]
            windows = [w1, w2, w3]
        elif len(waveform) > window_duration:
            w1 = waveform[:window_duration]
            w2 = waveform[-window_duration:]
            windows = [w1, w2]
        else:
            windows = [waveform]

        metrics = {
            "pitch_std": [],
            "mean_pitch": [],
            "pause_ratio": [],
            "sc_mean": [],
            "sb_mean": [],
            "rms_var": [],
            "zcr_var": []
        }

        for w in windows:
            # Protect against empty windows
            if len(w) == 0:
                continue

            # Rhythm / Pauses (do this first to get RMS threshold)
            rms = librosa.feature.rms(y=w)[0]
            if len(rms) > 0:
                max_rms = np.max(rms)
                silence_threshold = max_rms * 0.15 # 15% of peak energy
                pause_ratio = np.mean(rms < silence_threshold)
                metrics["pause_ratio"].append(pause_ratio)
                metrics["rms_var"].append(np.var(rms))
            else:
                silence_threshold = 0
                metrics["pause_ratio"].append(1.0)
                metrics["rms_var"].append(0.0)

            # Pitch
            try:
                f0 = librosa.yin(w, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr)
                # Ensure shapes match just in case
                min_len = min(len(f0), len(rms))
                f0_trimmed = f0[:min_len]
                rms_trimmed = rms[:min_len]
                
                # Only consider frames with actual energy
                valid_f0 = f0_trimmed[rms_trimmed >= silence_threshold]
                if len(valid_f0) > 0:
                    metrics["pitch_std"].append(np.std(valid_f0))
                    metrics["mean_pitch"].append(np.mean(valid_f0))
                else:
                    metrics["pitch_std"].append(0.0)
                    metrics["mean_pitch"].append(0.0)
            except Exception:
                metrics["pitch_std"].append(0.0)
                metrics["mean_pitch"].append(0.0)

            # Quality / Clarity
            sc = librosa.feature.spectral_centroid(y=w, sr=sr)[0]
            sb = librosa.feature.spectral_bandwidth(y=w, sr=sr)[0]
            zcr = librosa.feature.zero_crossing_rate(y=w)[0]

            metrics["sc_mean"].append(np.mean(sc))
            metrics["sb_mean"].append(np.mean(sb))
            metrics["zcr_var"].append(np.var(zcr))

        # Safely average metrics
        avg_pitch_std = float(np.mean(metrics["pitch_std"])) if metrics["pitch_std"] else 0.0
        avg_mean_pitch = float(np.mean(metrics["mean_pitch"])) if metrics["mean_pitch"] else 0.0
        avg_pause_ratio = float(np.mean(metrics["pause_ratio"])) if metrics["pause_ratio"] else 0.0
        avg_sc_mean = float(np.mean(metrics["sc_mean"])) if metrics["sc_mean"] else 0.0
        avg_sb_mean = float(np.mean(metrics["sb_mean"])) if metrics["sb_mean"] else 0.0
        avg_rms_var = float(np.mean(metrics["rms_var"])) if metrics["rms_var"] else 0.0
        avg_zcr_var = float(np.mean(metrics["zcr_var"])) if metrics["zcr_var"] else 0.0

        # --- 2. SCORING: VOICE NATURALNESS ---
        # Pitch variation score (natural human speech has std dev between ~20 and 60 Hz)
        if avg_pitch_std < 10:
            pitch_score = 20
        elif 10 <= avg_pitch_std <= 80:
            pitch_score = 100 - (abs(avg_pitch_std - 45) / 35.0) * 80
        else:
            pitch_score = max(0, 50 - ((avg_pitch_std - 80) / 100.0) * 50)

        # Rhythm score (human speech has ~15-30% pauses)
        if avg_pause_ratio < 0.05:
            rhythm_score = 30 # Too continuous
        elif 0.05 <= avg_pause_ratio <= 0.35:
            rhythm_score = 100 - (abs(avg_pause_ratio - 0.20) / 0.15) * 40
        else:
            rhythm_score = max(10, 60 - ((avg_pause_ratio - 0.35) / 0.65) * 50)

        voice_naturalness = int(np.clip(0.6 * pitch_score + 0.4 * rhythm_score, 0, 100))

        # --- 3. SCORING: AUDIO QUALITY ---
        # Clarity (Spectral centroid)
        if 500 < avg_sc_mean < 4000:
            clarity_score = 100 - (abs(avg_sc_mean - 2250) / 1750.0) * 40
        else:
            clarity_score = 40
            
        # Frequency Distribution
        freq_dist_score = min(100, max(0, (avg_sb_mean / 2500.0) * 100))

        # Stability (Square-root normalization to prevent clustering at 90-100)
        energy_score = np.clip(100 * (1 - np.sqrt(avg_rms_var * 50)), 0, 100)
        temporal_score = np.clip(100 * (1 - np.sqrt(avg_zcr_var * 50)), 0, 100)

        audio_quality = int(np.clip(0.4 * clarity_score + 0.2 * freq_dist_score + 0.2 * energy_score + 0.2 * temporal_score, 0, 100))

        # --- 4. CHARACTERISTICS (EVIDENCE) ---
        characteristics = []
        
        # Natural variations
        if 20 <= avg_pitch_std <= 60 and 0.10 <= avg_pause_ratio <= 0.30:
            characteristics.append("✓ Natural voice fluctuations")
        elif avg_pitch_std < 12:
            characteristics.append("⚠ Limited voice variation detected")
        elif avg_pitch_std > 100:
            characteristics.append("⚠ Unnatural voice changes")
            
        # Rhythm
        if avg_pause_ratio < 0.05:
            characteristics.append("⚠ Repetitive speech patterns observed")
        elif avg_pause_ratio > 0.40:
            characteristics.append("⚠ Unnatural speaking rhythm")
            
        # Frequency
        if avg_sb_mean > 1500 and 1000 < avg_sc_mean < 3500:
            characteristics.append("✓ Clear audio structure")
        elif avg_sb_mean < 1000:
            characteristics.append("⚠ Unusually uniform audio characteristics")

        # Cap to 4 findings max to keep UI clean
        characteristics = characteristics[:4]

        # --- 5. ADVANCED ANALYSIS ---
        advanced = {
            "Mean Pitch": f"{avg_mean_pitch:.1f} Hz",
            "Pitch Variation": f"{avg_pitch_std:.1f} Hz",
            "Spectral Profile": f"{avg_sc_mean:.1f} Hz",
            "Recording Consistency": f"{energy_score:.1f} %"
        }

        return {
            "voice_naturalness": voice_naturalness,
            "audio_quality": audio_quality,
            "characteristics": characteristics,
            "advanced": advanced
        }
