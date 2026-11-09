
import json
from datetime import datetime, timezone
from pathlib import Path

from backend.job_opportunities.collectors.jooble_collector import (
    fetch_jooble_opportunities
)

from backend.job_opportunities.processors.opportunity_processor import (
    process_opportunities,
    get_processing_summary
)


# --------------------------------------------------
# 1. PATHS AND CONFIGURATION
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parents[2]

OUTPUT_FILE = (
    PROJECT_DIR
    / "frontend"
    / "data"
    / "wayvia_opportunities.json"
)

DOMAINS = ["ai", "data", "web", "networking"]
LOCATION = "Morocco"


# --------------------------------------------------
# 2. COLLECT ALL DOMAINS
# --------------------------------------------------

def collect_all_domains():

    all_raw_opportunities = []
    collection_report = []

    for domain in DOMAINS:

        print(f"\nCollecting {domain.upper()} opportunities...")

        try:
            result = fetch_jooble_opportunities(domain, LOCATION)

            opportunities = result.get("opportunities", [])
            successful_queries = result.get("successful_queries", 0)
            failed_queries = len(result.get("failed_queries", []))

            all_raw_opportunities.extend(opportunities)

            if successful_queries > 0 and failed_queries == 0:
                status = "success"
            elif successful_queries > 0:
                status = "partial"
            else:
                status = "failed"

            collection_report.append({
                "domain": domain,
                "fetched": len(opportunities),
                "successful_queries": successful_queries,
                "failed_queries": failed_queries,
                "status": status
            })

            print(f"Fetched: {len(opportunities)}")
            print(f"Successful queries: {successful_queries}")
            print(f"Failed queries: {failed_queries}")
            print(f"Status: {status}")

        except Exception as error:

            collection_report.append({
                "domain": domain,
                "fetched": 0,
                "successful_queries": 0,
                "failed_queries": 0,
                "status": "failed",
                "error": str(error)
            })

            print(f"Collection failed for {domain}: {error}")

    return all_raw_opportunities, collection_report


# --------------------------------------------------
# 3. LOAD EXISTING DATASET
# --------------------------------------------------

def load_existing_dataset():

    if not OUTPUT_FILE.exists():
        return {
            "metadata": {},
            "opportunities": []
        }

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            dataset = json.load(file)

        if not isinstance(dataset, dict):
            raise ValueError("Dataset must be a JSON object.")

        opportunities = dataset.get("opportunities", [])

        if not isinstance(opportunities, list):
            raise ValueError("The opportunities field must be a list.")

        return {
            "metadata": dataset.get("metadata", {}),
            "opportunities": opportunities
        }

    except (json.JSONDecodeError, OSError, ValueError) as error:
        raise RuntimeError(
            f"Could not safely load the existing dataset: {error}"
        ) from error


# --------------------------------------------------
# 4. IDENTIFY OPPORTUNITIES
# --------------------------------------------------

def get_opportunity_key(opportunity):

    application_url = (
        opportunity.get("application_url")
        or opportunity.get("url")
        or ""
    ).strip()

    if application_url:
        return ("url", application_url.rstrip("/").lower())

    title = (opportunity.get("title") or "").strip().lower()
    company = (opportunity.get("company") or "").strip().lower()
    location = (opportunity.get("location") or "").strip().lower()

    if title and company:
        return ("details", title, company, location)

    return None


# --------------------------------------------------
# 5. MERGE OLD AND NEW OPPORTUNITIES
# --------------------------------------------------

def merge_opportunities(existing, fresh, successful_domains):

    # Only replace a domain when it has fresh processed results.
    domains_to_refresh = {
        opportunity.get("domain_searched")
        for opportunity in fresh
        if opportunity.get("domain_searched") in successful_domains
    }

    # Preserve old records from domains without fresh results.
    merged = [
        opportunity
        for opportunity in existing
        if opportunity.get("domain_searched") not in domains_to_refresh
    ]

    merged.extend(fresh)

    unique_opportunities = []
    seen_keys = set()

    for opportunity in merged:

        key = get_opportunity_key(opportunity)

        if key is not None:
            if key in seen_keys:
                continue

            seen_keys.add(key)

        unique_opportunities.append(opportunity)

    return unique_opportunities

# --------------------------------------------------
# 6. SAVE DATASET SAFELY
# --------------------------------------------------

def save_opportunities(opportunities, summary, report):

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataset = {
        "metadata": {
            "project": "WayVia",
            "source": "Jooble",
            "location": LOCATION,
            "domains": DOMAINS,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "total_opportunities": len(opportunities),
            "summary": summary,
            "collection_report": report
        },
        "opportunities": opportunities
    }

    # Write to a temporary file before replacing the published dataset.
    temporary_file = OUTPUT_FILE.with_suffix(".tmp")

    with open(temporary_file, "w", encoding="utf-8") as file:
        json.dump(
            dataset,
            file,
            ensure_ascii=False,
            indent=2
        )

    temporary_file.replace(OUTPUT_FILE)

    print(f"\nDataset saved to:\n{OUTPUT_FILE}")


# --------------------------------------------------
# 7. MAIN PIPELINE
# --------------------------------------------------

def run_collection():

    print("=" * 50)
    print("WAYVIA OPPORTUNITIES COLLECTION")
    print("=" * 50)

    raw_opportunities, report = collect_all_domains()

    successful_domains = [
        item["domain"]
        for item in report
        if item["status"] == "success"
    ]

    # Never overwrite existing data if no domain completed.
    if not successful_domains:
        raise RuntimeError(
            "No domain completed successfully. "
            "The existing published dataset was left unchanged."
        )

    print("\nProcessing collected opportunities...")

    processed = process_opportunities(raw_opportunities)

    # Load existing published opportunities.
    existing_dataset = load_existing_dataset()
    existing_opportunities = existing_dataset["opportunities"]

    # Keep only new opportunities from fully successful domains.
    fresh_opportunities = [
        opportunity
        for opportunity in processed
        if opportunity.get("domain_searched") in successful_domains
    ]

    # Merge new records with records from unsuccessful domains.
    merged = merge_opportunities(
        existing_opportunities,
        fresh_opportunities,
        successful_domains
    )

    summary = get_processing_summary(
        raw_opportunities,
        processed
    )

    summary["previous_published_count"] = len(existing_opportunities)
    summary["newly_collected_count"] = len(fresh_opportunities)
    summary["final_published_count"] = len(merged)

    print("\nCOLLECTION SUMMARY")
    print("-" * 30)
    print("Raw results:", len(raw_opportunities))
    print("Processed results:", len(processed))
    print("Successfully refreshed domains:", successful_domains)
    print("New opportunities:", len(fresh_opportunities))
    print("Previously published:", len(existing_opportunities))
    print("Final published:", len(merged))

    save_opportunities(
        merged,
        summary,
        report
    )

    return merged


if __name__ == "__main__":
    run_collection()
