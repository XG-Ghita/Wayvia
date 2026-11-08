
import csv
import json
import os
import re
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq


# ============================================================
# 1. PROJECT CONFIGURATION
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

COMPANIES_FILE = (
    PROJECT_DIR / "frontend" / "data" / "wayvia_companies.json"
)

PUBLISHED_OPPORTUNITIES_FILE = (
    PROJECT_DIR / "frontend" / "data" / "wayvia_opportunities.json"
)

OPPORTUNITIES_FILE = (
    BACKEND_DIR
    / "notebooks"
    / "wayvia_data"
    / "opportunities"
    / "wayvia_morocco_8cities_opportunities_verified.csv"
)

load_dotenv(BACKEND_DIR / ".env")

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "https://xg-ghita.github.io",
                "http://127.0.0.1:5000",
                "http://localhost:5000",
                "http://127.0.0.1:5500",
                "http://localhost:5500"
            ]
        }
    }
)

# ============================================================
# GROQ AI CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

groq_client = (
    Groq(api_key=GROQ_API_KEY)
    if GROQ_API_KEY
    else None
)

GROQ_MODEL = "openai/gpt-oss-120b"

# ============================================================
# 2. JOOBLE CONFIGURATION
# ============================================================

JOOBLE_API_URL = "https://ma.jooble.org/api/"

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
        "stage machine learning"
    ],
    "data": [
        "data analyst",
        "data engineer",
        "data scientist",
        "data analytics",
        "business intelligence",
    ],
    "web": [
        "web developer",
        "frontend developer",
        "backend developer",
        "full stack developer",
        "JavaScript developer",
    ],
    "networking": [
        "network engineer",
        "network administrator",
        "Cisco network engineer",
        "network support technician",
        "network security",
    ],
}

# Additional student-focused searches
JOOBLE_DOMAINS["ai"].extend([
    "stage intelligence artificielle",
    "stage machine learning",
    "stage data science",
    "PFE intelligence artificielle",
    "junior machine learning engineer",
    "junior data scientist",
])

JOOBLE_DOMAINS["data"].extend([
    "stage data analyst",
    "stage data engineer",
    "stage data science",
    "stage business intelligence",
    "stage Power BI",
    "PFE analyse de données",
    "junior data analyst",
])

JOOBLE_DOMAINS["web"].extend([
    "stage développeur web",
    "stage développeur frontend",
    "stage développeur backend",
    "stage full stack developer",
    "PFE développement web",
    "junior frontend developer",
    "junior web developer",
])

JOOBLE_DOMAINS["networking"].extend([
    "stage réseaux informatiques",
    "stage technicien réseau",
    "stage administration réseau",
    "stage systèmes et réseaux",
    "PFE réseaux informatiques",
    "junior network engineer",
    "technicien réseau débutant",
])

ALLOWED_CITIES = {
    "Marrakech",
    "Casablanca",
    "Rabat",
    "Agadir",
    "Fes",
    "Tangier",
    "Meknes",
    "Oujda",
}

CITY_ALIASES = {
    "Marrakech": ["marrakech", "marrakesh"],
    "Casablanca": ["casablanca"],
    "Rabat": ["rabat"],
    "Agadir": ["agadir"],
    "Fes": ["fes", "fez"],
    "Tangier": ["tangier", "tanger"],
    "Meknes": ["meknes", "meknès"],
    "Oujda": ["oujda"],
}

# Strong domain-specific phrases.
# Generic words such as "machine", "learning", "business",
# and "python" are deliberately not sufficient by themselves.

DOMAIN_EVIDENCE = {
    "ai": [
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "computer vision",
        "natural language processing",
        "neural network",
        "large language model",
        "llm",
        "generative ai",
        "ai engineer",
        "ai developer",
        "ml engineer",
        "data scientist",
        "predictive modeling",
        "predictive model",
        "model training",
        "tensorflow",
        "pytorch",
    ],

    "data": [
        "data analyst",
        "data analysis",
        "data analytics",
        "data engineer",
        "data engineering",
        "data scientist",
        "data science",
        "business intelligence",
        "data warehouse",
        "data visualization",
        "data pipeline",
        "data integration",
        "power bi",
        "tableau",
        "etl",
        "talend",
        "sql developer",
    ],

    "web": [
        "web developer",
        "web development",
        "web application",
        "frontend developer",
        "front-end developer",
        "backend developer",
        "back-end developer",
        "full stack developer",
        "full-stack developer",
        "javascript developer",
        "react developer",
        "angular developer",
        "node.js",
        "laravel",
        "django",
        "php developer",
        "html",
        "css",
        "typescript",
    ],

    "networking": [
        "network engineer",
        "network administrator",
        "network technician",
        "network support",
        "network engineering",
        "network administration",
        "network infrastructure",
        "network security",
        "tcp/ip",
        "routing",
        "switching",
        "cisco",
        "ccna",
        "firewall",
        "system administrator",
        "systems administrator",
    ],
}

