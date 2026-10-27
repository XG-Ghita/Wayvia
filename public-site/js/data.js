/* =========================================================
   WAYVIA — SHARED COMPANY DATA
   Normalizes the generated JSON for all frontend pages.
   ========================================================= */

let companies = [];
let companiesLoadPromise = null;

function normalizeCompany(record) {
    const rawDomains = Array.isArray(record.domains) ? record.domains : (Array.isArray(record.domain) ? record.domain : []);
    const sectorEvidence = Array.isArray(record.enrichment?.sectorEvidence) ? record.enrichment.sectorEvidence : [];
    const domains = [...new Set([...rawDomains, ...sectorEvidence].filter(Boolean).map(String))];
    const technologyEvidence = Array.isArray(record.enrichment?.technologyEvidence) ? record.enrichment.technologyEvidence : [];
    const technologies = [...new Set([...(Array.isArray(record.technologies) ? record.technologies : []), ...technologyEvidence].filter(Boolean).map(String))];

    const opportunities = Array.isArray(record.opportunities)
        ? record.opportunities.filter(Boolean)
        : [];

    const emailValue = Array.isArray(record.email)
        ? record.email.filter(Boolean).join(', ')
        : (record.email || '');

    return {
        ...record,
        id: String(record.id || record.place_id || ''),
        name: record.name || 'Unnamed company',
        initial: record.initial || (record.name ? record.name.charAt(0).toUpperCase() : '?'),
        city: record.city || '',
        primaryType: typeof record.primaryType === 'string' ? record.primaryType : '',
        locationCoordinates: record.locationCoordinates || null,
        address: record.address || record.location || '',
        // Search/list pages should display the city, not the full street address.
        location: record.city || record.location || record.address || 'Location unavailable',
        domains,
        // results.js historically expects `domain`; search.js/company.js use `domains`.
        domain: domains,
        technologies,
        opportunities,
        rating: Number.isFinite(Number(record.rating)) ? Number(record.rating) : null,
        reviews: Number.isFinite(Number(record.reviews)) ? Number(record.reviews) : 0,
        match: Number.isFinite(Number(record.match)) ? Number(record.match) : 0,
        phone: record.phone || '',
        website: record.website || record.enrichment?.websiteUrl || '',
        email: emailValue,
        description: record.description || record.enrichment?.homepageDescription || 'No company description available.',
        mapsUrl: record.mapsUrl || '',
        verified: Boolean(record.verified),
        logoStyle: record.logoStyle || ''
    };
}

async function loadCompanies() {
    if (companiesLoadPromise) return companiesLoadPromise;

    companiesLoadPromise = (async () => {
        try {
            const response = await fetch('../data/wayvia_companies.json');
            if (!response.ok) {
                throw new Error(`Failed to load company data: ${response.status}`);
            }

            const records = await response.json();
            if (!Array.isArray(records)) {
                throw new Error('Company data must be a JSON array.');
            }

            companies = records.map(normalizeCompany).filter(company => company.id && company.name);
            console.info(`WayVia data loaded: ${companies.length} companies`);
            return companies;
        } catch (error) {
            console.error('Error loading WayVia company data:', error);
            companies = [];
            companiesLoadPromise = null;
            throw error;
        }
    })();

    return companiesLoadPromise;
}
