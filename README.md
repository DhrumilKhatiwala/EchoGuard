# 🛡️ EchoGuard

> **AI-powered deepfake audio detection platform — identify synthetic voices with military-grade precision.**

---

## ✨ Features
- **Dual-Model Ensemble Detection**: Dynamically loads and runs multiple HuggingFace Wav2Vec2 models simultaneously (general and ElevenLabs-optimized), using a max-pooling strategy to maximize detection sensitivity.
- **Independent DSP Forensics Engine**: Utilizes deterministic digital signal processing algorithms (via `librosa`) for granular analysis of pitch variance, pause ratios, and spectral banding. The forensic layer is mathematically independent from the neural network predictions.
- **Timeline Segment Analysis**: Audio is processed in exact 1-second chunks through the ML pipeline to produce a time-mapped visual timeline, pinpointing exactly where deepfake artifacts occur.
- **Broad Format Support**: Analyzes multiple audio formats, including WAV, MP3, and M4A/AAC (powered by an embedded `ffmpeg` binary).
- **Real-Time Analysis**: Upload audio files via drag & drop and receive instant deepfake detection results in a beautiful, glassmorphic UI.

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

EchoGuard utilizes a powerful dual-model ML ensemble in conjunction with traditional DSP techniques to evaluate deepfakes. See `docs/architecture.md` for detailed flowcharts and component breakdowns.

```text
Upload (WAV/MP3/M4A)
↓
Audio Preprocessing (Mono, 16kHz resample, normalization)
↓
Dual-Model Ensemble (Wav2Vec2 HuggingFace Models)
↓
Independent DSP Forensics Evaluation (Multi-window extraction)
↓
Prediction, Timeline & Metrics Calculation
```

## 📊 Model Evaluation
EchoGuard employs an ensemble approach to maximize robustness across different synthetic generation methods.
- **General Deepfakes:** `garystafford/wav2vec2-deepfake-audio-detection` (Strong performance on standard deepfake datasets).
- **High-Fidelity TTS:** `bisher/wav2vec2-deepfake-audio-detection-elevenlabs` (Specifically tuned to catch advanced ElevenLabs generation).

## ⚠️ Limitations
- Sensitivity to dataset distribution shifts and reduced performance on completely unseen synthetic voice generators.
- Results should be interpreted as probabilistic decision support, not definitive proof.

## 🔮 Future Work
- Explainable AI feature attribution maps.
- Advanced speaker diarization for multi-speaker recordings.

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
