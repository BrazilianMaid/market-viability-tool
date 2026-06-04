import { getPublicMetadata } from './role-templates.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Role metadata is static config; let the CDN serve it so this rarely cold-starts.
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
  return res.status(200).json({ roles: getPublicMetadata() });
}
