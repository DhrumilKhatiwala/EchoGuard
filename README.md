<div align="center">

# EchoGuard: Deepfake Audio Detection

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Deep Learning](https://img.shields.io/badge/Deep_Learning-Wav2Vec2_Ensemble-orange?style=for-the-badge)](https://huggingface.co/)

_An end-to-end deep learning platform to identify synthetic voices with high precision._

<br />

<img src="docs/demo.webp" width="100%" alt="EchoGuard Interactive Demo" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

<br />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Acknowledgements](#acknowledgements)

---

## Overview

EchoGuard is a powerful deepfake audio detection platform designed to protect against synthetic media. By combining state-of-the-art neural network ensembles with traditional digital signal processing (DSP) forensics, EchoGuard provides a highly accurate, independent, and explainable analysis of any uploaded audio file.

---

## Features

- **Real-Time Analysis**: Upload audio files (WAV, MP3, M4A/AAC) via drag-and-drop for instant evaluation in a beautiful, glassmorphic UI.
- **Interactive Demo Samples**: Instantly test the system using built-in authentic and AI-generated audio samples without needing to find your own files.
- **Timeline Segment Analysis**: Audio is processed in exact 1-second chunks through the DL pipeline to produce a time-mapped visual timeline, pinpointing exactly where deepfake artifacts occur.
- **Forensics Dashboard**: View multi-metric confidence gauges, along with a high-resolution, axes-labeled Mel-Spectrogram for deep visual frequency analysis.

---

## System Architecture

### System Overview

```mermaid
graph TB
    classDef frontend fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef backend fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef dl fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef storage fill:#0f172a,stroke:#64748b,stroke-width:2px,color:#f8fafc;

    subgraph Frontend["Frontend (Next.js 15)"]
        UI[Web Interface]:::frontend
        Upload[Audio Uploader]:::frontend
        Viz[Waveform Viewer]:::frontend
        Results[Prediction Dashboard]:::frontend
        ForensicsUI[Forensics Dashboard]:::frontend
    end

    subgraph Backend["Backend (FastAPI)"]
        API[REST API]:::backend
        Processor[Audio Processor]:::backend
        Analyzer[Ensemble Detector]:::backend
        Forensics[DSP Forensics Engine]:::backend
    end

    subgraph DL["Deep Learning Pipeline"]
        Model1[Wav2Vec2: garystafford]:::dl
        Model2[Wav2Vec2: bisher]:::dl
    end

    subgraph Storage["Storage"]
        Cache[Local Audio Cache]:::storage
        History[In-Memory Session]:::storage
    end

    UI --> Upload
    Upload --> API
    API --> Processor
    Processor --> Analyzer
    Processor --> Forensics
    Analyzer --> Model1
    Analyzer --> Model2
    Model1 --> API
    Model2 --> API
    Forensics --> API
    API --> History
    Processor --> Cache
    API --> Results
    API --> ForensicsUI
```

### Technology Stack

| Layer | Framework/Language | Key Features & Components |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, TypeScript, Tailwind | Interactive glassmorphic UI, Audio Uploader, Waveform Canvas, Timeline Visualization |
| **Backend** | FastAPI, Python 3.11 | High-performance REST architecture, in-memory caching, parallel processing |

### Deep Learning Pipeline (Deepfake Detection)

- **Architecture Strategy**: Dual-Model Ensemble Strategy utilizing Max-pooling to guarantee the highest detection sensitivity.
- **Timeline Analysis**: Audio is processed in exact 1-second chunks through the ensemble to produce a visual, time-mapped array of deepfake artifacts.

| Designation | Transformer Architecture | Primary Detection Domain |
| :--- | :--- | :--- |
| **Primary Model** | [garystafford/wav2vec2-deepfake-voice-detector](https://huggingface.co/garystafford/wav2vec2-deepfake-voice-detector) | General Synthetic Audio & AI Voice Clones |
| **Secondary Model**| [Bisher/wav2vec2_ASV_deepfake_audio_detection](https://huggingface.co/Bisher/wav2vec2_ASV_deepfake_audio_detection) | High-Fidelity TTS Engines (e.g. ElevenLabs) |

### Audio Forensics Engine (DSP)

The forensic layer relies strictly on mathematical signal processing (via `librosa`) to ensure independent, ground-truth evidence completely isolated from the neural networks.

- **Voice Naturalness**: Evaluates pitch standard deviation (`yin`) on voiced frames and pause-to-speech ratios via RMS energy thresholding.
- **Audio Quality**: Computes spectral centroids, spectral bandwidth, and square-root normalized variance of zero-crossing rates.
- **Multi-Window Analysis**: Automatically extracts distinct 5-second representative windows to prevent musical intros from corrupting the metrics.

### Data Flow

1. **Upload**: User submits an audio file via the drag-and-drop web interface.
2. **Pre-processing**: FastAPI downsamples the audio to `16kHz mono`, normalizes the amplitude, and renders Mel Spectrograms.
3. **Execution**: The audio is batched into 1-second segments and passed simultaneously through the DL Ensemble and the independent DSP engine.
4. **Synchronization**: The resulting combined payload (Detection Verdict, Timeline Array, Forensic Evidence) is generated and returned.
5. **Visualization**: The UI instantly renders the Waveform, Timeline Analysis, and Confidence Dashboards.

---

## Project Structure

```text
EchoGuard/
├── backend/                    # FastAPI Backend
│   ├── app/                    # Core API, Models, and Services
│   │   ├── services/           # DL Detector and Forensics Engines
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

## Getting Started

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

## Acknowledgements

- **HuggingFace** for providing the foundational Wav2Vec2 transformer models.
- **Librosa** for the open-source audio and music processing toolkit.
- **FastAPI** and **Next.js** for the incredible developer experience.
