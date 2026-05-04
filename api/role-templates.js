// Role-aware prompt template registry for Market Viability Score.
//
// Each role defines:
//   - weights:           point distribution across the 4 scored sections (sums to 100)
//   - sectionLabels:     section titles. MUST contain the keywords the frontend
//                        renderer (renderMarkdownToHTML / getSectionIcon) keys off:
//                        "analyst", "financial", "customer"/"product", "employee"/"culture".
//   - sectionGuidance:   what Claude should research for each scored section
//   - signalsGuidance:   what to surface in the role-specific signals table
//   - channelGuidance:   how to interpret "channel presence" for this role
//                        (use {{COMPANY}} as placeholder for the company name)
//   - competitiveLens:   the angle the competitive narrative should take
//   - interviewAsk:      what role-relevant intel the candidate should probe for
//   - interviewPrep:     what the interviewer is likely to assess for this role
//   - systemPersona:     persona for the API system prompt
//   - loadingSteps:      6 short status lines surfaced in the frontend during research

const sales = {
  id: 'sales',
  label: 'Sales / Channel',
  tagline: 'Reseller ecosystem, channel motion, sales org reputation',
  weights: { analyst: 25, financial: 30, product: 25, culture: 20 },
  sectionLabels: {
    analyst: 'Gartner / Analyst Recognition',
    financial: 'Financial Health & Growth',
    product: 'Customer & Product Sentiment',
    culture: 'Sales Org & Employee Culture',
  },
  sectionGuidance: {
    analyst: 'Gartner Magic Quadrant, Forrester Wave, IDC MarketScape, Cool Vendor mentions. Note position (Leader / Challenger / Visionary / Niche) and recency. Score conservatively if data is sparse.',
    financial: 'Funding rounds, valuation, ARR / revenue, layoff history, investor quality, headcount trajectory, recent exec departures. Flag any distress signals that put quota attainment at risk.',
    product: 'G2 rating and review themes, Gartner Peer Insights rating and review count, TrustRadius if relevant. Common praise and criticism with a sales lens — does the product earn referrals or fight churn?',
    culture: 'Glassdoor overall rating and % recommend CEO, Blind discussions, RepVue score and quota attainment %, OTE realism, ramp time chatter, sales leadership tenure. Flag recurring concerns specific to the sales org.',
  },
  signalsGuidance: 'Surface signals most relevant to a quota-carrying or channel hire: channel program health, partner-led pipeline %, sales leadership tenure, OTE / quota realism, CRO or VP Sales departures, deal velocity chatter, ramp time. 5-6 rows.',
  channelGuidance: `Run 2-3 broad searches to map the channel footprint — for example "{{COMPANY}} channel partners", "{{COMPANY}} reseller program", and "{{COMPANY}} partner ecosystem". Use the results to identify named VARs and resellers. As reference points for what to look for, common tech-sales resellers include CDW, SHI, Insight, Connection, Softchoice, WWT, Optiv, GuidePoint, Presidio, and Trace3 — but do not run individual site: searches against each one.

Present as a table: Reseller | Type | On Vendor Site | On Reseller Site
Follow with one sentence on what the channel footprint signals for a sales / channel hire (mature program vs. early-stage, direct-led vs. partner-led).`,
  competitiveLens: '2-3 paragraph narrative on closest competitors and encroachment risk, with explicit emphasis on competitive win/loss patterns, displacement deals, and where reps are likely to lose head-to-head.',
  interviewAsk: 'channel gaps, sales-org culture flags, competitive risks, financial signals, quota attainment realism, ramp expectations, and sales leadership stability',
  interviewPrep: 'sales methodology fit (MEDDIC, Command of the Message, etc.), channel motion experience, deal-cycle storytelling, territory ownership, partner enablement, and revenue attainment narrative',
  systemPersona: 'You are a market intelligence analyst helping tech sales and channel professionals evaluate companies before applying. You produce structured, data-driven research reports focused on go-to-market motion, channel ecosystem, sales-org health, and quota-attainment signals. Always search the web thoroughly across all categories before writing the report. Be specific, cite actual numbers and ratings where found, and never fabricate scores or data. If data is unavailable for a category, say so explicitly and score conservatively.',
  loadingSteps: [
    'Searching Gartner, Forrester, and analyst sources',
    'Pulling funding, valuation, and headcount data',
    'Reading G2 and Gartner Peer Insights reviews',
    'Scanning Glassdoor, Blind, and RepVue for sales-org signals',
    'Mapping channel partners and reseller ecosystem',
    'Compiling report and generating interview questions',
  ],
};

