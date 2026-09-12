import sys
import os
import re
import json
import unicodedata
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import pymupdf


def load_skills_db(skills_path: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
    """Load skills taxonomy from JSON file."""
    if skills_path is None:
        skills_path = Path(__file__).resolve().parent / "skills.json"
    else:
        skills_path = Path(skills_path)

    if not skills_path.exists():
        raise FileNotFoundError(f"Skills database not found at {skills_path}")

    with open(skills_path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_text_from_pdf(pdf_source: Union[str, Path, bytes]) -> str:
    """
    Extract raw text from PDF source (file path or bytes) using PyMuPDF.
    Handles multi-page PDFs and gracefully handles ligature or layout artifacts.
    """
    try:
        if isinstance(pdf_source, (str, Path)):
            doc = pymupdf.open(str(pdf_source))
        elif isinstance(pdf_source, bytes):
            doc = pymupdf.open(stream=pdf_source, filetype="pdf")
        else:
            raise TypeError("pdf_source must be a file path or bytes")

        full_text = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            if page_text:
                full_text.append(page_text)
        
        doc.close()
        return "\n\n".join(full_text)
    except Exception as e:
        raise RuntimeError(f"Error extracting text from PDF: {e}") from e


def clean_text(raw_text: str) -> str:
    """
    Cleans extracted text:
    - Normalizes unicode characters
    - Fixes broken words due to line wrapping (e.g. 'develop-\nment' -> 'development')
    - Standardizes bullet points
    - Strips non-printable characters while preserving structure
    - Normalizes spacing and redundant line breaks
    """
    if not raw_text:
        return ""

    text = unicodedata.normalize("NFKD", raw_text)

    # Standardize quotation marks and dashes
    text = re.sub(r'[\u2018\u2019]', "'", text)
    text = re.sub(r'[\u201c\u201d]', '"', text)
    text = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015]', "-", text)

    # Rejoin words broken across line breaks with a hyphen
    text = re.sub(r'(\b[A-Za-z]+)-\s*\n\s*([A-Za-z]+\b)', r'\1\2', text)

    # Standardize common bullet points to standard bullet '-'
    bullet_chars = r'[\u2022\u2023\u25cf\u25cb\u25aa\u25ab\u25c6\u2043\u00b7\u27a2\u2713\u2714\u25b6\u25b8\u25c0\u25e6]'
    text = re.sub(bullet_chars, "\n- ", text)

    # Replace tabs with spaces
    text = text.replace("\t", " ")

    # Remove non-printable control characters except newline and carriage return
    text = "".join(ch for ch in text if ch.isprintable() or ch in "\n\r")

    # Clean multiple spaces on the same line
    text = re.sub(r'[^\S\r\n]+', ' ', text)

    # Clean multiple blank lines (max 2 consecutive newlines)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Clean leading/trailing spaces per line
    lines = [line.strip() for line in text.split("\n")]
    cleaned = "\n".join(lines).strip()

    return cleaned


# Section header regex patterns
SECTION_PATTERNS = {
    "skills": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:technical\s+skills|skills\s*(?:&|and)\s*proficiencies|core\s+competencies|key\s+skills|skills\s*(?:&|and)\s*abilities|skills|technologies|tech\s+stack|tools\s*(?:&|and)\s*technologies|programming\s+skills))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    ),
    "experience": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:work\s+experience|professional\s+experience|internship\s+experience|internships|employment\s+history|experience|work\s+history|relevant\s+experience))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    ),
    "projects": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:projects|academic\s+projects|personal\s+projects|key\s+projects|featured\s+projects|selected\s+projects|technical\s+projects))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    ),
    "education": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:education|academic\s+background|educational\s+background|academic\s+qualifications|degrees|educational\s+qualifications|qualifications))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    ),
    "certifications": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:certifications|licenses\s*(?:&|and)\s*certifications|certificates|courses|achievements|honors\s*(?:&|and)\s*awards|awards))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    ),
    "summary": re.compile(
        r"^(?:(?:\d+[\.\)]\s*)?(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective))\s*[:\-\—]?\s*$",
        re.IGNORECASE
    )
}


