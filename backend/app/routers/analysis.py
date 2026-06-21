"""Audio analysis endpoint with file validation and mock response."""

import uuid
import os
import tempfile
import random
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Request, status, HTTPException
from fastapi.responses import JSONResponse
import logging
import soundfile as sf

from app.state import model_info
from app.services.detector import EnsembleDetector
from app.services.forensics import ForensicsAnalyzer
logger = logging.getLogger(__name__)

from app.config import settings
from app.models import AnalysisResponse, ErrorResponse
from app.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    AudioTooLongError,
    AudioProcessingError,
)

router = APIRouter(tags=["Analysis"])

# Allowed audio MIME types and extensions
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a"}
ALLOWED_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/m4a",
    "audio/mp4",
    "audio/x-m4a",
    "application/octet-stream",  # fallback for some clients
}

MAX_FILE_SIZE_BYTES = settings.max_file_size_mb * 1024 * 1024


def _get_file_extension(filename: str | None) -> str:
    """Extract and normalize file extension."""
    if not filename:
        return ""
    return os.path.splitext(filename)[1].lower()


def _validate_file_type(filename: str | None, content_type: str | None) -> None:
    """Validate that the uploaded file is wav or mp3."""
    ext = _get_file_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidFileTypeError(
            file_type=ext or "unknown",
            allowed_types=sorted(ALLOWED_EXTENSIONS),
        )


def _validate_file_size(file_size: int) -> None:
    """Validate that the file does not exceed the size limit."""
    if file_size > MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError(
            file_size_mb=file_size / (1024 * 1024),
            max_size_mb=settings.max_file_size_mb,
        )


def _get_audio_duration(file_path: str, extension: str) -> float:
    """Get audio duration in seconds."""
    try:
        import mutagen
        audio = mutagen.File(file_path)
        if audio is not None and audio.info is not None:
            return audio.info.length  # mutagen returns seconds
    except Exception:
        pass
        
    try:
        import librosa
        return librosa.get_duration(path=file_path)
    except Exception as e:
        raise AudioProcessingError(
            reason=f"Could not read audio duration. Ensure it is a valid {extension} file. ({str(e)})"
        )


def _validate_duration(duration_seconds: float) -> None:
    """Validate that the audio duration does not exceed the limit."""
    if duration_seconds > settings.max_duration_seconds:
        raise AudioTooLongError(
            duration_seconds=duration_seconds,
            max_seconds=settings.max_duration_seconds,
        )


def _generate_prediction(
    analysis_id: str,
    filename: str,
    file_size_bytes: int,
    processed_data: dict,
    detection_result,
    forensics_data: dict,
    timeline_segments: list
) -> dict:
    """Generate final response using the real ML detector results."""
    
    explanation = "Analysis completed successfully."
    
    # Merge ML prediction with preprocessing data
    return {
        "id": analysis_id,
        "filename": filename,
        "duration_seconds": round(processed_data["duration"], 2),
        "file_size_bytes": file_size_bytes,
        "prediction": detection_result.prediction,
        "confidence": round(detection_result.confidence, 4),
        "human_probability": round(detection_result.human_probability, 4),
        "ai_probability": round(detection_result.ai_probability, 4),
        "forensics": forensics_data,
        "timeline": timeline_segments,
        "sample_rate": processed_data["sample_rate"],
        "channels": processed_data["channels"],
        "peak_amplitude": processed_data["peak_amplitude"],
        "waveform": processed_data["waveform"],
        "spectrogram_image": processed_data["spectrogram_image"],
        "processed_audio_path": processed_data["processed_audio_path"],
    }


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    responses={
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported file type"},
        422: {"model": ErrorResponse, "description": "Audio too long or unprocessable"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Analyze audio for deepfake detection",
    description=(
        "Upload a WAV or MP3 audio file for AI-powered deepfake detection analysis. "
        "Maximum file size: 30 MB. Maximum duration: 5 minutes."
    ),
)
async def analyze_audio(file: UploadFile = File(..., description="Audio file (.wav or .mp3)")):
    """
    Analyze an uploaded audio file for deepfake detection.
    """
    if model_info.status != "ready":
        raise HTTPException(
            status_code=503, 
            detail=f"ML model is not ready. Status: {model_info.status}"
        )
        
    from app.utils.audio import AudioProcessor

    analysis_id = str(uuid.uuid4())

    # Step 1: Validate file type by extension
    _validate_file_type(file.filename, file.content_type)

    # Step 2: Read file content and validate size
    try:
        content = await file.read()
    except Exception:
        raise AudioProcessingError(reason="Failed to read uploaded file.")

    file_size = len(content)
    _validate_file_size(file_size)

    # Step 3: Write to temp file, validate, and execute ML preprocessing
    ext = _get_file_extension(file.filename)
    tmp_path = None
    processed_data = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Initial fast validation
        duration = _get_audio_duration(tmp_path, ext)
        _validate_duration(duration)

        # Run real AI Preprocessing pipeline
        processor = AudioProcessor()
        cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "cache"))
        processed_data = processor.process(tmp_path, cache_dir, analysis_id)

    except (FileTooLargeError, InvalidFileTypeError, AudioTooLongError, AudioProcessingError):
        raise  # Re-raise known validation errors
    except Exception as e:
        error_msg = str(e)
        if not error_msg or "NoBackendError" in str(type(e)):
            error_msg = "The audio file format is not supported or the file is corrupted. (Missing decoding backend)"
        raise AudioProcessingError(reason=error_msg)
    finally:
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    if not processed_data:
        raise AudioProcessingError(reason="Failed to process audio features.")

    # Step 4: Run Deepfake Detection
    try:
        # Read the normalized, mono, 16kHz audio array from cache
        waveform, sr = sf.read(processed_data["processed_audio_path"], dtype="float32")
        
        from app.services.detector import EnsembleDetector
        detector = EnsembleDetector(
            model_info.gary_model, model_info.gary_feature_extractor,
            model_info.bisher_model, model_info.bisher_feature_extractor,
            sample_rate=16000
        )
        detection_result = detector.analyze(waveform, sample_rate=sr)
        
        # Timeline
        timeline_segments = detector.analyze_timeline(waveform, sample_rate=sr)
        
        # Forensics
        forensics_data = ForensicsAnalyzer.analyze(waveform, sr, ai_probability=detection_result.ai_probability)
        
        # Log metrics
        logger.info(
            f"Analysis complete - ID: {analysis_id} | "
            f"Duration: {processed_data['duration']:.2f}s | "
            f"Inference Time: {detection_result.inference_time_ms:.2f}ms | "
            f"Prediction: {detection_result.prediction} | "
            f"Confidence: {detection_result.confidence:.4f} | "
            f"AI Prob: {detection_result.ai_probability:.4f} | "
            f"Human Prob: {detection_result.human_probability:.4f}"
        )
        
    except Exception as e:
        logger.error(f"Detection failed: {str(e)}")
        raise AudioProcessingError(reason=f"Model inference failed: {str(e)}")

    # Step 5: Generate response
    result = _generate_prediction(
        analysis_id=analysis_id,
        filename=file.filename or "unknown",
        file_size_bytes=file_size,
        processed_data=processed_data,
        detection_result=detection_result,
        forensics_data=forensics_data,
        timeline_segments=timeline_segments
    )

    return result
