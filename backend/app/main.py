"""EchoGuard API — FastAPI application entry point."""

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routers import analysis, stats

logger = logging.getLogger(__name__)

_startup_time = time.time()

from app.state import model_info

@asynccontextmanager
async def lifespan(app: FastAPI):
    model_info.status = "loading"
    
    try:
        from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
        
        model_name_gary = "garystafford/wav2vec2-deepfake-voice-detector"
        model_info.gary_feature_extractor = AutoFeatureExtractor.from_pretrained(model_name_gary)
        model_info.gary_model = AutoModelForAudioClassification.from_pretrained(model_name_gary)
        
        model_name_bisher = "Bisher/wav2vec2_ASV_deepfake_audio_detection"
        model_info.bisher_feature_extractor = AutoFeatureExtractor.from_pretrained(model_name_bisher)
        model_info.bisher_model = AutoModelForAudioClassification.from_pretrained(model_name_bisher)

        model_info.status = "ready"
        logger.info("Loaded both DL models for ensemble detection.")
    except Exception as e:
        model_info.status = "failed"
        model_info.error = str(e)
        logger.error(f"Failed to load DL models: {e}")
        
    yield
    
    model_info.gary_feature_extractor = None
    model_info.gary_model = None
    model_info.bisher_feature_extractor = None
    model_info.bisher_model = None

app = FastAPI(
    title="EchoGuard API",
    description=(
        "AI-powered deepfake audio detection API. "
        "Upload WAV or MP3 files for analysis. "
        "Maximum file size: 30 MB. Maximum duration: 5 minutes."
    ),
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

origins = [origin.strip() for origin in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic/FastAPI validation errors with a clean JSON response."""
    errors = exc.errors()
    detail = "; ".join(
        f"{err.get('loc', ['unknown'])[-1]}: {err.get('msg', 'validation error')}"
        for err in errors
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "detail": detail,
            "status_code": 422,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "detail": "An unexpected error occurred. Please try again later.",
            "status_code": 500,
        },
    )



app.include_router(analysis.router, prefix="/api")
app.include_router(stats.router, prefix="/api")

@app.get(
    "/",
    summary="API Root",
    description="Returns basic information about the EchoGuard API.",
    tags=["System"],
)
async def root():
    """Root endpoint providing basic API information."""
    return {
        "name": "EchoGuard Deepfake Detection API",
        "version": "0.1.0",
        "status": "online",
        "documentation": "/api/docs",
        "endpoints": {
            "health_check": "/api/health",
            "analyze_audio": "/api/analyze"
        }
    }

@app.get(
    "/api/health",
    summary="Health check",
    description="Returns the current health status and uptime of the EchoGuard API.",
    tags=["System"],
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if model_info.status == "ready" else "degraded",
        "service": "EchoGuard API",
        "version": "0.1.0",
        "uptime_seconds": round(time.time() - _startup_time, 2),
        "model_status": model_info.status,
        "model_error": model_info.error
    }