const engineering = {
  id: 'engineering',
  label: 'Engineering',
  tagline: 'Tech stack, dev reputation, engineering culture, build-vs-buy',
  weights: { analyst: 20, financial: 25, product: 25, culture: 30 },
  sectionLabels: {
    analyst: 'Technical Analyst & Developer Reputation',
    financial: 'Financial Health & Engineering Investment',
    product: 'Product Quality & Developer Sentiment',
    culture: 'Engineering Culture & Employee Reviews',
  },
  sectionGuidance: {
    analyst: 'RedMonk programming-language rankings if relevant, Gartner / Forrester technical reports, ThoughtWorks Technology Radar mentions, conference presence (KubeCon, re:Invent, QCon), engineering-blog credibility, notable open-source projects, GitHub org activity (stars, contributor count, recent commits).',
    financial: 'Funding, ARR / revenue, layoff history (especially eng-team layoffs), investor quality, headcount trajectory with eng-specific breakdown if possible, R&D as % of spend, hiring posture for engineering roles. Flag distress signals that affect engineering-org stability or comp packages.',
    product: 'Product reviews on G2 and TrustRadius with a quality / reliability lens, Stack Overflow chatter, Hacker News reception of launches, postmortem transparency, status page / incident history, API and SDK reputation among devs.',
    culture: 'Glassdoor overall rating and engineering-specific reviews, Blind discussions filtered to eng topics (work-life balance, on-call load, code review culture, deploy frequency, tech debt complaints), team:blind sentiment, eng-leadership tenure (CTO / VPE), notable engineer departures, build-vs-buy posture, remote / RTO policy.',
  },
  signalsGuidance: 'Surface signals most relevant to an engineering hire: GitHub activity trajectory, eng blog cadence and quality, public eng leadership voice, on-call burden chatter, deploy frequency and CI maturity hints, tech debt complaints, recent eng leadership turnover, comp competitiveness vs. tier. 5-6 rows.',
  channelGuidance: `Map the technical ecosystem rather than reseller channel. Run 2-3 searches such as "{{COMPANY}} integrations", "{{COMPANY}} open source", and "{{COMPANY}} technology partners". Identify cloud and infrastructure partnerships (AWS / GCP / Azure tier and badges), notable integrations, SDK / API ecosystem, and meaningful open-source contributions or sponsored projects.

Present as a table: Partner / Project | Type | Depth of Integration | Public Signal
Follow with one sentence on what the technical ecosystem signals for an engineering hire (insular vs. ecosystem-friendly, build-everything culture vs. integration-mature).`,
  competitiveLens: '2-3 paragraph narrative on closest competitors with emphasis on technical differentiation, architectural choices, and where the engineering bet is being placed (e.g. ML infra, scale, latency, developer ergonomics). Note where competitors are out-shipping or out-hiring.',
  interviewAsk: 'engineering culture concerns from reviews, on-call expectations, tech debt vs. greenfield mix, deploy and code-review practices, build-vs-buy philosophy, eng leadership stability, and technical bets driving the roadmap',
  interviewPrep: 'system-design and coding rigor expected at this company tier, language / framework alignment to their stack, on-call comfort, ownership-model fit, past project deep-dives, and how to talk about tech debt and tradeoffs',
  systemPersona: 'You are a market intelligence analyst helping software engineers evaluate companies before applying. You produce structured, data-driven research reports focused on technical reputation, engineering culture, code and infrastructure quality signals, and build-vs-buy posture. Always search the web thoroughly. Be specific, cite ratings and numbers where found, and never fabricate. If data is unavailable, say so explicitly and score conservatively.',
  loadingSteps: [
    'Scanning eng blog, conference talks, and analyst coverage',
    'Pulling funding, layoffs, and R&D headcount trajectory',
    'Reading developer reviews on G2, Stack Overflow, Hacker News',
    'Filtering Glassdoor and Blind for engineering-specific signals',
    'Mapping GitHub activity, integrations, and tech partnerships',
    'Compiling report and generating interview questions',
  ],
};

