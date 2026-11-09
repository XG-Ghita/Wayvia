
from dash import Dash, html, dcc, Input, Output
import plotly.graph_objects as go
from typing import Dict
from dashboard.data_loader import load_all_data


# =========================================================
# CONFIGURATION
# =========================================================

COLORS = {
    "background": "#F7F8FC",
    "card": "#FFFFFF",
    "purple": "#8B5CF6",
    "blue": "#6366F1",
    "cyan": "#38BDF8",
    "text": "#29234A",
    "muted": "#737B91",
    "border": "#E8EAF3"
}

app = Dash(
    __name__,
    server=False,
    url_base_pathname='/insights/',
    title='WayVia | Market Insights'
)


# =========================================================
# DATA HELPERS
# =========================================================

def get_values(record, field):
    """Return a field as a clean list of strings."""

    value = record.get(field, [])

    if isinstance(value, str):
        value = [value]

    if not isinstance(value, list):
        return []

    return [
        str(item).strip()
        for item in value
        if item and str(item).strip()
    ]


def get_city(record):
    return str(
        record.get("city")
        or record.get("location_city")
        or "Unknown"
    ).strip()


def get_domain_options(companies, opportunities):
    domains = set()

    for company in companies:
        domains.update(get_values(company, "domains"))

    for opportunity in opportunities:
        domains.update(get_values(opportunity, "domains"))

    return sorted(domains, key=str.lower)


def filter_companies(companies, city, domain):
    results = companies

    if city and city != "All cities":
        results = [
            item for item in results
            if get_city(item).lower() == city.lower()
        ]

    if domain and domain != "All domains":
        results = [
            item for item in results
            if domain.lower() in [
                value.lower()
                for value in get_values(item, "domains")
            ]
        ]

    return results


def filter_opportunities(opportunities, city, domain):
    results = opportunities

    if city and city != "All cities":
        results = [
            item for item in results
            if city.lower() in str(
                item.get("location", "")
            ).lower()
        ]

    if domain and domain != "All domains":
        results = [
            item for item in results
            if domain.lower() in [
                value.lower()
                for value in get_values(item, "domains")
            ]
        ]

    return results


# =========================================================
# CHART HELPERS
# =========================================================

def empty_figure(message):
    fig = go.Figure()

    fig.add_annotation(
        text=message,
        x=0.5,
        y=0.5,
        xref="paper",
        yref="paper",
        showarrow=False,
        font=dict(color=COLORS["muted"], size=14)
    )

    fig.update_layout(
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#FFFFFF",
        font=dict(color=COLORS["text"]),
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        margin=dict(l=20, r=20, t=20, b=20)
    )

    return fig

def style_figure(fig, height=340):
    fig.update_layout(
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#FFFFFF",
        font=dict(
            family="Poppins, Segoe UI, Arial, sans-serif",
            color=COLORS["text"],
            size=12
        ),
        height=height,
        margin=dict(l=35, r=25, t=35, b=45),
        legend=dict(
            font=dict(color=COLORS["muted"]),
            bgcolor="rgba(255,255,255,0)"
        ),
        xaxis=dict(
            gridcolor="#EEF0F6",
            zerolinecolor="#E2E5EF",
            tickfont=dict(color=COLORS["muted"])
        ),
        yaxis=dict(
            gridcolor="#EEF0F6",
            zerolinecolor="#E2E5EF",
            tickfont=dict(color=COLORS["muted"])
        )
    )

    return fig


def make_city_chart(companies):
    counts: Dict[str, int] = {}
    for company in companies:
        city = get_city(company)
        counts[city] = counts.get(city, 0) + 1

    if not counts:
        return empty_figure("No company data available")

    cities = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Bar(
        x=[counts[city] for city in cities],
        y=cities,
        orientation="h",
        marker_color=COLORS["purple"],
        hovertemplate="%{y}: %{x} companies<extra></extra>"
    ))

    fig.update_layout(
        xaxis_title="Number of companies",
        yaxis_title="City",
        yaxis=dict(autorange="reversed")
    )
    return style_figure(fig)


