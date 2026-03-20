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

  // Strip narration lines from any text block
  function stripNarration(text) {
    if (!text) return '';
    return text
      .split('\n')
      .filter(line => {
        const l = line.toLowerCase().trim();
        return !(
          l.startsWith("i'll") ||
          l.startsWith("i will") ||
          l.startsWith("let me") ||
          l.startsWith("now let me") ||
          l.startsWith("now i") ||
          l.startsWith("now,") ||
          l.startsWith("first,") ||
          l.startsWith("next,") ||
          l.startsWith("searching") ||
          l.startsWith("looking") ||
          l.startsWith("based on my research") ||
          l.startsWith("based on the") ||
          l.startsWith("here is") ||
          l.startsWith("here's") ||
          l.startsWith("i have") ||
          l.startsWith("i've") ||
          l === ''
        );
      })
      .join('\n')
      .trim();
  }

  // Tight summary for steps that need prior context
  function summarizeForContext(text) {
    const clean = stripNarration(text);
    const lines = clean.split('\n').filter(l =>
      l.includes('###') ||
      l.includes('Overall Score') ||
      l.match(/^\s*[-•]/) ||
      l.match(/\d+\/\d+/)
    );
    return lines.slice(0, 25).join('\n');
  }

  const prompts = {

    // ── STEP 1: Scored categories — max 2 searches ──
    1: `Research ${company}${industryStr}. Run a maximum of 2 web searches total. Return ONLY this exact structure with NO preamble, NO opening sentence, NO narration:

### Gartner / Analyst Recognition — [X]/25
[2 sentences max: analyst recognition and recency. Score 0-11 if none found.]

### Financial Health & Growth — [X]/30
[2 sentences max: funding, valuation, ARR if known, headcount direction. Flag layoffs.]

### Customer & Product Sentiment — [X]/25
[2 sentences max: G2 or Gartner Peer Insights star rating, review count, key themes.]

### Community & Employee Sentiment — [X]/20
[2 sentences max: Glassdoor rating and recommend %, RepVue score if available.]

### Overall Score: [sum] / 100 — [Strong Buy / Promising / Proceed with Caution / High Risk]

Start your response with "### Gartner" — nothing before it. Numbers only where verified.`,

    // ── STEP 2: Context layers — max 1 search ──
    2: `Research ${company}${industryStr}. Run a maximum of 1 web search. Prior research:
${summarizeForContext(context)}

Return ONLY this exact structure with NO preamble:

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

Start your response with "### Recent Press Tenor" — nothing before it.`,

    // ── STEP 3: Channel presence — max 2 searches, vendor site only ──
    3: `Research the channel presence for ${company}. Run a maximum of 2 web searches.

Search 1: Find ${company}'s partners, resellers, or alliances page on their website. List every named partner, reseller, VAR, or distributor. Note their type where clear (broad-line reseller, security VAR, GSI, hyperscaler, technology alliance, distributor).

Search 2: Check if ${company} has a partner portal, partner program page, or partner login. Look for: deal registration, MDF/co-op funds, partner tiers, enablement/training, or a dedicated partner login.

Return ONLY this exact structure with NO preamble:

### Channel Presence Snapshot

**Partners & Resellers Listed on Vendor Site:**
| Partner | Type |
|---|---|
| [name] | [Broad-line / Security VAR / GSI / Hyperscaler / Technology Alliance / Distributor] |

**Partner Program:**
[🟢 Robust — describe what's available / 🟡 Basic — describe what exists / 🔴 Minimal or none found]

[One sentence on what the channel footprint signals for a partner manager joining this company.]

Start your response with "### Channel Presence Snapshot" — nothing before it.`,

    // ── STEP 4: Interview questions — NO web search ──
    4: `You are helping a ${roleStr} candidate prepare for an interview at ${company}${industryStr}.

Research summary:
${summarizeForContext(context)}

Return ONLY this exact structure with NO preamble:

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

Start your response with "### Interview Questions" — nothing before it.`
  };

  const prompt = prompts[step];
  if (!prompt) return res.status(400).json({ error: `Invalid step: ${step}` });

  // Step 1 needs more tokens — covers 4 categories at once
  const maxTokens = step === 1 ? 1200 : 800;

  // Step 4 doesn't need web search — saves tokens and cost
  const tools = step === 4
    ? []
    : [{ type: 'web_search_20250305', name: 'web_search' }];

  try {
    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: 'You are a concise market intelligence analyst. Search only as many times as instructed — no more. Your response must begin immediately with the first ### heading — no opening sentence, no preamble, no narration of any kind. Never fabricate data. Score conservatively if data is missing.',
      messages: [{ role: 'user', content: prompt }]
    };

    // Only include tools if needed
    if (tools.length > 0) body.tools = tools;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();

    // Take the LAST text block, then strip any remaining narration
    const textBlocks = data.content.filter(b => b.type === 'text');
    const raw = textBlocks.length > 0
      ? textBlocks[textBlocks.length - 1].text
      : '';

    const text = stripNarration(raw);

    return res.status(200).json({ result: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