const marketing = {
  id: 'marketing',
  label: 'Marketing',
  tagline: 'Brand presence, campaign sophistication, content quality, market positioning',
  weights: { analyst: 25, financial: 25, product: 25, culture: 25 },
  sectionLabels: {
    analyst: 'Brand Recognition & Analyst Coverage',
    financial: 'Financial Health & Marketing Investment',
    product: 'Brand Sentiment & Customer Perception',
    culture: 'Marketing Org & Employee Culture',
  },
  sectionGuidance: {
    analyst: 'Analyst recognition with a positioning lens (Gartner MQ axis movement, Forrester Wave commentary on vision vs. execution), category creation or category-leader status, share-of-voice in the category, notable awards, and visible thought-leadership platforms.',
    financial: 'Funding, ARR / revenue, marketing spend signals if disclosed, ad-spend posture, layoff history (especially marketing-team layoffs), investor quality, headcount trajectory. Flag distress signals that affect marketing budget stability.',
    product: 'Brand sentiment beyond product features — Net Promoter Score if public, social listening signal, customer-story production cadence, review-site narrative quality, share-of-voice vs. competitors, and how the brand reads in earned media.',
    culture: 'Glassdoor overall rating and marketing-specific reviews, CMO tenure and history of CMO turnover, marketing leadership stability, agency-vs-in-house posture, marketing team headcount trajectory. Flag concerns about marketing-org churn or budget cuts.',
  },
  signalsGuidance: 'Surface signals most relevant to a marketing hire: CMO tenure, recent marketing leadership departures, content cadence and quality, paid vs. organic mix hints, brand campaign visibility, martech stack hints, agency relationships, and social presence vs. competitors. 5-6 rows.',
  channelGuidance: `Map the marketing-relevant ecosystem rather than reseller channel. Run 2-3 searches such as "{{COMPANY}} agency of record", "{{COMPANY}} martech stack", and "{{COMPANY}} marketing partners". Identify named agency partnerships, martech vendors visible in their stack (e.g. HubSpot, Marketo, 6sense, Demandbase, Mutiny), event sponsorships, and co-marketing alliances.

Present as a table: Partner | Type | Relationship Depth | Public Signal
Follow with one sentence on what the marketing ecosystem signals for a marketing hire (sophistication of demand-gen motion, in-house vs. agency-led, brand-led vs. demand-led).`,
  competitiveLens: '2-3 paragraph narrative on competitive positioning — category narrative ownership, share-of-voice, and where the brand is winning or losing the messaging war. Note category creation attempts or repositioning moves.',
  interviewAsk: 'CMO tenure and recent leadership churn, content / campaign performance metrics, martech stack maturity, brand vs. demand-gen balance, agency relationships, marketing-budget posture, and how marketing is measured against revenue',
  interviewPrep: 'campaign storytelling with metrics, brand vs. demand experience, martech fluency, content / SEO / paid mix, sales-marketing alignment, ABM execution, and a POV on the company\'s current positioning',
  systemPersona: 'You are a market intelligence analyst helping marketing professionals evaluate companies before applying. You produce structured, data-driven research reports focused on brand presence, category positioning, marketing-org maturity, and the sophistication of the company\'s demand-generation and content motion. Always search the web thoroughly. Be specific, cite ratings and numbers where found, and never fabricate. If data is unavailable, say so explicitly and score conservatively.',
  loadingSteps: [
    'Reading analyst coverage and category-positioning signals',
    'Pulling funding, marketing spend, and headcount data',
    'Assessing brand sentiment and customer story quality',
    'Filtering Glassdoor and Blind for marketing-org signals',
    'Mapping agency partnerships and martech stack',
    'Compiling report and generating interview questions',
  ],
};

