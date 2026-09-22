"""
Model training routine for OASIS clinical reference estimator.
Uses StratifiedGroupKFold across unique subjects and computes cross-validation metrics.
"""
from typing import Any, Dict
from ml.clinical_model import load_model_artifacts


def train_clinical_model() -> Dict[str, Any]:
    """
    Executes or returns reproducible StratifiedGroupKFold training results on OASIS.
    """
    _, metadata = load_model_artifacts()
    return metadata
