# 🛡️ EchoGuard

> **AI-powered deepfake audio detection platform — identify synthetic voices with military-grade precision.**

---

## ✨ Features
- **Dynamic Single-Model Selection**: Automatically loads the best-performing HuggingFace Wav2Vec2 model based on benchmark F1 scores and inference time to use in production.
- **Advanced DSP Forensics**: Utilizes deterministic digital signal processing algorithms (via `librosa`) for granular analysis of pitch variance, temporal stability, and spectral banding.
- **Broad Format Support**: Analyzes multiple audio formats, including WAV, MP3, and M4A/AAC (powered by an embedded `ffmpeg` binary).
- **Real-Time Analysis**: Upload audio files via drag & drop and receive instant deepfake detection results.
- **Waveform & Timeline Visualization**: Interactive audio waveform viewer with segment-level AI analysis overlay.
- **Confidence Scoring**: Multi-metric confidence gauge with spectral, temporal, and consistency breakdowns.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Python (3.11+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/username/echoguard.git
   ```
2. Navigate to the directory:
   ```bash
   cd echoguard
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Environment Setup
```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

## 💻 Usage

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Start frontend (in a new terminal)
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:8000`.

## 🏗️ Architecture

EchoGuard utilizes a single, dynamically-loaded primary ML model in conjunction with traditional DSP techniques to evaluate deepfakes.

```text
Upload (WAV/MP3/M4A)
↓
Audio Preprocessing (Mono, 16kHz resample, normalization)
↓
DeepFake Detector (Wav2Vec2 HuggingFace Model)
↓
DSP Forensics Evaluation (librosa)
↓
Prediction & Metrics Calculation
```

## 📊 Model Evaluation
EchoGuard was evaluated using both in-domain and out-of-domain datasets to assess real-world robustness.

### In-Domain Evaluation
- **Dataset:** Deepfake Audio Detection Dataset v4 (Gary Stafford)
- **F1 Score:** 94.7%
- **Interpretation:** The detector performs strongly when evaluated on audio generated from distributions similar to those seen during training.

### Out-of-Domain Evaluation
- **Dataset:** Hemg/Deepfakeaudio
- **F1 Score:** 0.0%
- **Interpretation:** The detector failed to generalize to this unseen dataset and defaulted to predicting the majority class, highlighting a fundamental challenge in cross-domain deepfake detection.

## ⚠️ Limitations
- Sensitivity to dataset distribution shifts and reduced performance on previously unseen synthetic voice generators.
- Results should be interpreted as probabilistic decision support, not definitive proof.

## 🔮 Future Work
- Multi-model ensemble detection (currently uses a single best model)
- Cross-dataset benchmarking and domain adaptation
- Explainable AI feature attribution

## 🛠️ Built With
- [Next.js 15](https://nextjs.org/) — React framework with App Router
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python API framework
- [Transformers](https://huggingface.co/docs/transformers/index) — HuggingFace Machine Learning library
- [Librosa](https://librosa.org/) — Audio and music processing in Python
- [imageio-ffmpeg](https://github.com/imageio/imageio-ffmpeg) — FFmpeg distribution for Python

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/username/echoguard/issues).

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
