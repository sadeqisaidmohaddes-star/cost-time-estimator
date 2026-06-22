# Project Cost & Time Estimator

A single-page web app that compares the **cost** and **timeline** of building a software
project two ways — **with AI** and **with human developers** — driven by a lines-of-code
(LOC) breakdown across project areas.

The whole point is **honest, transparent estimation**: every assumption, multiplier, price
and salary is visible and editable in the UI, and the comparison is never rigged in either
direction. AI cost-saving levers (batch, prompt caching) default **off**, the AI speed
advantage is a modest editable multiplier (not a baked-in "10×"), and the human-oversight
labor cost is always added to the AI total.

## Features

- **LOC breakdown by area** — add/remove areas, enter LOC directly or pick a complexity
  preset, all as three-point (Optimistic / Most likely / Pessimistic) estimates.
- **Build with AI** — pay-per-token (editable model prices, batch & caching levers) or
  subscription costing, an editable productivity multiplier for speed, and a required
  human-oversight cost that is always itemized into the AI total.
- **Build with humans** — team by seniority tier, editable salary benchmarks with region
  modifiers, fully-loaded multiplier, all-in velocity, and an optional Basic COCOMO model.
- **Uncertainty first** — PERT Best / Expected / Worst for time and cost on both sides,
  plus a simpler buffer / contingency % as a fallback.
- **Comparison output** — side-by-side summary cards, cheaper/faster verdicts with deltas,
  grouped bar charts, and a per-area breakdown table.
- **No hidden magic numbers** — every factor is editable; tooltips explain where each
  default comes from. Pricing/salary defaults verified ~June 2026.

## Tech stack

React 18 · Vite 6 · Tailwind CSS v4 · Recharts. Single page, no backend, in-memory state
only — nothing is persisted (reloading resets everything).

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Disclaimer

All figures are rough estimates based on the user's own editable assumptions and on
pricing/salary benchmarks verified as of June 2026. LOC is a weak proxy for effort; AI
productivity gains are real but contested and task-dependent. Re-verify prices, tiers and
salaries before relying on any number.

---

Author: **Said Mohaddes Sadeqi**