def make_domain_chart(companies):
    counts: Dict[str, int] = {}
    for company in companies:
        for domain in get_values(company, "domains"):
            counts[domain] = counts.get(domain, 0) + 1

    if not counts:
        return empty_figure("Company domain classifications are limited")

    labels = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Bar(
        x=labels,
        y=[counts[label] for label in labels],
        marker_color=COLORS["cyan"],
        hovertemplate="%{x}: %{y} companies<extra></extra>"
    ))

    fig.update_layout(
        xaxis_title="Domain",
        yaxis_title="Companies"
    )
    return style_figure(fig)


def make_opportunity_chart(opportunities):
    counts: Dict[str, int] = {}

    for opportunity in opportunities:
        kind = opportunity.get("opportunity_type", "Unclassified")
        kind = str(kind or "Unclassified").replace("_", " ").title()
        counts[kind] = counts.get(kind, 0) + 1

    if not counts:
        return empty_figure("No opportunities found")

    labels = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Pie(
        labels=labels,
        values=[counts[label] for label in labels],
        hole=0.62,
        marker=dict(colors=[
            COLORS["purple"],
            COLORS["blue"],
            COLORS["cyan"],
            "#A78BFA",
            "#64748B"
        ]),
        textinfo="percent+label",
        hovertemplate="%{label}: %{value}<extra></extra>"
    ))

    return style_figure(fig)

# =========================================================
# ADDITIONAL OPPORTUNITY CHARTS
# =========================================================

def make_opportunity_domain_chart(opportunities):
    """Count each opportunity once per domain."""

    counts: Dict[str, int] = {}

    for opportunity in opportunities:
        domains = set(
            value.lower()
            for value in get_values(opportunity, "domains")
        )

        for domain in domains:
            counts[domain] = counts.get(domain, 0) + 1

    if not counts:
        return empty_figure("No domain data available")

    labels = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Bar(
        x=labels,
        y=[counts[label] for label in labels],
        marker_color=COLORS["purple"],
        hovertemplate="%{x}: %{y} opportunities<extra></extra>"
    ))

    fig.update_layout(
        xaxis_title="Domain",
        yaxis_title="Number of opportunities"
    )

    return style_figure(fig)


def make_student_friendly_chart(opportunities):
    counts = {
        "Student-friendly": 0,
        "Not student-friendly": 0,
        "Not specified": 0
    }

    for opportunity in opportunities:
        value = opportunity.get("is_student_friendly")

        if value is True:
            counts["Student-friendly"] += 1
        elif value is False:
            counts["Not student-friendly"] += 1
        else:
            counts["Not specified"] += 1

    if not any(counts.values()):
        return empty_figure("No student eligibility data available")

    fig = go.Figure(go.Pie(
        labels=list(counts.keys()),
        values=list(counts.values()),
        hole=0.62,
        marker=dict(colors=[
            COLORS["purple"],
            COLORS["blue"],
            "#CBD5E1"
        ]),
        textinfo="percent+label",
        hovertemplate="%{label}: %{value}<extra></extra>"
    ))

    return style_figure(fig)


def make_experience_chart(opportunities):
    counts: Dict[str, int] = {}

    for opportunity in opportunities:
        level = str(
            opportunity.get("experience_level") or "Not specified"
        ).replace("_", " ").title()

        counts[level] = counts.get(level, 0) + 1

    if not counts:
        return empty_figure("No experience-level data available")

    labels = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Bar(
        x=labels,
        y=[counts[label] for label in labels],
        marker_color=COLORS["blue"],
        hovertemplate="%{x}: %{y} opportunities<extra></extra>"
    ))

    fig.update_layout(
        xaxis_title="Experience level",
        yaxis_title="Number of opportunities"
    )

    return style_figure(fig)


