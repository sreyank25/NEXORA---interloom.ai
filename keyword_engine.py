"""Keyword Engine for Smart Shortlisting.

Combines:
1. Technical skill ontology matching (matched vs missing skills)
2. TF-IDF vector cosine similarity (n-grams 1-2)
3. BM25Okapi keyword retrieval and term-saturation scoring
"""

import sys
import os
import re
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi

from pdf_parser import (
    extract_skills,
    clean_text,
    load_skills_db,
    parse_jd,
    parse_resume,
)


def tokenize_text(text: str) -> List[str]:
    """
    Tokenizes text for BM25 and keyword analysis:
    - Lowercases
    - Preserves technology terms (c++, c#, node.js, rest apis)
    - Filters common stopwords
    """
    text = text.lower()
    tokens = re.findall(r'\b[a-z0-9]+(?:\.[a-z0-9]+)*(?:[\+#]+)?\b', text)
    stopwords = {
        "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
        "which", "this", "that", "these", "those", "then", "just", "so", "than",
        "such", "both", "through", "about", "for", "is", "of", "while", "during",
        "to", "from", "in", "out", "on", "off", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all", "any", "both",
        "each", "few", "more", "most", "other", "some", "such", "no", "nor",
        "not", "only", "own", "same", "so", "than", "too", "very", "can", "will",
        "should", "now", "be", "was", "were", "been", "being", "have", "has",
        "had", "having", "do", "does", "did", "doing", "at", "by", "with", "from",
        "our", "you", "your", "we", "re", "ve", "ll", "d"
    }
    return [t for t in tokens if t not in stopwords and len(t) > 1]


