
import re
import unicodedata


# --------------------------------------------------
# 1. TEXT NORMALIZATION
# --------------------------------------------------

def normalize_text(value):
    """Normalize text for reliable keyword matching."""
    if not value:
        return ""

    value = str(value).lower().strip()

    value = unicodedata.normalize("NFKD", value)
    value = "".join(
        char for char in value
        if not unicodedata.combining(char)
    )

    value = re.sub(r"[^a-z0-9+#. ]", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value


# --------------------------------------------------
# 2. DOMAIN KEYWORDS
# --------------------------------------------------

DOMAIN_KEYWORDS = {
    "ai": {
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "intelligence artificielle",
        "generative ai",
        "computer vision",
        "natural language processing",
        "nlp",
        "llm",
        "large language model",
        "neural network",
        "tensorflow",
        "pytorch",
        "opencv",
        "mediapipe",
        "data science",
        "ml engineer",
        "ai engineer",
    },

    "data": {
        "data analyst",
        "data analysis",
        "data engineer",
        "data scientist",
        "data science",
        "business intelligence",
        "power bi",
        "tableau",
        "sql",
        "etl",
        "data warehouse",
        "data visualization",
        "big data",
        "machine learning",
        "python",
        "statistics",
    },

    "web": {
        "web developer",
        "web development",
        "frontend",
        "front end",
        "backend",
        "back end",
        "full stack",
        "fullstack",
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue.js",
        "node.js",
        "laravel",
        "php",
        "html",
        "css",
        "django",
        "flask",
        "wordpress",
    },

    "networking": {
        "network engineer",
        "network administrator",
        "networking",
        "network security",
        "cybersecurity",
        "cyber security",
        "system administrator",
        "systems administrator",
        "cloud engineer",
        "cloud computing",
        "devops",
        "infrastructure",
        "cisco",
        "linux",
        "firewall",
        "computer networks",
        "administrateur reseau",
        "technicien reseau",
    },
}

# Foreign cities explicitly identified in job titles.
# Expand this list as we encounter more international listings.
FOREIGN_CITIES = {
    "lyon",
    "paris",
    "marseille",
    "toulouse",
    "bordeaux",
    "lille",
    "nantes",
    "grenoble",
    "montpellier",
    "strasbourg",
}



# --------------------------------------------------
# 3. STUDENT PRIORITY KEYWORDS
# --------------------------------------------------

INTERNSHIP_KEYWORDS = {
    "intern",
    "internship",
    "internships",
    "intern",
    "internship program",
    "stagiaire",
    "stage",
    "stage pfe",
    "pfe",
    "end of studies",
    "final year project",
    "fin d etudes",
    "fin de formation",
    "pre employment",
    "trainee",
    "apprentice",
    "apprenticeship",
}

JUNIOR_KEYWORDS = {
    "junior",
    "entry level",
    "entry-level",
    "graduate",
    "new graduate",
    "fresh graduate",
    "young graduate",
    "0-2 years",
    "0 to 2 years",
    "1-2 years",
    "less than 2 years",
    "debutant",
    "débutant",
    "jeune diplome",
    "recent graduate",
}


# --------------------------------------------------
# 4. DOMAIN MATCHING
# --------------------------------------------------

def get_domain_matches(opportunity):
    """
    Identify which WayVia domains are supported by
    evidence in the title and description.
    """

    title = normalize_text(opportunity.get("title", ""))
    description = normalize_text(
        opportunity.get("description", "")
    )

    matches = []

    for domain, keywords in DOMAIN_KEYWORDS.items():

        title_matches = [
            keyword for keyword in keywords
            if normalize_text(keyword) in title
        ]

        description_matches = [
            keyword for keyword in keywords
            if normalize_text(keyword) in description
        ]

        # Title evidence is stronger than description evidence.
        if title_matches or len(description_matches) >= 2:
            matches.append(domain)

    return matches


# --------------------------------------------------
# 5. STUDENT PRIORITY CLASSIFICATION
# --------------------------------------------------


def get_student_priority(opportunity):
    """
    Conservative classification based primarily on the job title.
    1 = Internship / PFE
    2 = Junior / Entry-level
    3 = Other relevant jobs
    """

    title = normalize_text(opportunity.get("title", ""))

    internship_patterns = [
        r"\bintern\b",
        r"\binternship\b",
        r"\btrainee\b",
        r"\bstagiaire\b",
        r"\bstage\b",
        r"\bpfe\b",
        r"\bapprentice\b",
        r"\bapprenticeship\b",
        r"\bgraduate internship\b",
        r"\bfinal year project\b",
        r"\bend of studies\b",
        r"\bfin d etudes\b",
    ]

    junior_patterns = [
        r"\bjunior\b",
        r"\bentry level\b",
        r"\bgraduate\b",
        r"\bfresh graduate\b",
        r"\bdebutant\b",
        r"\bjeune diplome\b",
    ]

    if any(re.search(pattern, title) for pattern in internship_patterns):
        return 1, "internship_pfe"

    if any(re.search(pattern, title) for pattern in junior_patterns):
        return 2, "junior_entry_level"

    return 3, "other_relevant"



# --------------------------------------------------
# 6. EXPERIENCE LEVEL DETECTION
# --------------------------------------------------

def detect_experience_level(opportunity):
    text = normalize_text(
        opportunity.get("title", "")
    ) + " " + normalize_text(
        opportunity.get("description", "")
    )

    senior_keywords = [
        "senior",
        "lead",
        "principal",
        "head of",
        "director",
        "manager",
        "5+ years",
        "5 years",
        "10 years",
    ]

    if any(keyword in text for keyword in senior_keywords):
        return "experienced"

    return "not_specified"


def has_foreign_location_conflict(opportunity):
    """
    Detect a known foreign city explicitly mentioned
    in the job title when the location field says Morocco.
    """

    title = normalize_text(opportunity.get("title", ""))
    location = normalize_text(opportunity.get("location", ""))

    if not location:
        return False

    for city in FOREIGN_CITIES:
        if re.search(r"\b" + re.escape(city) + r"\b", title):
            return True

    return False


# --------------------------------------------------
# 7. PROCESS ONE OPPORTUNITY
# --------------------------------------------------

def process_one_opportunity(opportunity):

    if not isinstance(opportunity, dict):
        return None

    title = str(opportunity.get("title") or "").strip()

    if not title:
        return None

    domain_matches = get_domain_matches(opportunity)

    # Reject results without evidence of relevance
    # to any of WayVia's four domains.
    if not domain_matches:
        return None
    # Exclude listings with a known foreign city in the title.
    if has_foreign_location_conflict(opportunity):
        return None

    priority, opportunity_type = get_student_priority(
        opportunity
    )

    result = opportunity.copy()

    # Application method and verification details
    result["application_method"] = "jooble"
    result["direct_application_url"] = ""
    result["employer_email"] = ""
    result["email_verified"] = False
    result["application_source_url"] = ""

    result["domains"] = domain_matches
    result["opportunity_type"] = opportunity_type
    result["student_priority"] = priority
    result["experience_level"] = detect_experience_level(
        opportunity
    )

    result["is_student_friendly"] = priority in (1, 2)

    return result


# --------------------------------------------------
# 8. PROCESS A COLLECTION
# --------------------------------------------------

def process_opportunities(raw_opportunities):

    processed = []
    seen = set()

    for opportunity in raw_opportunities:

        result = process_one_opportunity(opportunity)

        if result is None:
            continue

        # Normalize URLs and remove tracking parameters.
        url = (result.get("application_url") or "").strip()

        if url:
            unique_key = url.split("?")[0].rstrip("/").lower()
        else:
            unique_key = "|".join([
                normalize_text(result.get("title", "")),
                normalize_text(result.get("company", "")),
                normalize_text(result.get("location", "")),
            ])

        if unique_key in seen:
            continue

        seen.add(unique_key)
        processed.append(result)

    # Student-focused opportunities first.
    processed.sort(
        key=lambda item: (
            item["student_priority"],
            item["experience_level"] == "experienced",
            normalize_text(item.get("title", "")),
        )
    )

    return processed


# --------------------------------------------------
# 9. COLLECTION SUMMARY
# --------------------------------------------------

def get_processing_summary(raw_opportunities, processed):

    return {
        "raw_count": len(raw_opportunities),
        "processed_count": len(processed),
        "removed_count": len(raw_opportunities) - len(processed),

        "internship_pfe": sum(
            item["student_priority"] == 1
            for item in processed
        ),

        "junior_entry_level": sum(
            item["student_priority"] == 2
            for item in processed
        ),

        "other_relevant": sum(
            item["student_priority"] == 3
            for item in processed
        ),

        "experienced": sum(
            item["experience_level"] == "experienced"
            for item in processed
        ),
    }
