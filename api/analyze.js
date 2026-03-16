export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, role, industry } = req.body;

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const roleStr = role || 'tech sales role';
  const industryStr = industry ? ` in the ${industry} industry` : '';

  const prompt = `Run a full Market Viability Report for ${company}${industryStr}. The candidate is evaluating this company for a ${roleStr} position.

Search the web thoroughly and return the report in this exact structure:

## ${company} — Market Viability Score

### Overall Score: [XX] / 100 — [Strong Buy / Promising / Proceed with Caution / High Risk]

---

### Gartner / Analyst Recognition — [XX]/25
[Summary of Gartner MQ, EMQ, Cool Vendor, Forrester Wave, or IDC mentions. Include recency. Score conservatively if data is sparse.]

### Financial Health & Growth — [XX]/30
[Funding rounds, valuation, ARR/revenue, layoff history, investor quality, headcount trajectory. Flag any distress signals.]

### Customer & Product Sentiment — [XX]/25
[G2 rating and review themes, Gartner Peer Insights rating and review count. Common praise and criticism.]

### Community & Employee Sentiment — [XX]/20
[Glassdoor overall rating and % recommend, Blind discussions, RepVue score. Note sales org specific signals if available. Flag recurring concerns.]

---

### Recent Press Tenor
[🟢 Positive / 🟡 Mixed / 🔴 Negative] — [One sentence summary of last 90 days coverage]

---

### Key Signals for a ${roleStr}
[Table with Signal | Reading columns. Use ✅ ⚠️ 🔴. Include 5-6 rows most relevant to this specific role.]

---

### Competitive Position
[2-3 paragraph narrative on closest competitors and encroachment risk.]

---

### Channel Presence Snapshot
First, fetch ${company}'s partner or resellers page to extract any named VARs or resellers they list. Then validate each named partner via site: searches. Also check against this fallback list: CDW (cdw.com), SHI (shi.com), Insight (insight.com), Connection (connection.com), Softchoice (softchoice.com), WWT (wwt.com), Optiv (optiv.com), GuidePoint (guidepointsecurity.com), Presidio (presidio.com), Trace3 (trace3.com).

Present as a table: Reseller | Type | On Vendor Site | On Reseller Site
Follow with one sentence on what the channel footprint signals.

---

### Interview Questions

**Questions to Ask Them:**
[5-6 specific questions grounded in findings from THIS report — channel gaps, culture flags, competitive risks, financial signals. Each with a one-line note on what intel it's designed to surface. Format: Question text on one line, then (Note: ...) on the next.]

**Questions to Prepare For:**
[5-6 likely interview questions based on the JD responsibilities and company stage. Each with a one-line coaching note on what the interviewer is really assessing. Format: Question text on one line, then (Note: ...) on the next.]

Keep responses grounded in what you actually found. If data was unavailable for a category, note it and score conservatively. Do not fabricate.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a market intelligence analyst helping tech sales professionals evaluate companies before applying. You produce structured, data-driven research reports. Always search the web thoroughly across all categories before writing the report. Be specific, cite actual numbers and ratings where found, and never fabricate scores or data. If data is unavailable for a category, say so explicitly and score conservatively.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const textContent = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return res.status(200).json({ result: textContent });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