class KeywordEngine:
    """
    Keyword matching & scoring engine using:
    1. Technical skill ontology matching (matched vs missing skills)
    2. TF-IDF vector cosine similarity (n-grams 1-2)
    3. BM25Okapi keyword retrieval and term-saturation scoring
    """

    def __init__(
        self,
        skills_db_path: Optional[Union[str, Path]] = None,
        weights: Optional[Dict[str, float]] = None
    ):
        self.skills_db = load_skills_db(skills_db_path)
        self.weights = weights or {
            "skill_match": 0.50,
            "bm25": 0.25,
            "tfidf": 0.25
        }
        self.current_jd_data: Optional[Dict[str, Any]] = None

    def set_job_description(self, jd_source: Union[str, Path, bytes, Dict[str, Any]]) -> Dict[str, Any]:
        if isinstance(jd_source, dict) and "cleaned_text" in jd_source:
            self.current_jd_data = jd_source
        else:
            self.current_jd_data = parse_jd(jd_source, self.skills_db)
        return self.current_jd_data

    def calculate_tfidf_similarity(self, resume_text: str, jd_text: str) -> float:
        if not resume_text.strip() or not jd_text.strip():
            return 0.0
        try:
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                max_features=5000,
                sublinear_tf=True
            )
            tfidf_matrix = vectorizer.fit_transform([jd_text, resume_text])
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(np.clip(sim, 0.0, 1.0))
        except Exception:
            return 0.0

    def calculate_bm25_single(self, resume_tokens: List[str], jd_tokens: List[str], k1: float = 1.5, b: float = 0.75) -> float:
        if not resume_tokens or not jd_tokens:
            return 0.0
        doc_len = len(resume_tokens)
        avg_len = 250.0
        term_counts = Counter(resume_tokens)
        jd_term_counts = Counter(jd_tokens)

        score = 0.0
        max_possible_score = 0.0
        for term, qf in jd_term_counts.items():
            tf = term_counts.get(term, 0)
            term_weight = 1.0 + math.log1p(qf)
            num = tf * (k1 + 1.0)
            denom = tf + k1 * (1.0 - b + b * (doc_len / avg_len))
            saturation = num / denom if denom > 0 else 0.0
            score += term_weight * saturation
            max_possible_score += term_weight * (3.0 * (k1 + 1.0) / (3.0 + k1))

        if max_possible_score <= 0:
            return 0.0
        normalized = score / max_possible_score
        return float(np.clip(normalized, 0.0, 1.0))

    def match_skills(
        self,
        resume_skills: List[str],
        jd_skills: List[str]
    ) -> Tuple[List[str], List[str], List[str], float]:
        resume_set = set(resume_skills)
        jd_set = set(jd_skills)
        matched = sorted(list(resume_set.intersection(jd_set)))
        missing = sorted(list(jd_set - resume_set))
        additional = sorted(list(resume_set - jd_set))
        match_ratio = len(matched) / len(jd_set) if jd_set else (1.0 if resume_set else 0.0)
        return matched, missing, additional, match_ratio

    def score_resume(
        self,
        resume_data: Union[Dict[str, Any], str, Path, bytes],
        jd_data: Optional[Union[Dict[str, Any], str, Path, bytes]] = None
    ) -> Dict[str, Any]:
        if jd_data is not None:
            self.set_job_description(jd_data)
        elif self.current_jd_data is None:
            raise ValueError("No Job Description provided. Call set_job_description() first or pass jd_data.")

        if isinstance(resume_data, dict) and "cleaned_text" in resume_data:
            r_data = resume_data
        else:
            r_data = parse_resume(resume_data, self.skills_db)

        resume_text = r_data.get("cleaned_text", "")
        jd_text = self.current_jd_data.get("cleaned_text", "")

        resume_skills = r_data.get("extracted_skills", [])
        jd_skills = self.current_jd_data.get("required_skills", [])
        matched, missing, additional, match_ratio = self.match_skills(resume_skills, jd_skills)
        skill_score_100 = match_ratio * 100.0

        raw_tfidf = self.calculate_tfidf_similarity(resume_text, jd_text)
        tfidf_score_100 = min(100.0, (raw_tfidf / 0.35) * 100.0)

        resume_tokens = tokenize_text(resume_text)
        jd_tokens = tokenize_text(jd_text)
        raw_bm25 = self.calculate_bm25_single(resume_tokens, jd_tokens)
        bm25_score_100 = min(100.0, (raw_bm25 / 0.50) * 100.0)

        w_skill = self.weights.get("skill_match", 0.50)
        w_bm25 = self.weights.get("bm25", 0.25)
        w_tfidf = self.weights.get("tfidf", 0.25)

        composite_score = (
            w_skill * skill_score_100 +
            w_bm25 * bm25_score_100 +
            w_tfidf * tfidf_score_100
        )
        composite_score = round(float(np.clip(composite_score, 0.0, 100.0)), 2)

        total_req = len(jd_skills)
        matched_count = len(matched)
        matched_str = ", ".join(matched[:5]) if matched else "None"
        missing_str = ", ".join(missing[:5]) if missing else "None"
        
        explanation = (
            f"Matched {matched_count}/{total_req} required skills ({skill_score_100:.1f}%). "
            f"Matched: [{matched_str}]. Missing: [{missing_str}]."
        )

        return {
            "candidate_name": r_data.get("candidate_name", "Unknown Candidate"),
            "contact": r_data.get("contact", {}),
            "keyword_score": composite_score,
            "matched_skills": matched,
            "missing_skills": missing,
            "additional_skills": additional,
            "matched_skills_count": matched_count,
            "missing_skills_count": len(missing),
            "total_jd_skills_count": total_req,
            "match_ratio": round(match_ratio, 4),
            "sub_scores": {
                "skill_match_score": round(skill_score_100, 2),
                "bm25_score": round(bm25_score_100, 2),
                "tfidf_score": round(tfidf_score_100, 2)
            },
            "raw_metrics": {
                "raw_tfidf_cosine": round(raw_tfidf, 4),
                "raw_bm25_saturation": round(raw_bm25, 4)
            },
            "explanation": explanation
        }

    def score_batch(
        self,
        resumes_list: List[Union[Dict[str, Any], str, Path]],
        jd_data: Optional[Union[Dict[str, Any], str, Path, bytes]] = None
    ) -> List[Dict[str, Any]]:
        if jd_data is not None:
            self.set_job_description(jd_data)
        elif self.current_jd_data is None:
            raise ValueError("No Job Description provided.")

        jd_text = self.current_jd_data.get("cleaned_text", "")
        jd_tokens = tokenize_text(jd_text)
        jd_skills = self.current_jd_data.get("required_skills", [])

        parsed_resumes = []
        tokenized_corpus = []
        for r in resumes_list:
            if isinstance(r, dict) and "cleaned_text" in r:
                p = r
            else:
                p = parse_resume(r, self.skills_db)
            parsed_resumes.append(p)
            tokenized_corpus.append(tokenize_text(p.get("cleaned_text", "")))

        if tokenized_corpus and jd_tokens:
            try:
                bm25_engine = BM25Okapi(tokenized_corpus)
                raw_bm25_scores = bm25_engine.get_scores(jd_tokens)
                max_bm25 = float(np.max(raw_bm25_scores)) if len(raw_bm25_scores) > 0 and np.max(raw_bm25_scores) > 0 else 1.0
            except Exception:
                raw_bm25_scores = [self.calculate_bm25_single(toks, jd_tokens) * 100 for toks in tokenized_corpus]
                max_bm25 = 100.0
        else:
            raw_bm25_scores = [0.0] * len(parsed_resumes)
            max_bm25 = 1.0

        raw_tfidf_scores = [
            self.calculate_tfidf_similarity(p.get("cleaned_text", ""), jd_text)
            for p in parsed_resumes
        ]
        max_tfidf = float(np.max(raw_tfidf_scores)) if len(raw_tfidf_scores) > 0 and np.max(raw_tfidf_scores) > 0 else 1.0

        results = []
        w_skill = self.weights.get("skill_match", 0.50)
        w_bm25 = self.weights.get("bm25", 0.25)
        w_tfidf = self.weights.get("tfidf", 0.25)

        for i, p in enumerate(parsed_resumes):
            resume_skills = p.get("extracted_skills", [])
            matched, missing, additional, match_ratio = self.match_skills(resume_skills, jd_skills)
            skill_score_100 = match_ratio * 100.0
            raw_t = raw_tfidf_scores[i]
            tfidf_score_100 = (raw_t / max_tfidf) * 100.0 if max_tfidf > 0 else 0.0
            raw_b = float(raw_bm25_scores[i])
            bm25_score_100 = (raw_b / max_bm25) * 100.0 if max_bm25 > 0 else 0.0

            composite = (
                w_skill * skill_score_100 +
                w_bm25 * bm25_score_100 +
                w_tfidf * tfidf_score_100
            )
            composite = round(float(np.clip(composite, 0.0, 100.0)), 2)

            total_req = len(jd_skills)
            matched_count = len(matched)
            matched_str = ", ".join(matched[:5]) if matched else "None"
            missing_str = ", ".join(missing[:5]) if missing else "None"

            explanation = (
                f"Matched {matched_count}/{total_req} required skills ({skill_score_100:.1f}%). "
                f"Matched: [{matched_str}]. Missing: [{missing_str}]."
            )

            results.append({
                "candidate_name": p.get("candidate_name", f"Candidate {i+1}"),
                "contact": p.get("contact", {}),
                "sections": p.get("sections", {}),
                "extracted_skills": resume_skills,
                "keyword_score": composite,
                "matched_skills": matched,
                "missing_skills": missing,
                "additional_skills": additional,
                "matched_skills_count": matched_count,
                "missing_skills_count": len(missing),
                "total_jd_skills_count": total_req,
                "match_ratio": round(match_ratio, 4),
                "sub_scores": {
                    "skill_match_score": round(skill_score_100, 2),
                    "bm25_score": round(bm25_score_100, 2),
                    "tfidf_score": round(tfidf_score_100, 2)
                },
                "raw_metrics": {
                    "raw_tfidf_cosine": round(raw_t, 4),
                    "raw_bm25_score": round(raw_b, 4)
                },
                "explanation": explanation
            })

        results.sort(key=lambda x: x["keyword_score"], reverse=True)
        for rank, res in enumerate(results, start=1):
            res["keyword_rank"] = rank

        return results


# Global singleton instance
keyword_engine = KeywordEngine()