# Internship/PFE classification requires explicit evidence.
INTERNSHIP_KEYWORDS = [
    "internship",
    "intern",
    "internships",
    "stage",
    "stagiaire",
    "stages",
    "pfe",
    "end of studies",
    "end-of-studies",
    "final year project",
    "trainee",
    "apprentice",
    "apprenticeship",
]

JUNIOR_KEYWORDS = [
    "junior",
    "entry level",
    "entry-level",
    "graduate",
    "new grad",
    "recent graduate",
    "débutant",
    "debutant",
    "jeune diplômé",
    "jeune diplome",
    "0-2 years",
    "0 to 2 years",
    "1-2 years",
    "less than 2 years",
]


# ============================================================
# 3. LOAD COMPANY DATA
# ============================================================

try:
    with COMPANIES_FILE.open("r", encoding="utf-8") as file:
        companies = json.load(file)

    if not isinstance(companies, list):
        raise ValueError("Company data must be a list.")

except (OSError, json.JSONDecodeError, ValueError) as error:
    print(f"Company data loading error: {error}")
    companies = []


# ============================================================
# 4. VERIFIED OPPORTUNITIES FROM THE LOCAL DATASET
# ============================================================

def get_verified_opportunities():
    """Return only opportunities explicitly verified as active."""

    if not OPPORTUNITIES_FILE.exists():
        return []

    with OPPORTUNITIES_FILE.open(
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as file:
        rows = list(csv.DictReader(file))

    return [
        row
        for row in rows
        if row.get("verification_status", "").strip().lower()
        in {"verified", "verified_active", "active"}
    ]


def get_published_opportunities():
    """Load published opportunities displayed on the WayVia website."""

    if not PUBLISHED_OPPORTUNITIES_FILE.exists():
        print("Published opportunities file not found.")
        return []

    try:
        with PUBLISHED_OPPORTUNITIES_FILE.open(
            "r",
            encoding="utf-8-sig"
        ) as file:
            data = json.load(file)

        opportunities = data.get("opportunities", [])

        if not isinstance(opportunities, list):
            raise ValueError("Published opportunities must be a list.")

        return [
            opportunity
            for opportunity in opportunities
            if isinstance(opportunity, dict)
            and opportunity.get("title")
            and opportunity.get("application_url")
        ]

    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Published opportunities loading error: {error}")
        return []


def find_published_opportunity(application_url):
    """Find one published opportunity using its exact application URL."""

    candidate_url = str(application_url or "").strip()

    if not candidate_url:
        return None

    from urllib.parse import urlparse

    parsed_url = urlparse(candidate_url)

    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        return None

    opportunities = get_published_opportunities()

    for opportunity in opportunities:
        stored_url = str(
            opportunity.get("application_url", "")
        ).strip()

        if stored_url == candidate_url:
            return opportunity

    return None
# ============================================================
# 5. COMPANY SEARCH
# ============================================================

def search_companies(message, limit=8):
    """Rank companies using explicit domain and location evidence."""

    def normalize(value):
        value = unicodedata.normalize("NFKD", str(value or ""))
        value = "".join(
            char for char in value
            if not unicodedata.combining(char)
        )
        return value.lower().strip()

    def contains_term(text, term):
        text = normalize(text)
        term = normalize(term)

        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(term)
            + r"(?![a-z0-9])"
        )

        return bool(re.search(pattern, text))

    text = normalize(message)

    city_aliases = {
        "Marrakech": ["marrakech", "marrakesh"],
        "Casablanca": ["casablanca", "casa"],
        "Rabat": ["rabat"],
        "Agadir": ["agadir"],
        "Fes": ["fes", "fez"],
        "Tangier": ["tangier", "tanger"],
        "Meknes": ["meknes"],
        "Oujda": ["oujda"],
    }

    requested_cities = {
        city
        for city, aliases in city_aliases.items()
        if any(contains_term(text, alias) for alias in aliases)
    }

    normalized_requested_cities = {
        normalize(city) for city in requested_cities
    }

    interest_groups = {
        "ai": [
            "artificial intelligence",
            "intelligence artificielle",
            "machine learning",
            "deep learning",
            "computer vision",
            "natural language processing",
            "nlp",
            "ai",
            "ia",
        ],
        "data": [
            "data analysis",
            "data analytics",
            "data science",
            "business intelligence",
            "big data",
            "analytics",
            "data",
        ],
        "software": [
            "web development",
            "software development",
            "website development",
            "web developer",
            "web developers",
            "software engineering",
            "saas development",
            "application development",
            "développement web",
            "developpement web",
            "développement logiciel",
            "developpement logiciel",
            "software",
            "programming",
        ],
        "cybersecurity": [
            "cybersecurity",
            "cyber security",
            "cybersecurite",
        ],
        "cloud": [
            "cloud",
            "devops",
            "infrastructure",
        ],
        "e-commerce": [
            "e-commerce",
            "ecommerce",
        ],
    }

    requested_interests = {
        interest
        for interest, phrases in interest_groups.items()
        if any(contains_term(text, phrase) for phrase in phrases)
    }

    skill_terms = [
        "scikit-learn",
        "javascript",
        "typescript",
        "tensorflow",
        "pytorch",
        "power bi",
        "python",
        "pandas",
        "tableau",
        "excel",
        "sql",
        "java",
        "react",
        "flask",
        "fastapi",
        "docker",
        "azure",
        "aws",
    ]

    requested_skills = {
        skill
        for skill in skill_terms
        if contains_term(text, skill)
    }

    results = []

    for company in companies:
        city = normalize(company.get("city", ""))
        name = normalize(company.get("name", ""))
        description = normalize(company.get("description", ""))

        domains = [
            normalize(item)
            for item in (company.get("domains") or [])
        ]

        technologies = [
            normalize(item)
            for item in (company.get("technologies") or [])
        ]

        primary_type = normalize(company.get("primaryType", ""))

        if normalized_requested_cities and city not in normalized_requested_cities:
            if not (
                city == "marrakesh"
                and "marrakech" in normalized_requested_cities
            ):
                continue

        # Exclude event venues from employer recommendations.
        if "event venue" in primary_type:
            continue

        score = 0
        match_reasons = []

        for interest in requested_interests:
            phrases = interest_groups[interest]

            description_match = any(
                contains_term(description, phrase)
                for phrase in phrases
            )

            technology_match = any(
                contains_term(tech, phrase)
                for tech in technologies
                for phrase in phrases
            )

            domain_match = any(
                contains_term(domain, phrase)
                for domain in domains
                for phrase in phrases
            )

            name_match = any(
                contains_term(name, phrase)
                for phrase in phrases
            )

            if description_match:
                score += 5
                match_reasons.append(
                    f"Company description mentions: {interest}"
                )

            elif technology_match:
                score += 6
                match_reasons.append(
                    f"Technology label matches: {interest}"
                )

            elif domain_match:
                score += 2 if interest == "software" else 5
                match_reasons.append(
                    f"Broad domain label matches: {interest}"
                    if interest == "software"
                    else f"Domain label matches: {interest}"
                )

            elif name_match:
                score += 2
                match_reasons.append(
                    f"Company name mentions: {interest}"
                )

        for skill in requested_skills:
            if any(
                contains_term(tech, skill)
                for tech in technologies
            ):
                score += 2
                match_reasons.append(
                    f"Technology evidence: {skill}"
                )

            elif contains_term(description, skill):
                score += 1
                match_reasons.append(
                    f"Description mentions skill: {skill}"
                )

            elif contains_term(name, skill):
                score += 1
                match_reasons.append(
                    f"Company name mentions skill: {skill}"
                )

        if requested_interests and score == 0:
            continue

        if not requested_interests:
            if requested_skills:
                skill_evidence = any(
                    contains_term(tech, skill)
                    for skill in requested_skills
                    for tech in technologies
                ) or any(
                    contains_term(description, skill)
                    for skill in requested_skills
                ) or any(
                    contains_term(name, skill)
                    for skill in requested_skills
                )

                if not skill_evidence:
                    continue

                score += sum(
                    2
                    for skill in requested_skills
                    if any(
                        contains_term(tech, skill)
                        for tech in technologies
                    )
                    or contains_term(description, skill)
                    or contains_term(name, skill)
                )

            else:
                continue

        results.append((score, company, match_reasons))

    results.sort(
        key=lambda item: (
            item[0],
            bool(item[1].get("website")),
            float(item[1].get("rating") or 0),
        ),
        reverse=True,
    )

    unique = []
    seen = set()

    for score, company, match_reasons in results:
        company_id = company.get("id") or company.get("name")

        if company_id in seen:
            continue

        seen.add(company_id)

        unique.append({
            "id": company.get("id"),
            "name": company.get("name"),
            "city": company.get("city"),
            "domains": company.get("domains") or [],
            "technologies": company.get("technologies") or [],
            "description": company.get("description") or "",
            "website": company.get("website") or "",
            "score": score,
            "match_reasons": match_reasons,
        })

        if len(unique) >= limit:
            break

    return unique


