"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class PredictionLabel(str, Enum):
    """Possible prediction outcomes."""
    AI_GENERATED = "AI Generated"
    HUMAN = "Human"
    UNCERTAIN = "Uncertain"

class ForensicMetrics(BaseModel):
    voice_naturalness: int
    audio_quality: int
    characteristics: List[str]
    advanced: Dict[str, str]

class TimelineSegment(BaseModel):
    start: float
    end: float
    label: str
    human_probability: float
    ai_probability: float
class AnalysisResponse(BaseModel):
    """Response schema for the /analyze endpoint."""
    id: str = Field(..., description="Unique analysis ID")
    filename: str = Field(..., description="Original uploaded filename")
    duration_seconds: float = Field(..., description="Audio duration in seconds")
    file_size_bytes: int = Field(..., description="File size in bytes")
    
    # ML Preprocessing Data
    sample_rate: int = Field(..., description="Audio sample rate in Hz")
    channels: int = Field(..., description="Number of audio channels (1 for mono)")
    peak_amplitude: float = Field(..., description="Peak amplitude after normalization")
    waveform: list[float] = Field(..., description="Downsampled waveform array (max 500 points)")
    spectrogram_image: str = Field(..., description="Base64 encoded PNG of the Mel Spectrogram")
    processed_audio_path: str = Field(..., description="Path to the cached processed WAV file")

    # Prediction
    prediction: str = Field(..., description="Prediction label: 'AI Generated', 'Human', or 'Uncertain'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0 and 1")
    human_probability: float = Field(..., description="Human probability")
    ai_probability: float = Field(..., description="AI probability")
    
    # Forensics
    forensics: ForensicMetrics = Field(..., description="Simplified forensics metrics")
    timeline: List[TimelineSegment] = Field(..., description="1-second chunk analysis")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    "filename": "suspicious_call.wav",
                    "duration_seconds": 12.5,
                    "file_size_bytes": 1024000,
                    "sample_rate": 16000,
                    "channels": 1,
                    "peak_amplitude": 0.85,
                    "waveform": [0.12, -0.23, 0.45],
                    "spectrogram_image": "data:image/png;base64,iVBORw0KGgo...",
                    "processed_audio_path": "backend/cache/a1b2c3d4_processed.wav",
                    "prediction": "AI Generated",
                    "confidence": 0.92,
                    "human_probability": 0.08,
                    "ai_probability": 0.92,
                    "forensics": {
                        "voice_naturalness": 40,
                        "audio_quality": 85,
                        "speech_stability": 92,
                        "characteristics": ["⚠ Limited voice variation detected"],
                        "advanced": {"Mean Pitch (Hz)": "120.5"}
                    },
                    "timeline": [
                        {"start": 0.0, "end": 1.0, "label": "Suspicious", "human_probability": 0.1, "ai_probability": 0.9}
                    ]
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Response schema for the /health endpoint."""
    status: str
    service: str
    version: str
    uptime_seconds: float


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    error: str = Field(..., description="Error type identifier")
    detail: str = Field(..., description="Human-readable error description")
    status_code: int = Field(..., description="HTTP status code")
