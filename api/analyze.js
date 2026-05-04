import { buildPrompt, getTemplate, getPublicMetadata } from './role-templates.js';

export default async function handler(req, res) {
  // Lightweight metadata endpoint so the frontend can render the role
  // selector, framework card, and loading steps without duplicating config.
  if (req.method === 'GET') {
    return res.status(200).json({ roles: getPublicMetadata() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, industry, roleCategory, jobTitle, role } = req.body || {};

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Resolve role: prefer explicit roleCategory, fall back to legacy `role`
  // free-text (treated as job title under the General template) so older
  // clients keep working.
  const resolvedRoleId = roleCategory && getTemplate(roleCategory).id === roleCategory
    ? roleCategory
    : 'general';
  const resolvedJobTitle = (jobTitle || role || '').trim();

  const template = getTemplate(resolvedRoleId);
  const prompt = buildPrompt(resolvedRoleId, {
    company,
    industry,
    jobTitle: resolvedJobTitle,
  });

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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: template.systemPersona,
        messages: [{ role: 'user', content: prompt }],
      }),
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

    return res.status(200).json({
      result: textContent,
      roleCategory: resolvedRoleId,
      roleLabel: template.label,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