# ============================================================
# WAYVIA AI CHAT ASSISTANT
# ============================================================

@app.post("/api/assistant/chat")
def assistant_chat():
    if not groq_client:
        return jsonify({
            "error": "AI assistant is not configured. Please contact the administrator."
        }), 503

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify({"error": "Please enter a message."}), 400

    if len(message) > 4000:
        return jsonify({"error": "Message is too long. Maximum length is 4000 characters."}), 400

    try:
        matches = search_companies(message)
        opportunities = get_verified_opportunities()

        selected_opportunity_url = data.get(
            "selected_opportunity_url"
        )

        selected_opportunity = None

        if selected_opportunity_url:
            selected_opportunity = find_published_opportunity(
                selected_opportunity_url
            )

            if not selected_opportunity:
                return jsonify({
                    "error": "This opportunity could not be found in WayVia's published opportunities. Please select it again."
                }), 404

        context = {
            "companies": matches,
            "verified_opportunities": opportunities[:20],
            "selected_published_opportunity": selected_opportunity
        }

        system_prompt = """
You are WayVia's AI career assistant for students and recent graduates in Morocco.

Help users discover companies, internships, jobs, and career opportunities.

IMPORTANT RULES:
- Use only the company and opportunity information provided in the context.
- Never invent companies, job openings, application links, or details.
- Clearly distinguish company recommendations from verified job opportunities.
- A selected_published_opportunity comes from WayVia's published opportunities dataset, not necessarily the independently verified CSV.
- When analyzing a selected opportunity, use its exact title, company, description, domains, and experience information.
- Never claim an opportunity is still open or accepting applications just because it appears in the dataset.
- Explain when experience requirements are unspecified rather than assuming the role is entry-level.
- Never invent student qualifications, CV evidence, or job requirements.
- If no relevant results are available, say so honestly.
- Give practical, concise answers.
- Reply in the same language as the user's message (English, French, or Arabic).
"""

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Student's message:\n{message}\n\n"
                        f"WayVia database context:\n"
                        f"{json.dumps(context, ensure_ascii=False)}"
                    )
                }
            ],
            temperature=0.3,
            max_tokens=700
        )

        reply = response.choices[0].message.content

        return jsonify({
            "reply": reply,
            "companies": matches,
            "verified_opportunities": opportunities[:20],
            "selected_opportunity": (
                selected_opportunity
                if selected_opportunity
                else None
            )
        })

    except Exception as error:
        print("WayVia assistant error:", type(error).__name__, str(error))

        return jsonify({
            "error": "The AI assistant could not process your request. Please try again."
        }), 502