const finance = {
  id: 'finance',
  label: 'Finance / Operations',
  tagline: 'Financial depth, operational maturity, audit history, leadership stability',
  weights: { analyst: 15, financial: 40, product: 20, culture: 25 },
  sectionLabels: {
    analyst: 'Industry Recognition & Analyst Coverage',
    financial: 'Financial Health, Audit & Operational Maturity',
    product: 'Customer & Product Stability',
    culture: 'Leadership Stability & Employee Culture',
  },
  sectionGuidance: {
    analyst: 'External recognition that a finance / ops candidate would care about: industry analyst coverage, governance recognition, ESG ratings if public, regulatory standing in the relevant jurisdictions. Score conservatively if data is sparse.',
    financial: 'Deep financial picture: funding history, valuation trajectory, ARR / revenue if disclosed, gross margin if hinted, burn / runway signals, audit firm, restated financials or going-concern flags, S-1 / 10-K signals if public, debt structure, layoffs, and any SEC / regulatory actions. This is the most heavily weighted section — be exhaustive.',
    product: 'Product and customer stability through a finance-ops lens: customer concentration risk if knowable, churn chatter, large customer wins or losses, contract length signals, and product reliability issues that could create revenue risk.',
    culture: 'CFO and COO tenure and history of turnover, controller / VP Finance departures, board composition and audit committee signals, Glassdoor reviews filtered to G&A functions, internal controls or compliance complaints, and overall leadership stability.',
  },
  signalsGuidance: 'Surface signals most relevant to a finance / ops hire: CFO tenure, audit firm and audit history, restatements or material weaknesses, regulatory actions, runway / burn posture, finance-team headcount trajectory, and quality of disclosed metrics. 5-6 rows.',
  channelGuidance: `Map operational and compliance ecosystem rather than reseller channel. Run 2-3 searches such as "{{COMPANY}} audit firm", "{{COMPANY}} ERP system", and "{{COMPANY}} compliance certifications" (SOC 2, ISO 27001, PCI, etc.). Identify auditor relationships, ERP and back-office vendors visible from job posts or press, and compliance posture.

Present as a table: Vendor / Certification | Type | Maturity Signal | Public Source
Follow with one sentence on what the operational ecosystem signals for a finance / ops hire (mature back-office vs. early scaffolding, audit-ready vs. controls-light).`,
  competitiveLens: '2-3 paragraph narrative on competitive position with a finance lens — relative scale, capital efficiency vs. peers, valuation multiples in the category, and consolidation / M&A risk that could affect role longevity.',
  interviewAsk: 'audit history and restatements, runway and burn posture, finance-team scope and tooling, recent finance-leadership departures, regulatory exposure, board engagement on financials, and what the next-12-months financial plan looks like',
  interviewPrep: 'financial-modeling fluency, FP&A vs. accounting depth, systems experience (NetSuite, Workday, etc.), audit and SOX exposure if relevant, board-deck preparation, and a POV on the company\'s financial story',
  systemPersona: 'You are a market intelligence analyst helping finance and operations professionals evaluate companies before applying. You produce structured, data-driven research reports focused on financial health depth, audit and controls maturity, regulatory posture, and leadership stability. Financial-health analysis should be the most thorough section. Always search the web thoroughly. Be specific, cite numbers where found, and never fabricate. If data is unavailable, say so explicitly and score conservatively.',
  loadingSteps: [
    'Scanning industry recognition and governance coverage',
    'Pulling funding, audit history, and regulatory filings',
    'Assessing customer concentration and revenue stability',
    'Filtering Glassdoor and Blind for G&A leadership signals',
    'Mapping auditor, ERP, and compliance ecosystem',
    'Compiling report and generating interview questions',
  ],
};

