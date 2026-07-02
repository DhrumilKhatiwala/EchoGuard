import numpy as np
import librosa

class ForensicsAnalyzer:
    """
    Independent Audio Forensics Engine.
    Evaluates raw DSP features to compute Voice Naturalness and Audio Quality.
    Completely independent of deep learning models and classifier predictions.
    """

    @staticmethod
    def analyze(waveform: np.ndarray, sr: int, ai_probability: float = 0.0) -> dict:
        # ai_probability is kept in the signature strictly for API compatibility.
        # It is NEVER referenced or used in any score, characteristic, or calculation.
        
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
            "pitch_range": [],
            "mean_pitch": [],
            "pause_ratio": [],
            "speech_ratio": [],
            "sc_mean": [],
            "sb_mean": [],
            "rms_cons": [],
            "zcr_cons": []
        }

        for w in windows:
            if len(w) == 0:
                continue

            # --- Adaptive Pause & Speech Detection ---
            # Using 20th percentile of RMS energy as adaptive baseline statistic
            rms = librosa.feature.rms(y=w)[0]
            if len(rms) > 0:
                p20 = np.percentile(rms, 20)
                p95 = np.percentile(rms, 95)
                # Adaptive silence threshold: p20 + 10% of dynamic range
                adaptive_threshold = p20 + 0.10 * max(0.0, p95 - p20)
                
                pause_ratio = float(np.mean(rms < adaptive_threshold))
                speech_ratio = 1.0 - pause_ratio
                
                # RMS Consistency via percentile-based normalization
                # If dynamic range or variance is smooth, consistency is high
                rms_cv = np.std(rms) / (np.mean(rms) + 1e-6)
                rms_cons = float(np.clip(100.0 * np.exp(-1.5 * rms_cv), 0.0, 100.0))
            else:
                adaptive_threshold = 0.0
                pause_ratio = 1.0
                speech_ratio = 0.0
                rms_cons = 0.0

            metrics["pause_ratio"].append(pause_ratio)
            metrics["speech_ratio"].append(speech_ratio)
            metrics["rms_cons"].append(rms_cons)

            # --- Pitch Dynamics ---
            try:
                f0 = librosa.yin(w, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr)
                min_len = min(len(f0), len(rms))
                f0_trimmed = f0[:min_len]
                rms_trimmed = rms[:min_len]
                
                # Filter strictly for active speech frames above adaptive threshold
                valid_f0 = f0_trimmed[rms_trimmed >= adaptive_threshold]
                if len(valid_f0) > 5:
                    f0_std = float(np.std(valid_f0))
                    f0_mean = float(np.mean(valid_f0))
                    # Pitch range: 90th percentile - 10th percentile to avoid spurious outlier jumps
                    f0_range = float(np.percentile(valid_f0, 90) - np.percentile(valid_f0, 10))
                    
                    metrics["pitch_std"].append(f0_std)
                    metrics["pitch_range"].append(f0_range)
                    metrics["mean_pitch"].append(f0_mean)
                else:
                    metrics["pitch_std"].append(0.0)
                    metrics["pitch_range"].append(0.0)
                    metrics["mean_pitch"].append(0.0)
            except Exception:
                metrics["pitch_std"].append(0.0)
                metrics["pitch_range"].append(0.0)
                metrics["mean_pitch"].append(0.0)

            # --- Spectral & Temporal Quality ---
            sc = librosa.feature.spectral_centroid(y=w, sr=sr)[0]
            sb = librosa.feature.spectral_bandwidth(y=w, sr=sr)[0]
            zcr = librosa.feature.zero_crossing_rate(y=w)[0]

            metrics["sc_mean"].append(float(np.mean(sc)))
            metrics["sb_mean"].append(float(np.mean(sb)))
            
            # ZCR consistency: exponential decay normalization of zero-crossing variation
            zcr_cv = np.std(zcr) / (np.mean(zcr) + 1e-6)
            zcr_cons = float(np.clip(100.0 * np.exp(-1.0 * zcr_cv), 0.0, 100.0))
            metrics["zcr_cons"].append(zcr_cons)

        # Safely average all windowed metrics
        avg_pitch_std = float(np.mean(metrics["pitch_std"])) if metrics["pitch_std"] else 0.0
        avg_pitch_range = float(np.mean(metrics["pitch_range"])) if metrics["pitch_range"] else 0.0
        avg_mean_pitch = float(np.mean(metrics["mean_pitch"])) if metrics["mean_pitch"] else 0.0
        avg_pause_ratio = float(np.mean(metrics["pause_ratio"])) if metrics["pause_ratio"] else 0.0
        avg_speech_ratio = float(np.mean(metrics["speech_ratio"])) if metrics["speech_ratio"] else 0.0
        avg_sc_mean = float(np.mean(metrics["sc_mean"])) if metrics["sc_mean"] else 0.0
        avg_sb_mean = float(np.mean(metrics["sb_mean"])) if metrics["sb_mean"] else 0.0
        avg_rms_cons = float(np.mean(metrics["rms_cons"])) if metrics["rms_cons"] else 0.0
        avg_zcr_cons = float(np.mean(metrics["zcr_cons"])) if metrics["zcr_cons"] else 0.0

        # --- 2. PURE DSP SCORING: VOICE NATURALNESS ---
        # Depends strictly on: pitch variation, pitch range, pause ratio
        # Non-linear Gaussian/exponential normalization across full 0-100 spectrum
        
        # 1) Pitch variation score (ideal conversational speech std is ~35 Hz)
        pitch_std_score = float(np.clip(100.0 * np.exp(-((avg_pitch_std - 38.0) / 30.0)**2), 0.0, 100.0))
        
        # 2) Pitch range score (ideal conversational range is ~80-160 Hz between 10th and 90th percentile)
        pitch_range_score = float(np.clip(100.0 * (1.0 - np.exp(-avg_pitch_range / 50.0)), 0.0, 100.0))
        
        # 3) Pause ratio score (ideal conversational pause ratio is ~15% to 30%)
        pause_score = float(np.clip(100.0 * np.exp(-((avg_pause_ratio - 0.22) / 0.16)**2), 0.0, 100.0))
        
        # Combine purely from DSP weights without artificial score clamping
        raw_naturalness = 0.40 * pitch_std_score + 0.35 * pitch_range_score + 0.25 * pause_score
        voice_naturalness_val = int(np.round(np.clip(raw_naturalness, 0.0, 100.0)))

        # --- 3. PURE DSP SCORING: AUDIO QUALITY ---
        # Depends strictly on: spectral centroid, spectral bandwidth, RMS consistency, ZCR consistency
        
        # 1) Spectral Centroid score (ideal voice clarity is ~1800-3000 Hz)
        sc_score = float(np.clip(100.0 * np.exp(-((avg_sc_mean - 2300.0) / 1400.0)**2), 0.0, 100.0))
        
        # 2) Spectral Bandwidth score (square-root normalization for rich harmonic structure)
        sb_score = float(np.clip(100.0 * np.sqrt(min(avg_sb_mean, 2600.0) / 2600.0), 0.0, 100.0))
        
        # Combine purely from DSP quality components
        raw_quality = 0.30 * sc_score + 0.30 * sb_score + 0.20 * avg_rms_cons + 0.20 * avg_zcr_cons
        audio_quality_val = int(np.round(np.clip(raw_quality, 0.0, 100.0)))

        # --- 4. DETECTED CHARACTERISTICS (DERIVED EXCLUSIVELY FROM DSP) ---
        characteristics = []
        
        # Pitch evaluations
        if avg_pitch_std < 12.0:
            characteristics.append("⚠ Voice sounds flat or monotone")
        elif avg_pitch_std > 70.0:
            characteristics.append("⚠ Unnatural jumps in voice pitch")
        else:
            characteristics.append("✓ Lively and natural speaking voice")
            
        # Rhythm evaluations
        if avg_pause_ratio < 0.08:
            characteristics.append("⚠ Robotic speaking rhythm with no pauses")
        elif avg_pause_ratio > 0.45:
            characteristics.append("⚠ Unusually long awkward silences")
        else:
            characteristics.append("✓ Natural conversational breathing and pauses")
            
        # Spectral frequency evaluations
        if avg_sb_mean < 1100.0:
            characteristics.append("⚠ Audio sounds muffled or compressed")
        elif avg_sc_mean >= 1500.0:
            characteristics.append("✓ Crisp and clear recording quality")
        else:
            characteristics.append("⚠ Sound is muffled or lacks detail")
            
        # Recording consistency evaluations
        if avg_rms_cons >= 70.0 and avg_zcr_cons >= 70.0:
            characteristics.append("✓ Steady volume and clean recording")
        elif avg_rms_cons < 50.0:
            characteristics.append("⚠ Volume levels jump around during recording")

        characteristics = characteristics[:4]

        # --- 5. STRUCTURED RESULTS & CONFIDENCE ---
        # Determine confidence and reasons based strictly on DSP signal characteristics
        if voice_naturalness_val >= 75:
            nat_conf = "High"
            nat_reason = "Sounds like a real person talking naturally"
        elif voice_naturalness_val >= 50:
            nat_conf = "Medium"
            nat_reason = "Normal speaking rhythm and voice tone"
        else:
            nat_conf = "High" if len(windows) >= 2 else "Medium"
            nat_reason = "Voice sounds flat, robotic, or artificial"

        if audio_quality_val >= 75:
            qual_conf = "High"
            qual_reason = "Clear and steady microphone sound"
        elif audio_quality_val >= 50:
            qual_conf = "Medium"
            qual_reason = "Good audio clarity and balance"
        else:
            qual_conf = "Medium"
            qual_reason = "Muffled sound or uneven volume levels"

        structured_naturalness = {
            "score": voice_naturalness_val,
            "confidence": nat_conf,
            "reason": nat_reason
        }

        structured_quality = {
            "score": audio_quality_val,
            "confidence": qual_conf,
            "reason": qual_reason
        }

        # --- 6. ADVANCED ANALYSIS (COLLAPSED & UNDERSTANDABLE) ---
        advanced = {
            "Mean Pitch": f"{avg_mean_pitch:.1f} Hz",
            "Pitch Variation": f"{avg_pitch_std:.1f} Hz",
            "Spectral Profile": f"{int(avg_sc_mean)} Hz",
            "Recording Consistency": f"{int(avg_rms_cons)}%"
        }

        return {
            "voice_naturalness": structured_naturalness,
            "audio_quality": structured_quality,
            "characteristics": characteristics,
            "advanced": advanced
        }
