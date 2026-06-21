<div align="center">

# EchoGuard: Deepfake Audio Detection 🛡️🎙️

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Machine Learning](https://img.shields.io/badge/Machine_Learning-Wav2Vec2_Ensemble-orange?style=for-the-badge)](https://huggingface.co/)

_An end-to-end machine learning platform to identify synthetic voices with military-grade precision._

<br />

<img src="docs/demo.webp" width="100%" alt="EchoGuard Interactive Demo" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

<br />

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Acknowledgements](#-acknowledgements)

---

## 🎯 Overview

EchoGuard is a powerful deepfake audio detection platform designed to protect against synthetic media. By combining state-of-the-art neural network ensembles with traditional digital signal processing (DSP) forensics, EchoGuard provides a highly accurate, independent, and explainable analysis of any uploaded audio file.

---

## ✨ Features

- **Real-Time Analysis**: Upload audio files (WAV, MP3, M4A/AAC) via drag-and-drop for instant evaluation in a beautiful, glassmorphic UI.
- **Timeline Segment Analysis**: Audio is processed in exact 1-second chunks through the ML pipeline to produce a time-mapped visual timeline, pinpointing exactly where deepfake artifacts occur.
- **Forensics Dashboard**: View multi-metric confidence gauges with spectral, temporal, and consistency breakdowns.

---

## 🧠 Machine Learning Pipeline

Our solution relies on a robust and highly scalable dual-layer architecture:

### 1. Audio Preprocessing
- Uploaded files are normalized and downsampled to 16kHz mono audio.
- Mel Spectrograms and Waveforms are generated for visual timeline tracking.

### 2. Dual-Model Ensemble Detection
We dynamically load and execute multiple HuggingFace Wav2Vec2 models simultaneously to maximize detection sensitivity across different synthetic domains:
- **General Deepfakes:** `garystafford/wav2vec2-deepfake-audio-detection`
- **High-Fidelity TTS:** `bisher/wav2vec2-deepfake-audio-detection-elevenlabs`
- **Strategy:** Max-pooling is applied across the models to output the highest AI probability, maximizing security.

### 3. Independent DSP Forensics Engine
To provide ground-truth evidence, a deterministic signal processing layer (via `librosa`) operates completely independently from the neural networks:
- **Voice Naturalness:** Analyzes pitch variance (`librosa.yin`) and exact pause-to-speech ratios using RMS energy thresholds.
- **Audio Quality:** Evaluates spectral centroids, spectral bandwidth, and zero-crossing rates.

---

## 📁 Project Structure

```text
EchoGuard/
├── backend/                    # FastAPI Backend
│   ├── app/                    # Core API, Models, and Services
│   │   ├── services/           # ML Detector and Forensics Engines
│   │   └── routers/            # API Endpoints
│   └── requirements.txt        # Python dependencies
├── frontend/                   # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/                # React App Router pages
│   │   └── components/         # Interactive UI components
│   └── package.json            # Node.js dependencies
├── docs/                       # Architecture diagrams and documentation
├── .gitignore                  # Defines ignored files and directories
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js (v20+)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/username/echoguard.git
   cd echoguard
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   ```

4. **Execute the Application:**
   - Start the backend API: `uvicorn app.main:app --reload --port 8000`
   - Start the frontend UI (in a new terminal): `npm run dev`
   - Access the application at `http://localhost:3000`.

---

## 🙏 Acknowledgements

- **HuggingFace** for providing the foundational Wav2Vec2 transformer models.
- **Librosa** for the open-source audio and music processing toolkit.
- **FastAPI** and **Next.js** for the incredible developer experience.
