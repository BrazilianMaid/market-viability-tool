# Market Viability Tool

A single-page web app that generates a structured "Market Viability" research
report for a company, tailored to the role a job seeker is evaluating it for
(Sales, Engineering, Marketing, Finance, Product, or a balanced General view).
The report covers analyst recognition, financial health, product/customer
sentiment, culture, competitive position, channel/ecosystem map, and tailored
interview questions. It runs on the Anthropic API with web search.

## Architecture

| Path | Role |
| --- | --- |
| `index.html` | Entire frontend — UI, report rendering, localStorage-backed saved reports, and side-by-side comparison. No build step. |
| `api/analyze.js` | Serverless endpoint (`POST /api/analyze`). Calls the Anthropic Messages API with the web-search tool and returns the report markdown. |
| `api/role-templates.js` | The single source of truth for each role's prompt, scoring weights, section labels, and loading steps. |
| `api/roles.js` | Serverless endpoint (`GET /api/roles`). Serves `getPublicMetadata()` so the frontend renders the role selector without duplicating that data. |
| `vercel.json` | Routing (SPA rewrites) and the `maxDuration` cap for the analyze function. |

Reports are stored client-side in `localStorage` (`mvs_reports_v1`). The
`ReportStore` object in `index.html` is the storage abstraction — swap its
implementation to move to a backend without touching callers.

## Environment variables

Set these in the Vercel project (Settings → Environment Variables):

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Server-side key used by `api/analyze.js`. Never exposed to the browser. |

> Note: `/api/analyze` is currently unauthenticated by design — the app is a
> public static page with no login. Adding a real abuse gate (Cloudflare
> Turnstile + per-IP rate limiting) is the planned next step. A browser-readable
> API key is **not** a substitute, since anything shipped to the client is public.

## Local development

```bash
npm install        # only needed once you add dependencies
npm test           # run the role-registry smoke tests
vercel dev         # run the frontend + serverless functions locally
```

`vercel dev` (Vercel CLI) is required to exercise the `/api/*` functions —
opening `index.html` directly will load the UI but the role selector will show
an error because there's no backend to serve `/api/roles`.

## Adding or editing a role

Edit `api/role-templates.js` only — the frontend reads everything via
`/api/roles`, so there is no second copy to keep in sync. Each role must:

- have `weights` that sum to **100** across `analyst`, `financial`, `product`, `culture`;
- keep `sectionLabels` containing the keywords the renderer keys off
  (analyst/recognition, financial, product/customer, culture/employee); and
- provide exactly **6** `loadingSteps`.

Run `npm test` to verify these invariants before deploying.

## Deployment

Pushing to `main` auto-deploys via Vercel. Verify `/api/roles` returns JSON and
that an analysis runs end-to-end after each deploy, since the serverless runtime
can't be fully exercised from a static file preview.
