class ModelInfo:
    status: str = "uninitialized"
    error: str | None = None
    gary_feature_extractor = None
    gary_model = None
    bisher_feature_extractor = None
    bisher_model = None

model_info = ModelInfo()