# ============================================================
# 6. JOOBLE HELPERS
# ============================================================

def normalize_text(value):
    """Normalize text for consistent comparisons."""

    value = unicodedata.normalize("NFKD", str(value or ""))

    value = "".join(
        char for char in value
        if not unicodedata.combining(char)
    )

    return value.casefold().strip()


def contains_phrase(text, phrase):
    """
    Match a complete phrase or word rather than an arbitrary
    substring. This prevents matches such as 'machine' inside
    unrelated expressions from being treated as AI evidence.
    """

    text = normalize_text(text)
    phrase = normalize_text(phrase)

    if not text or not phrase:
        return False

    pattern = (
        r"(?<![a-z0-9])"
        + re.escape(phrase)
        + r"(?![a-z0-9])"
    )

    return bool(re.search(pattern, text))


def has_any_keyword(text, keywords):
    return any(
        contains_phrase(text, keyword)
        for keyword in keywords
    )


def get_student_priority(title, description):
    title_text = normalize_text(title)
    description_text = normalize_text(description)

    # 1. Explicit internship / PFE indicators in job titles
    internship_title_keywords = [
        "internship",
        "intern",
        "stage",
        "stagiaire",
        "pfe",
        "trainee",
        "apprentice",
        "apprenticeship",
        "apprentissage",
    ]

    # 2. More specific internship indicators in descriptions
    internship_description_keywords = [
        "internship",
        "intern",
        "stagiaire",
        "trainee",
        "apprentice",
        "apprenticeship",
        "apprentissage",
        "offre de stage",
        "stage pfe",
        "stage de fin d'etudes",
        "stage de fin d'etude",
        "stage pre-embauche",
        "projet de fin d'etudes",
        "projet de fin d'etude",
        "final year project",
        "end of studies",
        "recherche de stage",
        "recherche un stage",
        "etudiant en derniere annee",
        "etudiante en derniere annee",
        "derniere annee d'etudes",
        "stage de fin de formation",
        "stage obligatoire",
    ]

    if has_any_keyword(title_text, internship_title_keywords):
        return 1, "internship_pfe"

    if has_any_keyword(description_text, internship_description_keywords):
        return 1, "internship_pfe"

    # 3. Explicit junior / entry-level indicators
    junior_keywords = [
        "junior",
        "entry level",
        "entry-level",
        "debutant",
        "jeune diplome",
        "new graduate",
        "recent graduate",
        "fresh graduate",
        "0-2 years",
        "0 to 2 years",
        "1-2 years",
        "less than 2 years",
        "no experience required",
        "sans experience",
        "aucune experience",
        "debutant accepte",
        "debutante acceptee",
        "premiere experience",
        "profil junior",
        "jeune talent",
        "moins de 2 ans d'experience",
        "0 a 2 ans d'experience",
    ]

    if has_any_keyword(title_text, junior_keywords):
        return 2, "junior_entry_level"

    if has_any_keyword(description_text, junior_keywords):
        return 2, "junior_entry_level"

    # 4. Relevant job, but no explicit student-friendly indication
    return 3, "other_relevant"



