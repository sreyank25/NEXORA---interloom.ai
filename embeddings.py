"""Embedding engine module using local sentence-transformers (BAAI/bge-small-en-v1.5).

Loads the local embedding model once into memory during application startup
and provides batch vectorization capabilities.
"""

import logging
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """Singleton-friendly wrapper for sentence-transformers embedding model."""

    DEFAULT_MODEL_NAME = "BAAI/bge-small-en-v1.5"

    def __init__(self, model_name: str = DEFAULT_MODEL_NAME) -> None:
        self.model_name: str = model_name
        self._model: Optional[object] = None

    @property
    def is_loaded(self) -> bool:
        """Check whether the model is loaded into memory."""
        return self._model is not None

    def load_model(self) -> None:
        """Load the local SentenceTransformer model into memory once.

        Subsequent calls will be no-ops if the model is already loaded.
        """
        if self._model is not None:
            logger.info("Model '%s' is already loaded in memory.", self.model_name)
            return

        logger.info("Loading embedding model '%s'...", self.model_name)
        # Lazy import of sentence-transformers so package import is fast
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(self.model_name)
        logger.info("Embedding model '%s' successfully loaded.", self.model_name)

    def encode(self, texts: List[str]) -> np.ndarray:
        """Generate normalized embeddings for a list of text strings.

        Args:
            texts: List of text strings to embed.

        Returns:
            np.ndarray: Matrix of embeddings with shape (len(texts), embedding_dim).

        Raises:
            RuntimeError: If encode is called before load_model().
        """
        if self._model is None:
            raise RuntimeError(
                "Embedding model is not loaded. Call 'load_model()' before generating embeddings."
            )

        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        # normalize_embeddings=True ensures vectors have L2 norm = 1.0
        embeddings = self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return np.asarray(embeddings, dtype=np.float32)


# Shared global embedding engine instance
embedding_engine = EmbeddingEngine()
