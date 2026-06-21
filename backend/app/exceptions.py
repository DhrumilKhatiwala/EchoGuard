"""Custom exception classes for the EchoGuard API."""

from fastapi import HTTPException, status


class FileTooLargeError(HTTPException):
    """Raised when uploaded file exceeds the maximum size limit."""

    def __init__(self, file_size_mb: float, max_size_mb: int):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size_mb:.1f} MB) exceeds maximum allowed size ({max_size_mb} MB).",
        )


class InvalidFileTypeError(HTTPException):
    """Raised when uploaded file has an unsupported format."""

    def __init__(self, file_type: str, allowed_types: list[str]):
        super().__init__(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file_type}' is not supported. Allowed types: {', '.join(allowed_types)}.",
        )


class AudioTooLongError(HTTPException):
    """Raised when audio duration exceeds the maximum limit."""

    def __init__(self, duration_seconds: float, max_seconds: int):
        max_minutes = max_seconds / 60
        duration_minutes = duration_seconds / 60
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Audio duration ({duration_minutes:.1f} min) exceeds maximum allowed duration ({max_minutes:.0f} min).",
        )


class AudioProcessingError(HTTPException):
    """Raised when audio file cannot be read or processed."""

    def __init__(self, reason: str = "Unknown error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process audio file: {reason}",
        )