const product = {
  id: 'product',
  label: 'Product',
  tagline: 'Product reviews, PLG signals, PM culture, roadmap transparency',
  weights: { analyst: 20, financial: 25, product: 35, culture: 20 },
  sectionLabels: {
    analyst: 'Industry & Analyst Recognition',
    financial: 'Financial Health & Growth',
    product: 'Product Reviews & User Sentiment',
    culture: 'Product Org Culture & Employee Reviews',
  },
  sectionGuidance: {
    analyst: 'Analyst coverage with a product lens (Gartner / Forrester / IDC product positioning), Cool Vendor / Innovator mentions, conference presence, and credibility of the public product narrative.',
    financial: 'Funding, ARR / revenue, growth rate, layoff history (especially product / design layoffs), investor quality, headcount trajectory, and any signals that PM or design teams are being squeezed.',
    product: 'This is the most heavily weighted section — be thorough. G2, Capterra, TrustRadius, Product Hunt reception, Gartner Peer Insights, App Store / Play Store ratings if applicable, NPS if public, churn and expansion chatter, and product-led-growth signals (free tier, self-serve onboarding, time-to-value reports). Pull out praise and complaint themes.',
    culture: 'CPO tenure and recent product-leadership departures, Glassdoor reviews filtered to PM / design / research, Blind chatter on PM-vs-engineering dynamic, roadmap transparency (public roadmap, changelog cadence), user-community engagement (Discord / Slack / forum), and how PMs are positioned vs. eng (sales-driven vs. PM-driven culture).',
  },
  signalsGuidance: 'Surface signals most relevant to a PM hire: product-review trajectory, PLG vs. sales-led motion signals, public roadmap or changelog cadence, user community size and engagement, CPO tenure, recent PM departures, and design / research investment signals. 5-6 rows.',
  channelGuidance: `Map the product distribution and integration ecosystem rather than reseller channel. Run 2-3 searches such as "{{COMPANY}} integrations marketplace", "{{COMPANY}} app store", and "{{COMPANY}} developer community". Identify integration breadth, marketplace presence, third-party-built extensions, and user-community footprint.

Present as a table: Channel / Integration | Type | Depth | Public Signal
Follow with one sentence on what the product distribution ecosystem signals for a PM hire (point product vs. platform, ecosystem-led vs. closed, mature integration story vs. early).`,
  competitiveLens: '2-3 paragraph narrative on closest competitors with a product lens — feature parity gaps, where this product wins or loses on UX, and where competitors are out-shipping. Note any disruptive entrants reshaping the category.',
  interviewAsk: 'roadmap transparency and how decisions get made, PM-vs-engineering dynamic, design and research investment, recent CPO or PM-leadership churn, customer-research practices, and how product success is measured',
  interviewPrep: 'product-sense storytelling, prioritization frameworks, metric / experimentation fluency, cross-functional collaboration with eng and design, recent product wins with measurable outcomes, and a POV on the company\'s product strategy',
  systemPersona: 'You are a market intelligence analyst helping product managers evaluate companies before applying. You produce structured, data-driven research reports focused on product quality and user sentiment, product-led-growth signals, PM-org culture, and roadmap and community transparency. Product reviews and user sentiment should be the most thorough section. Always search the web thoroughly. Be specific, cite ratings and numbers where found, and never fabricate. If data is unavailable, say so explicitly and score conservatively.',
  loadingSteps: [
    'Scanning analyst coverage and product positioning',
    'Pulling funding, growth rate, and headcount trajectory',
    'Reading G2, Product Hunt, and app-store reviews in depth',
    'Filtering Glassdoor and Blind for PM-org signals',
    'Mapping integrations, marketplace, and user community',
    'Compiling report and generating interview questions',
  ],
};

const general = {
  id: 'general',
  label: 'General',
  tagline: 'Balanced view across all categories — good default for cross-functional roles',
  weights: { analyst: 25, financial: 30, product: 25, culture: 20 },
  sectionLabels: {
    analyst: 'Industry Recognition & Analyst Coverage',
    financial: 'Financial Health & Growth',
    product: 'Customer & Product Sentiment',
    culture: 'Community & Employee Sentiment',
  },
  sectionGuidance: {
    analyst: 'Gartner Magic Quadrant, Forrester Wave, IDC MarketScape, Cool Vendor and similar mentions across whichever frames are relevant to the company. Include recency. Score conservatively if data is sparse.',
    financial: 'Funding rounds, valuation, ARR / revenue, layoff history, investor quality, headcount trajectory. Flag any distress signals that materially affect company viability.',
    product: 'G2 rating and review themes, Gartner Peer Insights rating and review count, app-store ratings if applicable. Common praise and criticism that any cross-functional hire would care about.',
    culture: 'Glassdoor overall rating and % recommend CEO, Blind discussions, leadership-tenure signals, and recurring concerns across functions. Flag any culture red flags that would matter to any hire.',
  },
  signalsGuidance: 'Surface broadly relevant signals: leadership stability, growth trajectory, layoffs, customer momentum, culture themes, and competitive trajectory. Balanced across functions. 5-6 rows.',
  channelGuidance: `Map the company's go-to-market and ecosystem footprint broadly. Run 2-3 searches such as "{{COMPANY}} partners", "{{COMPANY}} integrations", and "{{COMPANY}} ecosystem". Identify the mix of reseller / technology / agency / community partnerships visible.

Present as a table: Partner / Channel | Type | Depth | Public Signal
Follow with one sentence on what the overall ecosystem signals about company maturity and go-to-market motion.`,
  competitiveLens: '2-3 paragraph narrative on closest competitors and overall competitive position. Cover differentiation, encroachment risk, and category trajectory.',
  interviewAsk: 'leadership stability, growth momentum vs. plan, recent organizational changes, culture flags surfaced in research, and how the company is investing across functions',
  interviewPrep: 'role-relevant fundamentals based on the specific job title provided, company-stage fit, why-this-company narrative, and a POV grounded in the public signals about the company',
  systemPersona: 'You are a market intelligence analyst helping job seekers evaluate companies before applying. You produce structured, data-driven research reports with a balanced view across analyst recognition, financial health, customer / product sentiment, and culture. Always search the web thoroughly. Be specific, cite ratings and numbers where found, and never fabricate. If data is unavailable, say so explicitly and score conservatively.',
  loadingSteps: [
    'Searching analyst, press, and industry recognition sources',
    'Pulling funding, valuation, and headcount data',
    'Reading G2, Gartner Peer Insights, and customer reviews',
    'Scanning Glassdoor, Blind, and culture signals',
    'Mapping partner and integration ecosystem',
    'Compiling report and generating interview questions',
  ],
};