def get_domain_evidence(job, domain):
    """
    Calculate domain relevance using stronger phrases.
    Title matches receive more weight than description matches.
    Explicit AI/ML evidence in descriptions can qualify independently.
    """

    title = normalize_text(job.get("title", ""))

    description = normalize_text(
        job.get("snippet", "")
        or job.get("description", "")
    )

    evidence = []

    for keyword in DOMAIN_EVIDENCE[domain]:

        if contains_phrase(title, keyword):
            evidence.append({
                "keyword": keyword,
                "source": "title",
                "weight": 3,
            })

        elif contains_phrase(description, keyword):
            evidence.append({
                "keyword": keyword,
                "source": "description",
                "weight": 1,
            })

    score = sum(item["weight"] for item in evidence)

    title_match = any(
        item["source"] == "title"
        for item in evidence
    )

    description_keywords = {
        item["keyword"]
        for item in evidence
        if item["source"] == "description"
    }

    if domain == "ai":
        domain_match = (
            title_match
            or len(description_keywords) >= 2
            or any(
                keyword in description_keywords
                for keyword in [
                    "machine learning",
                    "artificial intelligence",
                    "deep learning",
                    "computer vision",
                    "natural language processing",
                    "generative ai",
                    "large language model",
                ]
            )
        )
    else:
        domain_match = title_match or score >= 2

    return domain_match, score, evidence


def is_obviously_unrelated(title):
    """
    Exclude clearly unrelated occupations using the job title.

    This is intentionally conservative: it does not reject
    general technical roles such as cloud or system engineers.
    """

    title = normalize_text(title)

    unrelated_roles = [
        "sales representative",
        "sales agent",
        "sales executive",
        "telesales",
        "tele sales",
        "account manager",
        "business development representative",
        "call center agent",
        "customer service agent",
        "customer support agent",
        "content moderator",
        "sushi chef",
        "head chef",
        "chef de cuisine",
        "waiter",
        "waitress",
        "housekeeping",
        "production operator",
        "machine operator",
        "factory worker",
        "hotel receptionist",
        "restaurant manager",
        "cashier",
        "storekeeper",
    ]

    return has_any_keyword(title, unrelated_roles)


