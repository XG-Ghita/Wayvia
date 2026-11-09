import json
from pathlib import Path


# Project directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "frontend" / "data"

COMPANIES_FILE = DATA_DIR / "wayvia_companies.json"
OPPORTUNITIES_FILE = DATA_DIR / "wayvia_opportunities.json"


def load_json(file_path):
    """Load and return JSON data from a file."""

    if not file_path.exists():
        raise FileNotFoundError(
            f"Data file not found: {file_path}"
        )

    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_companies():
    """Load the WayVia company directory."""

    data = load_json(COMPANIES_FILE)

    if not isinstance(data, list):
        raise ValueError(
            "The companies JSON must contain a list."
        )

    return data


def load_opportunities():
    """Load WayVia job and internship opportunities."""

    data = load_json(OPPORTUNITIES_FILE)

    if isinstance(data, dict):
        opportunities = data.get("opportunities", [])
    elif isinstance(data, list):
        opportunities = data
    else:
        raise ValueError(
            "Unexpected opportunities JSON structure."
        )

    return opportunities


def load_all_data():
    """Load both datasets."""

    return {
        "companies": load_companies(),
        "opportunities": load_opportunities()
    }