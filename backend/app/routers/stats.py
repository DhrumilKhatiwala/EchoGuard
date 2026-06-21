from fastapi import APIRouter
from app.dataset_info import DATASET_INFO

router = APIRouter(tags=["System"])

@router.get("/stats", summary="Get model and dataset statistics")
async def get_stats():
    """Return static dataset metadata and model configuration."""
    return DATASET_INFO
