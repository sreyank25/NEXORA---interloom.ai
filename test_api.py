"""Unit and integration test suite for the Semantic Resume Ranking Engine."""

import unittest
from unittest.mock import MagicMock
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from models import CandidateScore, ResumeItem, SemanticRankRequest
from ranking import compute_cosine_similarity, rank_candidates
from embeddings import EmbeddingEngine


class TestModels(unittest.TestCase):
    """Test Pydantic request and response models."""

    def test_valid_payload(self):
        payload = SemanticRankRequest(
            job_description="Python developer with FastAPI expertise",
            resumes=[
                ResumeItem(name="Alice", text="Senior Python developer with FastAPI"),
                ResumeItem(name="Bob", text="Java developer"),
            ],
        )
        self.assertEqual(len(payload.resumes), 2)
        self.assertEqual(payload.resumes[0].name, "Alice")

    def test_empty_resumes_rejected(self):
        with self.assertRaises(ValueError):
            SemanticRankRequest(
                job_description="Python developer",
                resumes=[],
            )

    def test_whitespace_job_description_rejected(self):
        with self.assertRaises(ValueError):
            SemanticRankRequest(
                job_description="   ",
                resumes=[ResumeItem(name="Alice", text="Resume text")],
            )

    def test_whitespace_resume_text_rejected(self):
        with self.assertRaises(ValueError):
            ResumeItem(name="Alice", text="   \n\t  ")

    def test_whitespace_candidate_name_rejected(self):
        with self.assertRaises(ValueError):
            ResumeItem(name="   ", text="Valid resume text")

    def test_candidate_score_structure(self):
        score = CandidateScore(name="Alice", semantic_score=91.42)
        self.assertEqual(score.name, "Alice")
        self.assertEqual(score.semantic_score, 91.42)
        dump = score.model_dump()
        self.assertEqual(list(dump.keys()), ["name", "semantic_score"])


class TestRanking(unittest.TestCase):
    """Test cosine similarity computation and ranking."""

    def test_compute_cosine_similarity(self):
        # Orthogonal vectors -> similarity 0
        v1 = np.array([1.0, 0.0])
        v2 = np.array([[1.0, 0.0], [0.0, 1.0]])
        sims = compute_cosine_similarity(v1, v2)
        self.assertAlmostEqual(sims[0], 1.0, places=4)
        self.assertAlmostEqual(sims[1], 0.0, places=4)

    def test_rank_candidates_sorting_and_scaling(self):
        jd = np.array([1.0, 0.0, 0.0])
        # Alice is identical (1.0), Bob is 0.5, Charlie is 0.0
        resumes = np.array([
            [0.5, 0.5, 0.0],   # Sim ~ 0.7071 -> ~ 70.71
            [1.0, 0.0, 0.0],   # Sim = 1.0000 -> 100.00
            [0.0, 1.0, 0.0],   # Sim = 0.0000 -> 0.00
        ])
        names = ["Bob", "Alice", "Charlie"]

        results = rank_candidates(jd, resumes, names)

        self.assertEqual(len(results), 3)
        # Alice should be first
        self.assertEqual(results[0].name, "Alice")
        self.assertEqual(results[0].semantic_score, 100.0)

        # Bob should be second
        self.assertEqual(results[1].name, "Bob")
        self.assertAlmostEqual(results[1].semantic_score, 70.71, places=2)

        # Charlie should be third
        self.assertEqual(results[2].name, "Charlie")
        self.assertEqual(results[2].semantic_score, 0.0)

    def test_empty_candidates(self):
        jd = np.array([1.0, 0.0])
        resumes = np.empty((0, 2))
        results = rank_candidates(jd, resumes, [])
        self.assertEqual(results, [])


class TestEmbeddingEngine(unittest.TestCase):
    """Test embedding engine lifecycle and errors."""

    def test_encode_before_load_raises_runtime_error(self):
        engine = EmbeddingEngine("dummy-model")
        with self.assertRaises(RuntimeError):
            engine.encode(["test"])

    def test_initial_state(self):
        engine = EmbeddingEngine()
        self.assertEqual(engine.model_name, "BAAI/bge-small-en-v1.5")
        self.assertFalse(engine.is_loaded)


if __name__ == "__main__":
    unittest.main()
