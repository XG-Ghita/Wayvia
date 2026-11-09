# WayVia

**Discover companies. Explore opportunities. Build your professional future.**

WayVia is a student-oriented platform designed to help students in Morocco discover companies, explore internship and job opportunities, and access career-support tools in one place.

The platform brings together company discovery, opportunity exploration, an AI-powered career assistant, and an interactive insights dashboard.

## Live Demo

- **Website:** https://xg-ghita.github.io/Wayvia/
- **Opportunities:** https://xg-ghita.github.io/Wayvia/html/opportunities.html
- **Insights Dashboard:** https://wayvia-two.vercel.app/insights/
- **GitHub Repository:** https://github.com/XG-Ghita/Wayvia

The frontend is deployed on GitHub Pages, while the backend and dashboard are hosted on Vercel.

## Main Features

### 1. Company Discovery
- Explore companies across eight Moroccan cities.
- Browse company information and available website details.
- Search and discover organizations based on the platform's collected data.

### 2. Job and Internship Opportunities
- Browse job and internship listings.
- Open a dedicated WayVia details page for each opportunity.
- View available information such as company, location, description, experience level, and publication date.
- Follow the available external application destination.
- Track opportunities through the My Applications feature.

### 3. AI Career Assistant
- Access AI-powered career guidance.
- Request assistance with understanding and analyzing opportunities.
- Get career-related support through the integrated assistant.

### 4. Insights Dashboard
- Explore company and opportunity information through interactive visualizations.
- Discover useful indicators and summaries.
- Built using Dash and Plotly and integrated with the Flask backend.

## Data Collection and Preparation

WayVia includes a Morocco-wide company dataset collected and prepared for the platform.

Dataset overview:

| Metric | Result |
|---|---:|
| Company records | 1,736 |
| Cities covered | 8 |
| Google Places search queries per city | 20 |
| Duplicate place IDs in the master dataset | 0 |

**Cities covered:**
- Marrakech
- Agadir
- Casablanca
- Rabat
- Meknes
- Oujda
- Tangier
- Fes

Website enrichment was also performed to collect additional company information. In the enrichment pilot, 1,258 out of 1,736 companies had usable websites, representing approximately 72.5%.

The project also includes an opportunity collection and review workflow. Opportunity availability and application information depend on the external sources and the information provided by each listing.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, Flask |
| Dashboard | Dash, Plotly |
| Data collection | Google Places |
| Data processing | Python, Pandas |
| AI assistant | Gemini integration |
| Frontend deployment | GitHub Pages |
| Backend and dashboard deployment | Vercel |
| Version control | Git, GitHub |

## Architecture

```text
                 STUDENT
                    |
                    v
             WAYVIA FRONTEND
           HTML / CSS / JavaScript
                    |
          +---------+----------+
          |         |          |
          v         v          v
       Company  Opportunities  AI Assistant
       Discovery   Explorer      Interface
          |         |          |
          +---------+----------+
                    |
                    v
              FLASK BACKEND
                 (Vercel)
                    |
             +------+------+
             |             |
             v             v
        Assistant API   Insights
                       Dashboard
                     (Dash/Plotly)
```

The frontend and backend/dashboard are deployed separately:

- GitHub Pages serves the static frontend.
- Vercel hosts the backend and the integrated dashboard.

## Project Structure

```text
WayVia/
│
├── backend/
│   ├── api/
│   ├── database/
│   ├── job_opportunities/
│   ├── models/
│   ├── notebooks/
│   ├── scraper/
│   ├── services/
│   └── utils/
│
├── dashboard/
│
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── data/
│   ├── html/
│   └── js/
│
└── README.md
```

## Running Locally

1. Clone the repository:

```bash
git clone https://github.com/XG-Ghita/Wayvia.git
cd Wayvia
```

2. Install the backend dependencies using the project's dependency configuration.

3. Configure the required environment variables locally. Never publish API keys, credentials, or `.env` files.

4. Start the Flask backend using the project's configured entry point.

5. Serve the `frontend` directory through a local web server and open the website in your browser.

The exact local configuration depends on the environment variables and dependencies used by the current deployment.

## Future Improvements

Potential improvements include:

- Expanding verified internship and job opportunity coverage.
- Improving the frequency and reliability of opportunity updates.
- Developing more advanced opportunity matching.
- Extending application management and CV-related features.
- Adding more indicators and visualizations to the Insights dashboard.

## License

No open-source license has been specified yet. Unless a license is added to this repository, all rights are reserved by the project contributors.