def extract_sections(cleaned_text: str) -> Dict[str, str]:
    """
    Splits cleaned resume text into distinct sections using regex.
    Returns a dictionary mapping section names to text content.
    Standard keys: 'skills', 'experience', 'projects', 'education', 'certifications', 'summary', 'header'.
    """
    lines = cleaned_text.split("\n")
    section_indices = []

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean or len(line_clean) > 50:
            continue

        for sec_name, pattern in SECTION_PATTERNS.items():
            if pattern.match(line_clean):
                section_indices.append((i, sec_name))
                break

    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
        "other": []
    }

    if not section_indices:
        sections["header"] = lines[:5]
        sections["other"] = lines[5:]
        return {k: "\n".join(v).strip() for k, v in sections.items() if v}

    first_idx = section_indices[0][0]
    sections["header"] = lines[:first_idx]

    for idx in range(len(section_indices)):
        start_line, sec_name = section_indices[idx]
        end_line = section_indices[idx + 1][0] if idx + 1 < len(section_indices) else len(lines)
        sec_content = lines[start_line + 1:end_line]
        if sec_name not in sections:
            sections[sec_name] = []
        sections[sec_name].extend(sec_content)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """
    Extracts contact info: name (heuristic), email, phone, github, linkedin.
    """
    info: Dict[str, Optional[str]] = {
        "name": None,
        "email": None,
        "phone": None,
        "github": None,
        "linkedin": None
    }

    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        info["email"] = email_match.group(0).lower()

    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b', text)
    if phone_match:
        info["phone"] = phone_match.group(0).strip()

    github_match = re.search(r'(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)', text, re.IGNORECASE)
    if github_match:
        info["github"] = f"https://github.com/{github_match.group(1)}"

    linkedin_match = re.search(r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)', text, re.IGNORECASE)
    if linkedin_match:
        info["linkedin"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:5]:
        if info["email"] and info["email"] in line.lower():
            continue
        if "curriculum vitae" in line.lower() or "resume" in line.lower():
            continue
        if any(w in line.lower() for w in ["phone", "email", "github", "linkedin", "http", "www"]):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
            info["name"] = line
            break

    return info


def extract_skills(text: str, skills_db: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extracts technical skills and categorizes them using the skills taxonomy.
    Handles special characters (C++, C#, .NET, Node.js) and aliases safely.
    """
    if skills_db is None:
        skills_db = load_skills_db()

    text_lower = f" {text.lower()} "
    found_skills_set = set()
    found_categories: Dict[str, List[str]] = {cat: [] for cat in skills_db.get("categories", [])}

    for skill_item in skills_db.get("skills", []):
        canonical_name = skill_item["name"]
        category = skill_item.get("category", "other")
        aliases = skill_item.get("aliases", [canonical_name.lower()])

        matched = False
        for alias in aliases:
            alias_lower = alias.lower().strip()
            escaped_alias = re.escape(alias_lower)
            pattern = rf"(?<![A-Za-z0-9_]){escaped_alias}(?![A-Za-z0-9_])"
            if re.search(pattern, text_lower):
                matched = True
                break

        if matched:
            found_skills_set.add(canonical_name)
            if category in found_categories:
                found_categories[category].append(canonical_name)
            else:
                found_categories.setdefault("other", []).append(canonical_name)

    sorted_skills = sorted(list(found_skills_set))
    for cat in found_categories:
        found_categories[cat] = sorted(list(set(found_categories[cat])))

    return {
        "extracted_skills": sorted_skills,
        "skills_by_category": {k: v for k, v in found_categories.items() if v},
        "count": len(sorted_skills)
    }


def parse_resume(pdf_source: Union[str, Path, bytes], skills_db: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Complete end-to-end resume parser:
    1. Extracts text from PDF
    2. Cleans text formatting
    3. Detects resume sections (Skills, Experience, Projects, Education)
    4. Extracts contact info (Name, Email, Phone, Socials)
    5. Identifies technical skills from both the full text and dedicated Skills section
    """
    if skills_db is None:
        skills_db = load_skills_db()

    raw_text = extract_text_from_pdf(pdf_source)
    cleaned = clean_text(raw_text)
    sections = extract_sections(cleaned)
    contact = extract_contact_info(cleaned)

    skill_results = extract_skills(cleaned, skills_db)
    skills_sec_results = extract_skills(sections.get("skills", ""), skills_db)

    return {
        "candidate_name": contact.get("name") or "Unknown Candidate",
        "contact": contact,
        "sections": sections,
        "extracted_skills": skill_results["extracted_skills"],
        "skills_by_category": skill_results["skills_by_category"],
        "skills_section_skills": skills_sec_results["extracted_skills"],
        "total_skills_count": skill_results["count"],
        "cleaned_text": cleaned,
        "raw_text_length": len(raw_text)
    }


def parse_jd(jd_source: Union[str, Path, bytes], skills_db: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Parser for Job Description (PDF or text).
    Extracts required technical skills and cleaned text.
    """
    if skills_db is None:
        skills_db = load_skills_db()

    if isinstance(jd_source, bytes) or (isinstance(jd_source, (str, Path)) and str(jd_source).lower().endswith(".pdf")):
        raw_text = extract_text_from_pdf(jd_source)
    else:
        raw_text = str(jd_source)

    cleaned = clean_text(raw_text)
    skill_results = extract_skills(cleaned, skills_db)

    return {
        "cleaned_text": cleaned,
        "required_skills": skill_results["extracted_skills"],
        "skills_by_category": skill_results["skills_by_category"],
        "total_required_skills": skill_results["count"]
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_parser.py <resume_or_jd.pdf>")
        sys.exit(1)

    path = sys.argv[1]
    res = parse_resume(path)
    print(json.dumps({
        "candidate_name": res["candidate_name"],
        "contact": res["contact"],
        "skills": res["extracted_skills"],
        "sections_found": [k for k, v in res["sections"].items() if v]
    }, indent=2))
