# Smart Shortlisting & Semantic Resume Ranking Engine

A high-performance, local AI microservice that semantically ranks candidate resumes against a Job Description (JD), combines multi-tier keyword matching, and directly connects to a web frontend.

---

## 👥 Hackathon Team Collaboration Architecture

| Role | Focus Area | Technology | Output |
| :--- | :--- | :--- | :--- |
| **Member 1 (AI / Embeddings)** | Deep Semantic Similarity | `BAAI/bge-small-en-v1.5`, `scikit-learn` | Semantic AI Score (0-100%) |
| **Member 2 (Ingestion & Keywords)**| PDF Parsing & Keyword Engine | `PyMuPDF`, `rank_bm25`, `TF-IDF`, `skills.json` | Parsed Text, Contact, Skills & BM25 Score |
| **Member 3 (Frontend / UI)** | Interactive User Interface | Google Project IDX / Web UI (React/HTML/JS) | Resume upload form & Leaderboard display |

---

## 🔄 End-to-End Data Pipeline

```
                     ┌──────────────────────────────────────────────┐
                     │            FRONTEND (Member 3)               │
                     │  - Enters Job Description                    │
                     │  - Selects candidate PDF resumes             │
                     └──────────────────────┬───────────────────────┘
                                            │  HTTP POST (FormData)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │            FASTAPI BACKEND GATEWAY           │
                     │       CORS-enabled on localhost:8000         │
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────┴───────────────────────┐
                     ▼                                              ▼
          [ PyMuPDF Parser ]                           [ Keyword Engine ]
              (Member 2)                                   (Member 2)
       Extracts text, contact info,                Matches skills ontology,
       and document sections                       computes BM25 & TF-IDF
                     │                                              │
                     ▼                                              │
          [ Local Semantic AI ]                                     │
              (Member 1)                                            │
       BAAI/bge-small-en-v1.5                                       │
       scikit-learn cosine similarity                               │
                     │                                              │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │              HYBRID SCORER                   │
                     │  Total Score = (60% Semantic + 40% Keyword)  │
                     │  - Sorts candidates descending by score      │
                     │  - Highlights matched & missing skills       │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼  JSON Leaderboard
                     ┌──────────────────────────────────────────────┐
                     │            FRONTEND (Member 3)               │
                     │  Renders ranked candidates, score badges,    │
                     │  contact info, and skill tags!               │
                     └──────────────────────────────────────────────┘
```

---

## 🛠️ Project Structure

```
backend/
├── main.py              # Unified FastAPI app, CORS middleware, all endpoints
├── embeddings.py        # Local BGE embedding model singleton & batch encoding
├── ranking.py           # scikit-learn cosine similarity & 0-100 score conversion
├── pdf_parser.py        # PyMuPDF text cleaner, contact extractor & section parser
├── keyword_engine.py    # BM25Okapi, TF-IDF, and skills ontology matching
├── skills.json          # Comprehensive 8-category technical skills database
├── models.py            # Pydantic schemas for request/response validation
├── demo_request.py      # Quick test script using standard library
├── test_api.py          # Unit test suite
├── requirements.txt     # Locked production dependencies
└── README.md            # Architecture & API documentation
```

---

## 🚀 Setup & Installation

### 1. Create and Activate Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: .\venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

The server runs on **`http://127.0.0.1:8000`** with CORS fully enabled.

---

## 📡 API Endpoints

### 1. `POST /api/upload-and-rank` (For Frontend)
Uploads PDF resume files and ranks them against a Job Description.

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `job_description` (text): The JD requirements.
  - `files` (file list): Multiple `.pdf` files.
  - `semantic_weight` (float, optional): Default `0.60` (60% Semantic AI, 40% Keyword).

**Sample Response**:
```json
{
  "required_skills": ["Python", "FastAPI", "Docker", "Machine Learning"],
  "total_candidates": 2,
  "ranked_candidates": [
    {
      "rank": 1,
      "name": "Alice Jenkins",
      "total_score": 90.45,
      "semantic_score": 92.10,
      "keyword_score": 88.00,
      "matched_skills": ["Python", "FastAPI", "Docker"],
      "missing_skills": ["Machine Learning"],
      "additional_skills": ["PostgreSQL", "Git"],
      "contact": {
        "email": "alice@example.com",
        "phone": "555-0199",
        "github": "https://github.com/alice",
        "linkedin": "https://linkedin.com/in/alice"
      },
      "explanation": "Matched 3/4 required skills (75.0%). Matched: [Python, FastAPI, Docker]. Missing: [Machine Learning]."
    }
  ]
}
```

---

### 2. `POST /semantic-rank` (Member 1 Pure Spec)
Accepts pure text JSON and returns strictly `name` and `semantic_score`:

```bash
curl -X POST "http://127.0.0.1:8000/semantic-rank" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Senior Python Backend Engineer with FastAPI experience.",
    "resumes": [
      {
        "name": "Alice",
        "text": "Experienced Python developer building async APIs with FastAPI and Docker."
      }
    ]
  }'
```

**Response**:
```json
[
  {
    "name": "Alice",
    "semantic_score": 91.42
  }
]
```

---

## 💻 Frontend Integration Guide (For Member 3)

Member 3 can connect their frontend (running in Google Project IDX, React, or plain HTML/JS) with this simple JavaScript code:

```javascript
async function rankResumes(jobDescriptionText, pdfFilesList) {
  const formData = new FormData();
  formData.append("job_description", jobDescriptionText);

  // Append all selected PDF files
  for (const file of pdfFilesList) {
    formData.append("files", file);
  }

  const response = await fetch("http://127.0.0.1:8000/api/upload-and-rank", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Ranking failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Leaderboard:", data.ranked_candidates);
  return data;
}
```