def make_employment_type_chart(opportunities):
    counts: Dict[str, int] = {}

    for opportunity in opportunities:
        employment_type = str(
            opportunity.get("employment_type") or "Not specified"
        ).replace("_", " ").title()

        counts[employment_type] = (
            counts.get(employment_type, 0) + 1
        )

    if not counts:
        return empty_figure("No employment-type data available")

    labels = sorted(counts, key=lambda label: counts[label], reverse=True)

    fig = go.Figure(go.Bar(
        x=labels,
        y=[counts[label] for label in labels],
        marker_color=COLORS["cyan"],
        hovertemplate="%{x}: %{y} opportunities<extra></extra>"
    ))

    fig.update_layout(
        xaxis_title="Employment type",
        yaxis_title="Number of opportunities"
    )

    return style_figure(fig)

# =========================================================
# DASHBOARD COMPONENTS
# =========================================================

def metric_card(label, component_id):
    return html.Div(
        [
            html.P(label, className="metric-label"),
            html.H2("—", id=component_id)
        ],
        className="metric-card"
    )


def chart_card(title, graph_id):
    return html.Div(
        [
            html.H3(title),
            dcc.Graph(
                id=graph_id,
                config={"displayModeBar": True}
            )
        ],
        className="chart-card"
    )



# =========================================================
# LAYOUT
# =========================================================

app.layout = html.Div(
    [
       # NAVBAR
       html.Header(
           [
               html.Div(
                   [
                       # WAYVIA LOGO
                       html.A(
                           html.Img(
                               src="https://xg-ghita.github.io/Wayvia/assets/images/wayvia-logo_dark.png",
                               alt="WayVia",
                               className="brand-logo"
                           ),
                           href="https://xg-ghita.github.io/Wayvia/html/index.html",
                           className="brand"
                       ),

                       # NAVIGATION LINKS
                       html.Nav(
                           [
                               html.A(
                                   "Home",
                                   href="https://xg-ghita.github.io/Wayvia/html/index.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "Search",
                                   href="https://xg-ghita.github.io/Wayvia/html/search.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "Opportunities",
                                   href="https://xg-ghita.github.io/Wayvia/html/opportunities.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "My Applications",
                                   href="https://xg-ghita.github.io/Wayvia/html/my-applications.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "CV Generator",
                                   href="https://xg-ghita.github.io/Wayvia/html/cv-generator.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "Chat",
                                   href="https://xg-ghita.github.io/Wayvia/html/assistant.html",
                                   className="nav-link"
                               ),
                               html.A(
                                   "Insights",
                                   href="/insights/",
                                   className="nav-link active",
                                   **{"aria-current": "page"}
                               )
                           ],
                           className="main-nav"
                       ),

                       # PROFILE BUTTON
                       html.Button(
                           "G",
                           id="profileButton",
                           className="profile-button",
                           title="Open profile"
                       )
                   ],
                   className="navbar-inner"
               )
           ],
           className="navbar"
       ),
       
        # AUTOMATIC DATA REFRESH
        dcc.Interval(
            id="refresh-data",
            interval=5 * 60 * 1000,
            n_intervals=0
        ),

        # DASHBOARD HEADER AND FILTERS
        html.Div(
            [
                html.Div(
                    [
                        html.H1("WayVia Insights"),
                        html.P(
                            "Morocco's company and opportunity "
                            "market intelligence dashboard"
                        )
                    ]
                ),

                html.Div(
                    [
                        html.Label("City"),
                        dcc.Dropdown(
                            id="city-filter",
                            options=[
                                {
                                    "label": "All cities",
                                    "value": "All cities"
                                }
                            ],
                            value="All cities",
                            clearable=False
                        )
                    ],
                    className="filter-box"
                ),

                html.Div(
                    [
                        html.Label("Domain"),
                        dcc.Dropdown(
                            id="domain-filter",
                            options=[
                                {
                                    "label": "All domains",
                                    "value": "All domains"
                                }
                            ],
                            value="All domains",
                            clearable=False
                        )
                    ],
                    className="filter-box"
                )
            ],
            className="dashboard-header"
        ),

        # KPI CARDS
        html.Div(
            [
                metric_card("COMPANIES", "total-companies"),
                metric_card("OPPORTUNITIES", "total-opportunities"),
                metric_card("CITIES", "total-cities"),
                metric_card(
                    "STUDENT-FRIENDLY OFFERS",
                    "student-opportunities"
                )
            ],
            className="metrics-grid"
        ),

        # CHARTS
        html.Div(
            [
                chart_card(
                    "Companies by City",
                    "city-chart"
                ),
                chart_card(
                    "Company Domain Distribution",
                    "domain-chart"
                ),
                chart_card(
                    "Opportunities by Type",
                    "opportunity-chart"
                ),
                chart_card(
                    "Opportunities by Domain",
                    "opportunity-domain-chart"
                ),
                chart_card(
                    "Student-Friendly Opportunities",
                    "student-friendly-chart"
                ),
                chart_card(
                    "Opportunities by Experience Level",
                    "experience-chart"
                ),
                chart_card(
                    "Opportunities by Employment Type",
                    "employment-type-chart"
                )
            ],
            className="charts-grid"
        ),

        # FOOTER
        html.P(
            "Data is refreshed from WayVia JSON files every five minutes.",
            className="dashboard-footer"
        )
    ],
    className="dashboard-container"
)        
# =========================================================
# CALLBACKS
# =========================================================

