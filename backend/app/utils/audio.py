import os
import io
import base64
import librosa
import numpy as np
import soundfile as sf
import matplotlib
import matplotlib.pyplot as plt

# Use non-interactive backend for matplotlib to prevent thread issues
matplotlib.use('Agg')

# Register bundled ffmpeg binary so audioread can decode M4A/AAC files
try:
    import imageio_ffmpeg
    import audioread.ffdec
    _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    audioread.ffdec.COMMANDS = (_ffmpeg_exe, 'ffmpeg', 'avconv')
except ImportError:
    pass  # ffmpeg not bundled; M4A support may be unavailable

class AudioProcessor:
    """
    Utility class for AI audio preprocessing.
    Handles mono conversion, resampling, normalization, silence trimming,
    waveform extraction, and Mel Spectrogram generation.
    """

    def __init__(self, target_sr: int = 16000, max_waveform_points: int = 500, max_cache_files: int = 5):
        self.target_sr = target_sr
        self.max_waveform_points = max_waveform_points
        self.max_cache_files = max_cache_files

    def _cleanup_cache(self, cache_dir: str):
        """Keep only the most recent 'max_cache_files' processed files in the cache."""
        try:
            files = [os.path.join(cache_dir, f) for f in os.listdir(cache_dir) if f.endswith('_processed.wav')]
            if len(files) <= self.max_cache_files:
                return
            
            # Sort files by modification time, oldest first
            files.sort(key=os.path.getmtime)
            
            # Delete oldest files exceeding the limit
            files_to_delete = files[:-self.max_cache_files]
            for f in files_to_delete:
                try:
                    os.remove(f)
                except OSError:
                    pass
        except Exception as e:
            print(f"Error cleaning up cache: {e}")

    def process(self, file_path: str, cache_dir: str, analysis_id: str) -> dict:
        """
        Executes the full preprocessing pipeline on the given audio file.
        
        Args:
            file_path: Absolute path to the uploaded temporary audio file.
            cache_dir: Directory to save the processed output.
            analysis_id: Unique UUID to use for filename generation.
            
        Returns:
            Dictionary containing waveform, spectrogram image, and metadata.
        """
        # Ensure cache directory exists
        os.makedirs(cache_dir, exist_ok=True)
        
        # 1. Load, convert to mono, and resample
        # librosa automatically converts to mono if mono=True (which is the default)
        y, sr = librosa.load(file_path, sr=self.target_sr, mono=True)

        # 2. Normalize amplitude to range [-1.0, 1.0]
        y_normalized = librosa.util.normalize(y)

        # 4. Save processed audio to cache for future Wav2Vec2 inference
        processed_audio_path = os.path.join(cache_dir, f"{analysis_id}_processed.wav")
        sf.write(processed_audio_path, y_normalized, self.target_sr)

        # 5. Extract Waveform (downsample to max 500 points)
        if len(y_normalized) > self.max_waveform_points:
            # We use an integer step size to slice the numpy array quickly
            step = len(y_normalized) // self.max_waveform_points
            # Alternative is taking max/avg per bin, but simple slice is fast and acceptable for overview
            # Better approach for UI: calculate RMS or max amplitude per bin
            y_split = np.array_split(y_normalized, self.max_waveform_points)
            waveform = [float(np.max(np.abs(bin))) for bin in y_split]
        else:
            waveform = [float(val) for val in y_normalized]

        # 6. Generate Mel Spectrogram
        # Compute mel-scaled spectrogram
        S = librosa.feature.melspectrogram(y=y_normalized, sr=self.target_sr, n_mels=128, fmax=8000)
        # Convert power spectrogram to dB (log scale)
        S_dB = librosa.power_to_db(S, ref=np.max)

        # Render image
        fig, ax = plt.subplots(figsize=(10, 4))
        ax.axis('off')
        # Display the spectrogram without axes/borders
        img = librosa.display.specshow(S_dB, sr=self.target_sr, x_axis='time', y_axis='mel', fmax=8000, ax=ax, cmap='magma')
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
        plt.close(fig)
        
        # Encode to Base64
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
        spectrogram_b64 = f"data:image/png;base64,{img_b64}"
        
        # Calculate final metadata
        duration = librosa.get_duration(y=y_normalized, sr=self.target_sr)
        peak_amp = float(np.max(np.abs(y_normalized)))

        # Clean up old cache files
        self._cleanup_cache(cache_dir)

        return {
            "sample_rate": self.target_sr,
            "duration": duration,
            "channels": 1,
            "peak_amplitude": peak_amp,
            "waveform": waveform,
            "spectrogram_image": spectrogram_b64,
            "processed_audio_path": processed_audio_path
        }