def conflicts_with_selected_city(job_location, selected_city):
    """
    Reject an explicit conflict with another Moroccan city.

    Generic locations such as Morocco and Remote are retained.
    """

    if not selected_city or not job_location:
        return False

    location_text = normalize_text(job_location)

    selected_aliases = [
        normalize_text(alias)
        for alias in CITY_ALIASES[selected_city]
    ]

    selected_is_mentioned = any(
        contains_phrase(location_text, alias)
        for alias in selected_aliases
    )

    if selected_is_mentioned:
        return False

    for other_city, aliases in CITY_ALIASES.items():

        if other_city == selected_city:
            continue

        if any(
            contains_phrase(location_text, alias)
            for alias in aliases
        ):
            return True

    return False

# ============================================================
# 7. JOOBLE OPPORTUNITIES API
# ============================================================

@app.get("/api/opportunities/jooble")
def jooble_opportunities():

    api_key = os.getenv("JOOBLE_API_KEY")

    if not api_key:
        return jsonify({
            "error": "Jooble API is not configured."
        }), 503

    domain = request.args.get(
        "domain", ""
    ).strip().lower()

    city = request.args.get(
        "city", ""
    ).strip()

    if domain not in JOOBLE_DOMAINS:
        return jsonify({
            "error": "Choose a valid domain.",
            "valid_domains": list(JOOBLE_DOMAINS.keys()),
        }), 400

    if city and city not in ALLOWED_CITIES:
        return jsonify({
            "error": "Unsupported city.",
            "allowed_cities": sorted(ALLOWED_CITIES),
        }), 400

    location = city or "Morocco"

    all_jobs = {}
    jooble_total = 0
    successful_requests = 0
    failed_queries = []

    try:

        # ----------------------------------------------------
        # 1. SEARCH JOOBLE
        # ----------------------------------------------------

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

                successful_requests += 1

                jooble_total += int(
                    data.get("totalCount", 0) or 0
                )

                for job in data.get("jobs", []):

                    job_link = (
                        job.get("link") or ""
                    ).strip()

                    if job_link:
                        unique_key = job_link.casefold()

                    else:
                        unique_key = "|".join([
                            normalize_text(job.get("title", "")),
                            normalize_text(job.get("company", "")),
                            normalize_text(job.get("location", "")),
                        ])

                    all_jobs.setdefault(unique_key, job)

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

                continue

        if successful_requests == 0:
            return jsonify({
                "error": "Unable to retrieve opportunities right now."
            }), 502

        # ----------------------------------------------------
        # 2. PROCESS AND FILTER RESULTS
        # ----------------------------------------------------

        opportunities = []

        filtered_unrelated = 0
        filtered_city = 0
        filtered_domain = 0
        rejected_samples = []

        for job in all_jobs.values():

            title = (
                job.get("title") or ""
            ).strip()

            company = (
                job.get("company") or ""
            ).strip()

            job_location = (
                job.get("location") or ""
            ).strip()

            description = (
                job.get("snippet")
                or job.get("description")
                or ""
            ).strip()

            link = (
                job.get("link") or ""
            ).strip()

            if not title:
                continue

            # Remove obvious non-technical roles.
            if is_obviously_unrelated(title):
                filtered_unrelated += 1
                continue

            # Reject explicit conflicts with the requested city.
            if conflicts_with_selected_city(job_location, city):
                filtered_city += 1
                continue

            # Evaluate domain relevance FIRST.
            domain_match, relevance_score, evidence = (
                get_domain_evidence(job, domain)
            )

            # Keep rejected examples for debugging.
            if not domain_match:
                filtered_domain += 1

                if len(rejected_samples) < 20:
                    rejected_samples.append({
                        "title": title,
                        "company": company,
                        "description": description[:350],
                    })

                continue

            # Keep only jobs with sufficient domain evidence.
            # A single weak description keyword is not enough.
            if not domain_match:
                filtered_domain += 1
                continue

            priority, category = get_student_priority(
                title,
                description
            )

            match_reasons = [
                f"{item['keyword']} ({item['source']})"
                for item in evidence
            ]

            if priority == 1:
                match_reasons.append(
                    "Explicit internship/PFE evidence"
                )

            elif priority == 2:
                match_reasons.append(
                    "Junior or entry-level evidence"
                )

            opportunity = {
                "title": title,
                "company": company,
                "location": job_location,
                "description": description,
                "link": link,
                "source": "Jooble",
                "domain": domain,

                "domain_match": True,
                "relevance": "domain_related",
                "relevance_score": relevance_score,
                "match_reasons": match_reasons,

                "student_friendly": priority in (1, 2),
                "category": category,
                "priority": priority,

                "updated": job.get("updated", ""),
                "salary": job.get("salary", ""),
                "type": job.get("type", ""),
            }

            opportunities.append(opportunity)

        # ----------------------------------------------------
        # 3. SORT BY STUDENT PRIORITY AND RELEVANCE
        # ----------------------------------------------------

        opportunities.sort(
            key=lambda item: (
                item["priority"],
                -item["relevance_score"],
                normalize_text(item["title"]),
            )
        )

        # ----------------------------------------------------
        # 4. COUNTS
        # ----------------------------------------------------

        internship_count = sum(
            1 for job in opportunities
            if job["priority"] == 1
        )

        junior_count = sum(
            1 for job in opportunities
            if job["priority"] == 2
        )

        other_count = sum(
            1 for job in opportunities
            if job["priority"] == 3
        )

        domain_match_count = len(opportunities)

        # ----------------------------------------------------
        # 5. API RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "source": "Jooble",
            "domain": domain,
            "city": location,

            "total": len(opportunities),
            "total_from_jooble": jooble_total,
            "total_unique_fetched": len(all_jobs),

            "total_domain_matches": domain_match_count,

            "total_internship_pfe": internship_count,
            "total_junior_entry_level": junior_count,
            "total_other": other_count,

            "successful_queries": successful_requests,
            "failed_queries": failed_queries,

            "filtering": {
                "filtered_unrelated": filtered_unrelated,
                "filtered_city_conflicts": filtered_city,
                "filtered_domain_mismatch": filtered_domain,
            },

            "opportunities": opportunities,

            # Preserve old fields for frontend compatibility.
            "total_plausible": 0,
            "total_related": 0,
            "total_suggestions": 0,
            "plausible_opportunities": [],
            "related_opportunities": [],
            "suggestions": [],
            "debug_rejected_samples": rejected_samples,
        })

    except Exception as error:

        print(
            f"Jooble opportunities error: "
            f"{type(error).__name__}: {error}"
        )

        return jsonify({
            "error": "Unable to retrieve opportunities right now."
        }), 502