@app.callback(
    Output("city-filter", "options"),
    Output("domain-filter", "options"),
    Input("refresh-data", "n_intervals")
)
def update_filters(_):
    data = load_all_data()

    cities = sorted({
        get_city(company)
        for company in data["companies"]
        if get_city(company) != "Unknown"
    })

    domains = get_domain_options(
        data["companies"],
        data["opportunities"]
    )

    city_options = [
        {"label": "All cities", "value": "All cities"}
    ] + [
        {"label": city, "value": city}
        for city in cities
    ]

    domain_options = [
        {"label": "All domains", "value": "All domains"}
    ] + [
        {"label": domain.title(), "value": domain}
        for domain in domains
    ]

    return city_options, domain_options


@app.callback(
    Output("total-companies", "children"),
    Output("total-opportunities", "children"),
    Output("total-cities", "children"),
    Output("student-opportunities", "children"),

    Output("city-chart", "figure"),
    Output("domain-chart", "figure"),
    Output("opportunity-chart", "figure"),

    Output("opportunity-domain-chart", "figure"),
    Output("student-friendly-chart", "figure"),
    Output("experience-chart", "figure"),
    Output("employment-type-chart", "figure"),

    Input("city-filter", "value"),
    Input("domain-filter", "value"),
    Input("refresh-data", "n_intervals")
)
def update_dashboard(city, domain, _):

    data = load_all_data()

    companies = filter_companies(
        data["companies"],
        city,
        domain
    )

    opportunities = filter_opportunities(
        data["opportunities"],
        city,
        domain
    )

    cities_count = len({
        get_city(company)
        for company in companies
        if get_city(company) != "Unknown"
    })

    student_count = sum(
        1
        for opportunity in opportunities
        if opportunity.get("is_student_friendly") is True
    )

    return (
        f"{len(companies):,}",
        f"{len(opportunities):,}",
        f"{cities_count:,}",
        f"{student_count:,}",

        make_city_chart(companies),
        make_domain_chart(companies),
        make_opportunity_chart(opportunities),

        make_opportunity_domain_chart(opportunities),
        make_student_friendly_chart(opportunities),
        make_experience_chart(opportunities),
        make_employment_type_chart(opportunities)
    )
def update_dashboard(city, domain, _):
    data = load_all_data()

    companies = filter_companies(
        data["companies"],
        city,
        domain
    )

    opportunities = filter_opportunities(
        data["opportunities"],
        city,
        domain
    )

    cities_count = len({
        get_city(company)
        for company in companies
        if get_city(company) != "Unknown"
    })

    student_count = sum(
        1 for opportunity in opportunities
        if opportunity.get("is_student_friendly") is True
    )

    return (
        f"{len(companies):,}",
        f"{len(opportunities):,}",
        f"{cities_count:,}",
        f"{student_count:,}",
        make_city_chart(companies),
        make_domain_chart(companies),
        make_opportunity_chart(opportunities)
    )


# =========================================================
# RUN
# =========================================================

if __name__ == '__main__':
    from flask import Flask
    standalone_server = Flask(__name__)
    app.init_app(standalone_server)
    standalone_server.run(debug=True)
