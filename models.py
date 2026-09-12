"""Data models and validation schemas for the Semantic & Hybrid Resume Ranking Engine."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ResumeItem(BaseModel):
    """Represents a single candidate's resume in text format."""

    name: str = Field(
        ...,
        min_length=1,
        description="Candidate's full name or identifier.",
        examples=["Alice"],
    )
    text: str = Field(
        ...,
        min_length=1,
        description="Raw extracted text content of the candidate's resume.",
        examples=[
            "Senior Software Engineer with 5+ years of experience in Python, FastAPI, and machine learning systems."
        ],
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        """Ensure candidate name is not empty or purely whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("Candidate name cannot be empty or contain only whitespace.")
        return stripped

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        """Ensure resume text is not empty or purely whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("Resume text cannot be empty or contain only whitespace.")
        return stripped


class SemanticRankRequest(BaseModel):
    """Input payload for ranking resumes against a job description (pure text)."""

    job_description: str = Field(
        ...,
        min_length=1,
        description="Text content of the Job Description (JD).",
        examples=[
            "Looking for a Python Backend Developer experienced in FastAPI, distributed systems, and ML model serving."
        ],
    )
    resumes: List[ResumeItem] = Field(
        ...,
        min_length=1,
        description="List of candidate resumes to be ranked against the job description.",
    )

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, value: str) -> str:
        """Ensure job description is not empty or purely whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("Job description cannot be empty or contain only whitespace.")
        return stripped


class CandidateScore(BaseModel):
    """Output score result for pure semantic ranking (Member 1 spec)."""

    name: str = Field(
        ...,
        description="Candidate's full name or identifier.",
        examples=["Alice"],
    )
    semantic_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Semantic similarity score (0.00 to 100.00), rounded to 2 decimal places.",
        examples=[91.42],
    )


class ContactInfo(BaseModel):
    """Extracted contact information from resume."""

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


class HybridCandidateScore(BaseModel):
    """Comprehensive score combining Semantic AI + Keyword/Skill matching."""

    rank: int = Field(..., description="Overall candidate rank (1-indexed)")
    name: str = Field(..., description="Candidate name")
    total_score: float = Field(..., ge=0.0, le=100.0, description="Weighted composite score (0-100)")
    semantic_score: float = Field(..., ge=0.0, le=100.0, description="Local BGE semantic AI score (0-100)")
    keyword_score: float = Field(..., ge=0.0, le=100.0, description="Keyword, BM25 & skill ontology score (0-100)")
    matched_skills: List[str] = Field(default_factory=list, description="Skills matched from JD")
    missing_skills: List[str] = Field(default_factory=list, description="Skills required by JD but missing in resume")
    additional_skills: List[str] = Field(default_factory=list, description="Extra technical skills candidate possesses")
    contact: Optional[ContactInfo] = None
    explanation: Optional[str] = None


class HybridRankingResponse(BaseModel):
    """Full ranking response for the frontend UI."""

    required_skills: List[str] = Field(default_factory=list)
    total_candidates: int
    ranked_candidates: List[HybridCandidateScore]
