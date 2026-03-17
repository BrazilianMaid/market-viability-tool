export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, role, industry, step, context } = req.body;

  if (!company) return res.status(400).json({ error: 'Company name is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const roleStr = role || 'tech sales role';
  const industryStr = industry ? ` (${industry})` : '';

  const prompts = {

    // ── STEP 1: Scored categories ──
    1: `Research ${company}${industryStr} and return ONLY this structure, no preamble:

### Gartner / Analyst Recognition — [X]/25
Search for Gartner MQ, EMQ, Cool Vendor, Forrester Wave, IDC mentions. 2-3 sentences max. Score conservatively if sparse.

### Financial Health & Growth — [X]/30
Search for funding, valuation, ARR, layoffs, headcount. 2-3 sentences max. Flag distress signals.

### Customer & Product Sentiment — [X]/25
Search G2 and Gartner Peer Insights ratings and review themes. 2-3 sentences max.

### Community & Employee Sentiment — [X]/20
Search Glassdoor rating and recommend %, RepVue score, Blind. 2-3 sentences max. Note sales org signals.

### Overall Score: [sum] / 100 — [Strong Buy / Promising / Proceed with Caution / High Risk]

Be specific with numbers. Never fabricate. Score conservatively if data missing.`,

    // ── STEP 2: Context layers ──
    2: `Based on this research summary for ${company}:
${context}

Now search for additional context and return ONLY this structure:

### Recent Press Tenor
[🟢 Positive / 🟡 Mixed / 🔴 Negative] — One sentence on last 90 days coverage.

### Key Signals for a ${roleStr}
| Signal | Reading |
|---|---|
[5 rows using ✅ ⚠️ 🔴. Role-specific signals only.]

### Competitive Position
2 short paragraphs on closest competitors and encroachment risk.`,

    // ── STEP 3: Channel presence ──
    3: `Research the channel/reseller presence for ${company}.

Step 1: Fetch ${company}'s website and find their partners, resellers, or channel page. List every named VAR or reseller.

Step 2: For each reseller found, plus any from this list not already checked — CDW (cdw.com), SHI (shi.com), Insight (insight.com), Connection (connection.com), Softchoice (softchoice.com), WWT (wwt.com), Optiv (optiv.com), GuidePoint (guidepointsecurity.com), Presidio (presidio.com), Trace3 (trace3.com) — search "[company] site:[domain]" to check if they feature ${company}.

Return ONLY this structure:

### Channel Presence Snapshot
| Reseller | Type | On Vendor Site | On Reseller Site |
|---|---|---|---|
[One row per reseller checked. Type = Broad-line or Security-specialist.]

[One sentence summary of what the channel footprint signals.]`,

    // ── STEP 4: Interview questions ──
    4: `You are helping a ${roleStr} candidate prepare for an interview at ${company}.

Here is the research summary:
${context}

Return ONLY this structure:

### Interview Questions

**Questions to Ask Them:**
1. [Question grounded in a specific finding from the research]
(Note: [what intel this surfaces])
2. [Question]
(Note: [coaching note])
3. [Question]
(Note: [coaching note])
4. [Question]
(Note: [coaching note])
5. [Question]
(Note: [coaching note])

**Questions to Prepare For:**
1. [Likely interview question based on role and company stage]
(Note: [what the interviewer is really assessing])
2. [Question]
(Note: [coaching note])
3. [Question]
(Note: [coaching note])
4. [Question]
(Note: [coaching note])
5. [Question]
(Note: [coaching note])

Make questions specific to ${company} and the ${roleStr} role. No generic advice.`
  };

  const prompt = prompts[step];
  if (!prompt) return res.status(400).json({ error: `Invalid step: ${step}` });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a market intelligence analyst. Be concise and specific. Always search before answering. Never fabricate data. Return only the requested structure with no preamble or commentary.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return res.status(200).json({ result: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