export const ROLE_TEMPLATES = {
  sales,
  engineering,
  marketing,
  finance,
  product,
  general,
};

export function getTemplate(roleId) {
  return ROLE_TEMPLATES[roleId] || ROLE_TEMPLATES.general;
}

// Subset of metadata safe to send to the browser for rendering the role
// selector, framework card, and loading steps.
export function getPublicMetadata() {
  return Object.values(ROLE_TEMPLATES).map(t => ({
    id: t.id,
    label: t.label,
    tagline: t.tagline,
    weights: t.weights,
    sectionLabels: t.sectionLabels,
    loadingSteps: t.loadingSteps,
  }));
}

export function buildPrompt(roleId, { company, industry, jobTitle }) {
  const t = getTemplate(roleId);
  const w = t.weights;
  const labels = t.sectionLabels;
  const guidance = t.sectionGuidance;

  const industryStr = industry ? ` in the ${industry} industry` : '';
  const titleStr = jobTitle ? ` (specifically a ${jobTitle} role)` : '';
  const signalLabel = jobTitle || t.label;
  const channelBlock = t.channelGuidance.replace(/\{\{COMPANY\}\}/g, company);

  return `Run a full Market Viability Report for ${company}${industryStr}. The candidate is evaluating this company for a ${t.label} position${titleStr}.

Search the web thoroughly and return the report in this exact structure:

## ${company} — Market Viability Score

### Overall Score: [XX] / 100 — [Strong Buy / Promising / Proceed with Caution / High Risk]

---

### ${labels.analyst} — [XX]/${w.analyst}
${guidance.analyst}

### ${labels.financial} — [XX]/${w.financial}
${guidance.financial}

### ${labels.product} — [XX]/${w.product}
${guidance.product}

### ${labels.culture} — [XX]/${w.culture}
${guidance.culture}

---

### Recent Press Tenor
[🟢 Positive / 🟡 Mixed / 🔴 Negative] — [One sentence summary of last 90 days coverage, with attention to items relevant to a ${t.label} hire.]

---

### Key Signals for a ${signalLabel}
[Table with Signal | Reading columns. Use ✅ ⚠️ 🔴. ${t.signalsGuidance}]

---

### Competitive Position
${t.competitiveLens}

---

### Channel Presence Snapshot
${channelBlock}

---

### Interview Questions

**Questions to Ask Them:**
[5-6 specific questions grounded in findings from THIS report — focus on ${t.interviewAsk}. Each with a one-line note on what intel it's designed to surface. Format: Question text on one line, then (Note: ...) on the next.]

**Questions to Prepare For:**
[5-6 likely interview questions for a ${signalLabel} based on company stage and findings — focus on ${t.interviewPrep}. Each with a one-line coaching note on what the interviewer is really assessing. Format: Question text on one line, then (Note: ...) on the next.]

Keep responses grounded in what you actually found. If data was unavailable for a category, note it and score conservatively. Do not fabricate.`;
}
