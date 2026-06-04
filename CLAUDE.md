# CLAUDE.md — Market Viability Tool (MVT)

This file is read by every Claude Code session on this repo before any work begins. Treat it as CI config for the LLM, not as documentation. The invariants below apply to every prompt; do not relitigate them per task.

---

## Universal Prompt Invariants

### 1. Production from Day Zero
> Treat this as production-bound from the first commit. Every endpoint must have: (1) auth, or an explicit note if intentionally public, (2) input validation, (3) a timeout/maxDuration cap, (4) structured JSON logging for every external API call including cost-bearing ones (tokens in/out, latency, status, user id). If you skip any of these, flag it explicitly with "NOT IMPLEMENTED — needs Phase X" so I can track it. Don't silently default to a prototype shape.

### 2. Cost Discipline (LLM-specific)
> This project uses paid LLM APIs. For every model call: (1) estimate per-request cost in a code comment using current pricing, (2) cap any agentic tool (web_search, code execution) with max_uses or equivalent at the smallest count that works, (3) re-confirm cost estimates after every change to max_tokens, search count, or tool config, (4) add a circuit breaker that aborts requests exceeding N tokens or M dollars. Never raise max_tokens or remove a cap without first showing me the cost delta.

### 3. Regression Awareness
> Before suggesting a code change that modifies a recently-altered area, run `git log -p -- <file>` for the last 10 commits. If you find a commit that REMOVED what you're about to ADD (or vice versa), cite it explicitly and explain why this time is different. Otherwise you may be reintroducing a fix-bug.

### 4. Architecture Defaults
> Defaults: split files at 300 lines or natural cohesion boundary — no monolithic single-file SPAs. Use ES modules natively if no bundler. Add package.json from day one even with no install — it's the dependency manifest. Branch protection on main, no direct push. Replace any regex-based markdown/HTML parser with a battle-tested library.

### 5. Verification Discipline
> Before reporting a coding task as done: (1) read your own diff with git diff, (2) verify the change actually persisted (the file isn't reverted), (3) quote at least one critical line of new code in your final summary so I can spot-check without re-reading, (4) explicitly state what you did NOT change. "I think I did X" is not the same as "X is in the diff."

### 6. Threat Modeling at Deploy
> Before any deploy, answer in writing: (1) who can call each endpoint? (2) worst-case cost if an attacker hits it in a loop? (3) what happens if [Anthropic / Stripe / DB] is down? (4) what gets logged that shouldn't (PII, secrets, full prompt content)? Don't ship until each has an explicit answer.

---

## Meta-Rules

> **Make the prompt outlast the project.** This file IS that mechanism — every Claude Code session on this repo should read CLAUDE.md first. Don't relitigate these invariants per prompt; treat this file as CI config for the LLM.

> **Demand explicit checkpoints.** After every meaningful change, the model should give: (1) a one-line headline, (2) the diff filename list, (3) a "risks I'm not addressing" bullet list. Don't bury risks in paragraph 6 of a long summary.

---

## Project Context — Market Viability Tool (MVT)

*Keep this section factual and current. If you change the API surface, auth posture, or build setup, update it in the same commit.*

- **Stack:** static HTML SPA (`index.html`, no build step, no bundler) + Vercel serverless functions in `api/`. `package.json` exists (`type: module`, `engines.node >=18`); `npm test` runs the role-registry smoke tests in `test/`.
- **Live API:**
  - `POST /api/analyze` — Anthropic Sonnet 4 + `web_search_20250305`, capped at `max_uses: 3`, `maxDuration: 60`. Emits `[MVT_LOG]` structured JSON per call (role, truncated company, tokens in/out, search_count, latency, status).
  - `GET /api/roles` — serves `getPublicMetadata()` from the role registry so the frontend renders the role selector.
  - There is **no** `/api/key`. An earlier auth-via-obscurity gate was rejected because it served the secret to the browser.
- **Auth:** `/api/analyze` is currently **unauthenticated by design** (public static page, no login). Real protection — Cloudflare Turnstile + Upstash per-IP rate limit — is the agreed next step. A browser-readable key is not a substitute. Until then, treat cost-abuse as an open, acknowledged risk.
- **Cost target:** ≤ $0.30 per report at Sonnet 4 with `max_uses: 3`. If a change would push above $0.40, flag it before merging.
- **Role templates — SINGLE SOURCE OF TRUTH:** 6 categories live in `api/role-templates.js` (sales, engineering, marketing, finance, product, general). The frontend fetches role metadata from `/api/roles`, so adding or editing a role only requires editing `api/role-templates.js` and running `npm test` — there is no frontend copy to sync. The test enforces: weights sum to 100, section labels keep the keywords the renderer keys off, and exactly 6 loading steps.
- **Env vars:** `ANTHROPIC_API_KEY` (server-side, required). Documented in `README.md`.
- **Known fragile:** the regex markdown renderer in `index.html` (`renderMarkdownToHTML`) keys off an exact `### Heading — XX/YY` structure and can mis-parse if Claude varies the format. Model output is now HTML-escaped (`escapeHtml`) to prevent stored XSS, and there is a fallback to escaped raw markdown when zero sections parse — but replacing the parser with a real library (markdown-it) remains the goal per Invariant 4.
- **Storage:** localStorage only (`mvs_reports_v1`, via the `ReportStore` abstraction in `index.html`). No cross-device state yet — don't add features that depend on it until a backend store exists.
- **Architecture debt:** `index.html` is a single ~2,700-line file, which violates Invariant 4's 300-line split. Known and accepted for now; factor out when it next needs substantial work.
- **Branch discipline:** Direct commits to `main` are the accepted workflow for this repo (resolved 2026-06-04), intentionally overriding Invariant 4's no-direct-push default. Vercel auto-deploys `main`, so verify `/api/roles` and an end-to-end analysis after each push.
- **Planned next:** (1) real API protection — Cloudflare Turnstile + Upstash per-IP rate limit on `/api/analyze`; (2) feature 2 — opt-in "verify discovered partners on their own sites" as a second cost-bearing endpoint (`/api/verify-partners`), to be built AFTER protection so both endpoints are gated together. The sales `channelGuidance` already emits a parseable `Partner | Type | Where Found` table for step 1 to feed step 2.
