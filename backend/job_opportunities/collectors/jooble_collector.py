import json
import os
import urllib.request
import urllib.error
import unicodedata

from dotenv import load_dotenv
from pathlib import Path


# ============================================================
# 1. CONFIGURATION
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")

JOOBLE_API_URL = "https://ma.jooble.org/api/"


# ============================================================
# 2. SEARCH QUERIES
# ============================================================

JOOBLE_DOMAINS = {
    "ai": [
        "machine learning engineer",
        "artificial intelligence developer",
        "AI engineer",
        "data scientist",
        "computer vision engineer",
        "deep learning engineer",
        "NLP engineer",
        "MLOps engineer",
        "ingénieur intelligence artificielle",
        "stage intelligence artificielle",
        "stage machine learning",
        "stage data science",
        "PFE intelligence artificielle",
        "junior machine learning engineer",
        "junior data scientist",
    ],

    "data": [
        "data analyst",
        "data engineer",
        "data scientist",
        "data analytics",
        "business intelligence",
        "stage data analyst",
        "stage data engineer",
        "stage data science",
        "stage business intelligence",
        "stage Power BI",
        "PFE analyse de données",
        "junior data analyst",
    ],

    "web": [
        "web developer",
        "frontend developer",
        "backend developer",
        "full stack developer",
        "JavaScript developer",
        "stage développeur web",
        "stage développeur frontend",
        "stage développeur backend",
        "stage full stack developer",
        "PFE développement web",
        "junior frontend developer",
        "junior web developer",
    ],

    "networking": [
        "network engineer",
        "network administrator",
        "Cisco network engineer",
        "network support technician",
        "network security",
        "stage réseaux informatiques",
        "stage technicien réseau",
        "stage administration réseau",
        "stage systèmes et réseaux",
        "PFE réseaux informatiques",
        "junior network engineer",
        "technicien réseau débutant",
    ],
}


# ============================================================
# 3. TEXT NORMALIZATION
# ============================================================

def normalize_text(value):
    value = unicodedata.normalize("NFKD", str(value or ""))

    value = "".join(
        char for char in value
        if not unicodedata.combining(char)
    )

    return value.casefold().strip()


# ============================================================
# 4. FETCH JOOBLE RESULTS
# ============================================================

def fetch_jooble_opportunities(domain, city=None):

    api_key = os.getenv("JOOBLE_API_KEY")

    if not api_key:
        raise RuntimeError("JOOBLE_API_KEY is missing.")

    if domain not in JOOBLE_DOMAINS:
        raise ValueError(
            f"Invalid domain. Choose from: {list(JOOBLE_DOMAINS)}"
        )

    location = city or "Morocco"

    collected = {}
    successful_queries = 0
    failed_queries = []

    for keywords in JOOBLE_DOMAINS[domain]:

        payload = json.dumps({
            "keywords": keywords,
            "location": location,
            "page": "1",
        }).encode("utf-8")

        api_request = urllib.request.Request(
            f"{JOOBLE_API_URL}{api_key}",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(
                api_request,
                timeout=15
            ) as response:

                data = json.loads(
                    response.read().decode("utf-8")
                )

            successful_queries += 1

            for job in data.get("jobs", []):

                link = (job.get("link") or "").strip()

                if link:
                    unique_key = link.casefold()
                else:
                    unique_key = "|".join([
                        normalize_text(job.get("title")),
                        normalize_text(job.get("company")),
                        normalize_text(job.get("location")),
                    ])

                collected.setdefault(unique_key, {
                    "title": (job.get("title") or "").strip(),
                    "company": (job.get("company") or "").strip(),
                    "location": (job.get("location") or "").strip(),
                    "description": (
                        job.get("snippet")
                        or job.get("description")
                        or ""
                    ).strip(),
                    "application_url": link,
                    "salary": job.get("salary", ""),
                    "employment_type": job.get("type", ""),
                    "published_at": job.get("updated", ""),
                    "source": "Jooble",
                    "domain_searched": domain,
                    "search_query": keywords,
                })

        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
            json.JSONDecodeError,
            ValueError,
        ) as error:

            print(
                f"Jooble query failed ({keywords}): "
                f"{type(error).__name__}: {error}"
            )

            failed_queries.append(keywords)

    return {
        "source": "Jooble",
        "domain": domain,
        "city": location,
        "total_unique_fetched": len(collected),
        "successful_queries": successful_queries,
        "failed_queries": failed_queries,
        "opportunities": list(collected.values()),
    }