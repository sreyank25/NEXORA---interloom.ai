"""Ranking engine module using scikit-learn cosine similarity."""

import logging
from typing import List
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from models import CandidateScore

logger = logging.getLogger(__name__)


def compute_cosine_similarity(
    jd_embedding: np.ndarray,
    resume_embeddings: np.ndarray,
) -> np.ndarray:
    """Compute cosine similarity between 1 Job Description and N candidate resumes using scikit-learn.

    Args:
        jd_embedding: Embedding vector for the job description. Shape (D,) or (1, D).
        resume_embeddings: Embedding matrix for candidate resumes. Shape (N, D).

    Returns:
        np.ndarray: Array of similarity scores of shape (N,).
    """
    if jd_embedding.ndim == 1:
        jd_embedding = jd_embedding.reshape(1, -1)

    if resume_embeddings.ndim == 1:
        resume_embeddings = resume_embeddings.reshape(1, -1)

    # scikit-learn's cosine_similarity returns matrix of shape (1, N)
    similarities = cosine_similarity(jd_embedding, resume_embeddings)[0]
    return similarities


def rank_candidates(
    jd_embedding: np.ndarray,
    resume_embeddings: np.ndarray,
    candidate_names: List[str],
) -> List[CandidateScore]:
    """Calculate similarity scores, map to 0-100, and rank candidates from highest to lowest.

    Functional steps:
    1. Compute cosine similarity using scikit-learn.
    2. Convert similarity into a 0-100 score rounded to 2 decimal places.
    3. Sort candidates from highest score to lowest.
    4. Return list of CandidateScore objects containing only 'name' and 'semantic_score'.

    Args:
        jd_embedding: Vector for Job Description.
        resume_embeddings: Matrix for candidate resumes.
        candidate_names: List of candidate names matching row indices of resume_embeddings.

    Returns:
        List[CandidateScore]: Sorted list of candidate scores in descending order.
    """
    if len(candidate_names) == 0:
        return []

    similarities = compute_cosine_similarity(jd_embedding, resume_embeddings)

    ranked_results: List[CandidateScore] = []
    for name, sim in zip(candidate_names, similarities):
        # Cosine similarity is mathematically bounded in [-1.0, 1.0].
        # Clip to [0.0, 1.0] for non-negative percentage score mapping.
        bounded_sim = float(np.clip(sim, 0.0, 1.0))
        # Convert to 0–100 score rounded to 2 decimal places
        semantic_score = round(bounded_sim * 100.0, 2)

        ranked_results.append(
            CandidateScore(
                name=name,
                semantic_score=semantic_score,
            )
        )

    # Sort candidates from highest score to lowest
    ranked_results.sort(key=lambda candidate: candidate.semantic_score, reverse=True)

    return ranked_results
