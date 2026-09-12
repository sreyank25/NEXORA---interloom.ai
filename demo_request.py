"""Quick demo script to test the Semantic Resume Ranking Engine API.

Uses Python's standard library (no external packages needed) so you can run it immediately
once the server is started.
"""

import json
import urllib.error
import urllib.request

API_URL = "http://127.0.0.1:8000/semantic-rank"

SAMPLE_PAYLOAD = {
    "job_description": (
        "Seeking a Senior Python Backend Developer with strong experience in FastAPI, "
        "microservices architecture, asynchronous programming, and deploying machine learning models."
    ),
    "resumes": [
        {
            "name": "Alice - Python/FastAPI Specialist",
            "text": (
                "Senior Backend Engineer with 6 years of experience in Python and FastAPI. "
                "Specialized in async RESTful APIs, Docker, and serving local ML/NLP models with high throughput."
            ),
        },
        {
            "name": "Bob - Creative UI Designer",
            "text": (
                "Creative UI/UX Designer with 4 years in Figma, Adobe XD, and frontend styling. "
                "Passionate about design systems, typography, and user research."
            ),
        },
        {
            "name": "Charlie - Django Developer",
            "text": (
                "Web developer with 3 years building web applications in Python using Django and Flask. "
                "Familiar with relational databases, PostgreSQL, and basic backend endpoints."
            ),
        },
    ],
}


def test_ranking_api():
    print("=" * 65)
    print("  SEMANTIC RESUME RANKING ENGINE - LIVE TEST")
    print("=" * 65)
    print(f"\n[1] Sending request to: {API_URL}")
    print(f"[2] Job Description:\n    \"{SAMPLE_PAYLOAD['job_description']}\"")
    print(f"[3] Evaluating {len(SAMPLE_PAYLOAD['resumes'])} candidates...\n")

    request_data = json.dumps(SAMPLE_PAYLOAD).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=request_data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            results = json.loads(response.read().decode("utf-8"))

            print("=" * 65)
            print(f" {'RANK':<6} | {'CANDIDATE NAME':<35} | {'MATCH SCORE':<12}")
            print("=" * 65)
            for rank, candidate in enumerate(results, start=1):
                name = candidate.get("name", "")
                score = candidate.get("semantic_score", 0.0)
                print(f" #{rank:<5} | {name:<35} | {score:>6.2f}%")
            print("=" * 65)

            print("\n[✓] Raw JSON output returned by API:")
            print(json.dumps(results, indent=2))

    except urllib.error.URLError as err:
        print(f"\n[✗] Connection error: {err}")
        print("\nTip: Make sure the server is running first! In the backend/ folder, run:")
        print("     uvicorn main:app --reload\n")


if __name__ == "__main__":
    test_ranking_api()
