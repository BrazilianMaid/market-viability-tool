import { buildPrompt, getTemplate } from './role-templates.js';

function logLine(fields) {
  try {
    console.log('[MVT_LOG] ' + JSON.stringify({ timestamp: new Date().toISOString(), ...fields }));
  } catch (_) {
    console.log('[MVT_LOG] {"timestamp":"' + new Date().toISOString() + '","status":"log_serialize_failed"}');
  }
}

export default async function handler(req, res) {
  const t0 = Date.now();

  if (req.method !== 'POST') {
    logLine({ status: 405 });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, roleCategory = 'general', jobTitle, industry } = req.body || {};

  if (!company) {
    logLine({ status: 400 });
    return res.status(400).json({ error: 'Company name is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logLine({ status: 500 });
    return res.status(500).json({ error: 'API key not configured' });
  }

  const template = getTemplate(roleCategory);
  const prompt = buildPrompt(roleCategory, { company, industry, jobTitle });
  const companyShort = String(company).slice(0, 40);

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
        max_tokens: 8192,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        system: `${template.systemPersona} You have a strict budget of 3 web searches for this entire analysis. Use one focused search per major topic area — do not run multiple searches for the same section or source. Prioritize breadth over depth: one good search per category is better than three searches on one category and none on another.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      logLine({ role: roleCategory, company: companyShort, latency_ms: Date.now() - t0, status: response.status });
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const textContent = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const usage = data.usage || {};
    let searchCount = 0;
    if (usage.server_tool_use && typeof usage.server_tool_use.web_search_requests === 'number') {
      searchCount = usage.server_tool_use.web_search_requests;
    } else if (Array.isArray(data.content)) {
      searchCount = data.content.filter(b => b.type === 'tool_use' && b.name === 'web_search').length;
    }

    logLine({
      role: roleCategory,
      company: companyShort,
      tokens_in: usage.input_tokens,
      tokens_out: usage.output_tokens,
      search_count: searchCount,
      latency_ms: Date.now() - t0,
      status: 200
    });

    return res.status(200).json({ result: textContent, roleLabel: template.label });

  } catch (err) {
    logLine({ role: roleCategory, company: companyShort, latency_ms: Date.now() - t0, status: 500 });
    return res.status(500).json({ error: err.message });
  }
}
