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

  // Strip web search narration before passing context forward
  function cleanContext(text) {
    if (!text) return '';
    return text
      .split('\n')
      .filter(line => {
        const l = line.toLowerCase().trim();
        return !(
          l.startsWith("i'll") ||
          l.startsWith("let me") ||
          l.startsWith("now let me") ||
          l.startsWith("i will") ||
          l.startsWith("first,") ||
          l.startsWith("next,") ||
          l.startsWith("searching") ||
          l.startsWith("looking") ||
          l === ''
        );
      })
      .join('\n')
      .trim();
  }

  // Tight summary for steps that need prior context — scored lines only
  function summarizeForContext(text) {
    const clean = cleanContext(text);
    const lines = clean.split('\n').filter(l =>
      l.includes('###') ||
      l.includes('Overall Score') ||
      l.match(/^\s*[-•]/) ||
      l.match(/\d+\/\d+/)
    );
    return lines.slice(0, 30).join('\n');
  }

  const prompts = {

    // ── STEP 1: Scored categories ──
    1: `Research ${company}${industryStr}. Run a maximum of 3 web searches total. Return ONLY this exact structure:

### Gartner / Analyst Recognition — [X]/25
[2 sentences: what analyst recognition exists and recency. Score 0-11 if none found.]

### Financial Health & Growth — [X]/30
[2 sentences: funding stage, valuation, ARR if known, headcount direction. Flag layoffs if found.]

### Customer & Product Sentiment — [X]/25
[2 sentences: G2 or Gartner Peer Insights star rating, review count, key themes.]

### Community & Employee Sentiment — [X]/20
[2 sentences: Glassdoor rating and recommend %, RepVue score if available, sales org notes.]

### Overall Score: [sum] / 100 — [Strong Buy / Promising / Proceed with Caution / High Risk]

Numbers only where verified. Score conservatively if data is missing. No preamble.`,

    // ── STEP 2: Context layers ──
    2: `Research ${company}${industryStr}. Run a maximum of 2 web searches. Use this prior research as context:
${summarizeForContext(context)}

Return ONLY this exact structure:

### Recent Press Tenor
[🟢 Positive / 🟡 Mixed / 🔴 Negative] — [One sentence on last 90 days.]

### Key Signals for a ${roleStr}
| Signal | Reading |
|---|---|
| [signal] | [✅ / ⚠️ / 🔴 reading] |
| [signal] | [reading] |
| [signal] | [reading] |
| [signal] | [reading] |
| [signal] | [reading] |

### Competitive Position
[2 short paragraphs on closest competitors and encroachment risk.]

No preamble. Role-specific signals only.`,

    // ── STEP 3: Channel presence ──
    3: `Research the channel presence for ${company}. Run a maximum of 4 web searches.

Step 1: Find ${company}'s partner or reseller page and list named VARs.
Step 2: For each found, plus any unchecked from: CDW (cdw.com), SHI (shi.com), Insight (insight.com), Connection (connection.com), Softchoice (softchoice.com), WWT (wwt.com), Optiv (optiv.com), GuidePoint (guidepointsecurity.com), Presidio (presidio.com), Trace3 (trace3.com) — search "[company name] site:[domain]".

Return ONLY this exact structure:

### Channel Presence Snapshot
| Reseller | Type | On Vendor Site | On Reseller Site |
|---|---|---|---|
| [name] | [Broad-line / Security-specialist] | [✅ Listed / ⚪ Not listed] | [✅ Active / ⚪ Not surfacing] |

[One sentence on what the channel footprint signals.]

No preamble.`,

    // ── STEP 4: Interview questions ──
    4: `You are helping a ${roleStr} candidate prepare for an interview at ${company}${industryStr}.

Summary of research findings:
${summarizeForContext(context)}

Return ONLY this exact structure:

### Interview Questions

**Questions to Ask Them:**
1. [Specific question grounded in a finding from the research above]
(Note: [what intel this surfaces — one sentence])
2. [Question]
(Note: [note])
3. [Question]
(Note: [note])
4. [Question]
(Note: [note])
5. [Question]
(Note: [note])

**Questions to Prepare For:**
1. [Likely question the interviewer will ask based on role and company stage]
(Note: [what they are really assessing — one sentence])
2. [Question]
(Note: [note])
3. [Question]
(Note: [note])
4. [Question]
(Note: [note])
5. [Question]
(Note: [note])

No preamble. Make every question specific to ${company} and the ${roleStr} role.`
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
        max_tokens: 800,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a concise market intelligence analyst. Search the web only as many times as instructed — no more. Return only the requested structure with no preamble, no commentary, and no narration like "let me search" or "now I will". Never fabricate data. Score conservatively if data is missing.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();

    // Take the LAST text block — final report, not search narration
    const textBlocks = data.content.filter(b => b.type === 'text');
    const text = textBlocks.length > 0
      ? textBlocks[textBlocks.length - 1].text
      : '';

    return res.status(200).json({ result: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