# ============================================================
# 8. AI CV ASSISTANT
# ============================================================

@app.post("/api/cv/assist")
def cv_assistant():

    if not groq_client:
        return jsonify({
            "error": "AI service is not configured. Check GROQ_API_KEY."
        }), 503

    data = request.get_json(silent=True) or {}

    task = data.get("task", "").strip()
    cv_content = data.get("cv_content", {})

    allowed_tasks = {
        "generate_summary",
        "improve_experience",
        "improve_project",
        "suggest_skills",
        "review_cv",
    }

    if task not in allowed_tasks:
        return jsonify({
            "error": "Invalid CV assistance task."
        }), 400

    if not isinstance(cv_content, dict):
        return jsonify({
            "error": "CV content must be a JSON object."
        }), 400


    task_instructions = {
        "generate_summary": (
            "Create a professional CV summary using only the student's "
            "verified information. The summary must be 40-70 words, "
            "written as one polished paragraph. "
            "If essential information is missing or the target role is "
            "unclear, do not write a summary. Ask at most two short, "
            "specific questions instead."
        ),


        "improve_experience": (
            "Rewrite the user's existing work experience, internship, "
            "volunteer work, or project descriptions into concise, "
            "professional, ATS-friendly CV content. "
            "Understand the information provided, even when it consists "
            "of only a short title and description. "
            "Identify the user's role, actual responsibilities, "
            "and relevant contributions. "
            "Use strong, appropriate action verbs and clear professional "
            "language while preserving the original meaning. "
            "Never invent responsibilities, technical skills, tools, "
            "achievements, metrics, or results. "
            "Do not exaggerate the user's level of responsibility or "
            "claim individual ownership of team achievements. "
            "If the description is sufficient, rewrite it directly "
            "without asking unnecessary questions. "
            "If essential information is missing, ask one short, "
            "specific clarification question. "
            "Return only the improved CV content when sufficient "
            "information is available. "
            "Do not create examples, templates, or unrelated advice."
        ),



        "improve_project": (
            "Rewrite the student's existing project descriptions into "
            "professional, CV-ready content. Highlight real technologies, "
            "personal contributions and outcomes. "
            "If project information is missing, ask the student to provide "
            "the project details. Do not invent examples or templates."
        ),


        "suggest_skills": (
            "Suggest relevant skills for the student's stated target role "
            "based strictly on the supplied CV content and target role. "
            "Organize the response into exactly three sections: "
            "1. ALREADY LISTED: skills explicitly present in the CV. "
            "2. EVIDENCED BY EDUCATION / PROJECTS: skills clearly demonstrated "
            "by the supplied coursework or project contributions. "
            "Do not infer expertise from a tool merely being mentioned. "
            "Distinguish model integration or evaluation from independently "
            "training or developing models. "
            "3. PRIORITIES TO LEARN: recommend at most five skills or tools "
            "that would be most useful for the target role and the student's "
            "current level. Prioritize practical, achievable skills over "
            "advanced or unrelated technologies. "
            "Keep each item concise and CV-friendly. "
            "Group evidenced skills into relevant categories such as "
            "Programming, Data Analysis, Machine Learning, and Development "
            "when appropriate. "
            "Never move a recommended skill into an existing-skills section. "
            "Never invent experience, proficiency, tools, or qualifications. "
            "If a section has no evidence, say so briefly. "
            "Keep the entire response concise, specific, and easy to scan."
            "Do not recommend a skill as something to learn if the CV "
            "or project history already demonstrates its use. "
            "In particular, recognize Git and GitHub when supported "
            "by the student's project or development history. "
            "For machine-learning tools, describe the actual contribution "
            "accurately, such as integration, evaluation, or inference, "
            "rather than assuming independent model training."
            "Prioritize skills that fill genuine gaps in the student's profile. "
            "Base learning recommendations on genuine gaps in the supplied "
            "CV and project history. Never recommend a skill as new when "
            "the supplied information already demonstrates its use."

        ),



        "review_cv": (
            "Review the CV specifically for the student's stated target role. "
            "Start with a brief overall assessment based only on the information provided. "
            "Organize your feedback into three categories: "
            "CRITICAL (issues that could weaken the application), "
            "RECOMMENDED (important improvements to make now), "
            "OPTIONAL (enhancements that can wait). "
            "Identify at most two points per category. "
            "Check content accuracy, relevance to the target role, "
            "repetition between Experience and Projects, missing sections, "
            "ATS readability, and consistency. "
            "Do not assume that the user has certifications, language levels, "
            "or technical skills that are not explicitly supported by the CV. "
            "Never invent missing information. "
            "Give specific, actionable recommendations rather than generic advice. "
            "Do not rewrite the CV or modify its content. "
            "End with one focused question only if essential information is missing. "
            "Keep the entire review concise and easy to scan."
        ),

    }

    system_prompt = """
    You are RayRay, WayVia's friendly and professional AI CV assistant.

    Your purpose is to help students and recent graduates create
    honest, clear, ATS-friendly CVs for internships and entry-level jobs.

    GENERAL RULES:
    - Never invent education, experience, projects, skills or achievements.
    - Never fabricate statistics, dates, certifications or qualifications.
    - Use only information supported by the supplied CV.
    - Be concise, helpful and friendly.
    - Adapt your response to the student's actual level and target role.
    - Never give long tutorials or generic CV-writing guides.
    - Never produce fictional examples to fill missing information.

    IMPORTANT RESPONSE FORMAT:

    For generate_summary, improve_experience and improve_project:

    If sufficient information exists to produce actual CV content:
    Start your response with exactly:
    CV_CONTENT:

    Then provide ONLY the final CV-ready content.
    Do not include headings, explanations, introductions, examples,
    templates or advice.

    If essential information is missing:
    Start your response with exactly:
    GUIDANCE:

    Then ask at most two short, specific questions.
    Do not generate placeholder CV content.

    For suggest_skills:
    Use short sections:
    - Already listed
    - Evidenced by education/projects
    - Worth learning

    Keep recommendations relevant and distinguish confirmed skills
    from skills that are only recommended.

    For review_cv:
    Use this structure:
    - Overall assessment
    - Top 3 improvements
    - One next question

    Keep the entire review concise and practical.

    Never use the CV_CONTENT marker for advice, questions,
    templates or recommendations.
    """

    try:

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": (
                        f"Task: {task_instructions[task]}\n\n"
                        "Student CV information:\n"
                        f"{json.dumps(cv_content, ensure_ascii=False)}"
                    ),
                },
            ],
            temperature=0.4,
            max_tokens=1200,
        )

        result = response.choices[0].message.content.strip() # type: ignore

        return jsonify({
            "success": True,
            "task": task,
            "result": result,
        })

    except Exception as error:

        print(
            f"CV assistant error: "
            f"{type(error).__name__}: {error}"
        )

        return jsonify({
            "error": "The CV assistant could not generate a response."
        }), 502


# ============================================================
# 8. APPLICATION START
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
