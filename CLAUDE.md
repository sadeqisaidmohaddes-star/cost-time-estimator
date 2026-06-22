# CLAUDE.md — Project Cost & Time Estimator

Guidance for working in this codebase. Read this before editing — especially the
**Content constraints** and **How the math works** sections.

---

## 1. What this is

A single-page web app that compares the **cost** and **timeline** of building a
software project two ways — **with AI** and **with human developers** — driven by a
lines-of-code (LOC) breakdown across project areas.

The entire point of the tool is **honest, transparent estimation**:

- Every assumption, multiplier, price, and salary is **visible and editable** in the
  UI. There are **no hidden magic numbers** — if a number affects the result, the user
  can see and change it.
- The comparison **must never be rigged** in either direction. AI cost-saving levers
  (batch, prompt caching) default **off**; the AI speed advantage is a modest, editable
  multiplier (not a baked-in "10×"); and the **human-oversight labor cost is always
  added** to the AI total.
- Pre-filled defaults were verified **~June 2026** and are shown behind a "prices last
  checked" banner because they drift constantly.

---

## 2. Goals

1. **Truthfulness over flattery.** Surface the real trade-offs (e.g. at the seed data,
   AI is cheaper but slower than a 3-person team) rather than declaring a winner.
2. **Total transparency.** No assumption is buried. Tooltips (ⓘ) explain where each
   default comes from and cite the reality-checks (LOC is a weak proxy, AI speedups are
   contested, etc.).
3. **Uncertainty made first-class.** Three-point PERT (Optimistic / Most likely /
   Pessimistic) drives a Best / Expected / Worst view; a simpler buffer % is the fallback.
4. **Robust to bad input.** No divide-by-zero, no `NaN`/`Infinity` leaking to the screen,
   no negative-dollar nonsense. Empty/zero/negative inputs degrade gracefully.
5. **Zero friction.** No backend, no login, no persistence — open it and estimate.

---

## 3. Content constraints (MANDATORY — applies to all examples / seed / placeholder data)

These are hard requirements. Any new sample data, area names, presets, demo content, or
copy **must** comply:

- **No cryptocurrency, blockchain, NFT, or Web3** anything — not as examples, seed data,
  or placeholders.
- **No haram (impermissible in Islam) industries**: gambling/betting/casinos, alcohol,
  pork products, adult/explicit content, conventional interest-based (riba) lending or
  banking, and tobacco.
- For any example domains, use **neutral, permissible industries**: e-commerce, healthcare,
  education, logistics, productivity/SaaS, agriculture, manufacturing.

Seed area names (Frontend, Backend, Database, Auth, API integrations, DevOps/CI, Testing,
Docs) are domain-neutral by design — keep it that way.

---

## 4. Tech stack

- **React 18** + **Vite 6** (SPA, no router, no backend).
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — **no `tailwind.config.js` and
  no `postcss.config.js`**. Styling is `@import "tailwindcss";` in `src/index.css` plus
  utility classes. To add design tokens, use the v4 `@theme` block in `index.css`.
- **Recharts 2.x** for the bar charts.
- **State:** in-memory React `useState` only. **Nothing** is persisted to disk,
  `localStorage`, or a server. Reloading the page resets everything — this is intentional.

---

## 5. Run / build

```bash
npm install
npm run dev      # Vite dev server (the Claude preview config runs it on port 5191)
npm run build    # production build to dist/  (~658 modules; should pass clean)
npm run preview  # serve the production build
```

The repo-root `.claude/launch.json` (one level up, in the multi-project parent) registers
a preview config named **`cost-time-estimator`** that runs `npm --prefix cost-time-estimator
run dev -- --port 5191 --strictPort`. A redundant local `.claude/launch.json` also exists
in this folder; the parent one is what the preview tooling uses.

---

## 6. Project structure

```
cost-time-estimator/
├── index.html                 # Vite entry; mounts #root
├── vite.config.js             # react + @tailwindcss/vite plugins
├── package.json
├── CLAUDE.md                  # this file
└── src/
    ├── main.jsx               # React root render (StrictMode)
    ├── index.css              # @import "tailwindcss" + a few base tweaks
    ├── App.jsx                # top-level shell: holds ALL state, layout, header/banner/footer
    ├── lib/
    │   ├── defaults.js        # makeInitialState() + every editable default (prices, salaries, maps)
    │   ├── calc.js            # THE calculation engine — single source of truth for all numbers
    │   └── format.js          # currency / number / time formatting + NaN→"—" guards
    └── components/
        ├── ui.jsx             # reusable primitives: Tooltip, Card, Field, NumberField,
        │                      #   TextField, Select, Checkbox, SegToggle, Button, Collapsible, Pill
        ├── ProjectBreakdown.jsx  # §1 areas table (LOC by area, preset vs manual, 3-point)
        ├── AiPanel.jsx           # §2 Build-with-AI (tokens/subscription, levers, speed, oversight)
        ├── HumanPanel.jsx        # §3 Build-with-humans (team, salaries, velocity, COCOMO toggle)
        ├── BufferPanel.jsx       # §4 contingency % (separate AI/human, time/cost toggles)
        ├── Charts.jsx            # Recharts grouped bars (cost & time, Best/Expected/Worst)
        ├── Results.jsx           # §5–6 comparison banner, summary cards, breakdown table
        ├── SettingsPanel.jsx     # global maps: complexity→LOC, COCOMO constants, region modifiers
        └── About.jsx             # §7 "About these estimates" reality-check panel
```

---

## 7. Architecture & data flow

### State model
- **All** application state lives in one object in `App.jsx` (`useState(makeInitialState)`).
- Mutations go through a single `update(mutator)` helper that does
  `structuredClone(prev)` → run the mutator on the draft → return it. This keeps updates
  immutable without adding a dependency like Immer. State is plain data only (no functions,
  no class instances) so `structuredClone` is safe.
- Components receive `state` and `update`, plus focused props. They never hold derived
  business state — they call `update((d) => …)` to mutate slices (e.g. `d.ai.x = v`).

### The calculation engine — `src/lib/calc.js`
This is the **single source of truth**. UI components must not re-implement math; they
read from `computeAll(state)`.

- `computeAll(state)` runs once per render in `App.jsx` via `useMemo` and returns
  `{ loc, areas, scenarios, headline, model, plan }`.
- `scenarios` = `{ best, expected, worst }`, each computed from a single LOC figure
  (optimistic total, PERT-expected total, pessimistic total).
- Key formulas (all guarded against divide-by-zero; bad denominators yield `NaN`, which
  `format.js` renders as `"—"` — never `Infinity`):
  - **PERT:** `E = (O + 4M + P) / 6`; total `σ = |P − O| / 6`.
  - **AI speed:** effective LOC/day = `humanVelocity × productivityMultiplier × aiTeamSize`.
  - **AI token cost:** `LOC × tokens/LOC × rework`, priced per MTok; caching discounts the
    cached fraction of input, batch discounts the total — **both off by default**.
  - **AI subscription cost:** `price × seats × months` (months from the AI time estimate).
  - **AI oversight (always added):** `people × clamp01(timeFraction) × loadedMonthly × months`.
  - **Human simple:** time = `LOC / (Σ devs × velocity / overhead)`; cost =
    `days × Σ(count × loadedAnnual / workingDaysPerYear)` (≡ years × Σ loaded salaries).
  - **COCOMO Basic:** effort = `a·KLOC^b` (person-months); schedule = `c·effort^d` (months);
    cost = `effort × avgLoadedMonthly`.
  - **Buffers** applied on top per the AI/human time/cost toggles.

### Numeric safety contract
- `num()` coerces to a finite number (else 0); `pos()` is `num` but returns 0 for ≤0
  (use for denominators); `clamp01()` for 0..1 fractions.
- `NumberField` (in `ui.jsx`) clamps to its `min`/`max` on change, so the advisory HTML
  `min`/`max` are **authoritative** — negative or out-of-range values cannot reach the
  cost math. **Keep passing `min={0}` (or appropriate bounds) on every NumberField.**
- `format.js` `isBad()` treats `NaN` and non-finite as bad → renders `"—"`.

---

## 8. Conventions

- Match the surrounding code: small functional components, Tailwind utility classes, no CSS
  modules. Comments are sparse and explain **why**, not what.
- New editable assumptions: add the default to `defaults.js`, the math to `calc.js`, and a
  labelled control (with a ⓘ `Tooltip` explaining the default's source) in the relevant
  panel. **Never** introduce a constant that affects results without exposing it in the UI.
- Charts: `isAnimationActive={false}` is set intentionally on the bars — keep it (animation
  prevented headless screenshot capture from ever settling). Don't re-enable without reason.
- Currency/number formatting always goes through `format.js`; don't inline `toLocaleString`.

---

## 9. Known gotchas

- **Preview screenshots may time out.** The headless preview browser viewport can collapse
  to ~3px (call `preview_resize` to e.g. 1280×860 first), and Recharts' SVGs can still keep
  the page from reaching a "stable" state for capture. Verify via the accessibility snapshot
  / DOM `eval` instead of relying on screenshots.
- Recharts 2.x is deprecated upstream (v3 exists) but pinned here for React 18 stability.
  The "3 high severity" npm audit warnings are in the dev toolchain, not shipped code.

---

## 10. Roadmap (potential, not committed)

Ordered roughly by value-to-effort. Anything here must still honor §2 (honesty) and §3
(content constraints).

**Near-term polish**
- Unit tests for `calc.js` (PERT, token/caching/batch, oversight, COCOMO, divide-by-zero)
  — the engine is pure and highly testable; this is the highest-value next step.
- Per-tier developer velocity (currently one velocity for all tiers).
- Inline validation hint when a three-point estimate is inverted (O > P).
- Currency selector (display only) and a thousands/locale toggle.

**Estimation depth**
- Sensitivity / tornado view: which single assumption moves the result most.
- Monte Carlo over the three-point inputs as an alternative to PERT's closed form.
- Intermediate or Detailed COCOMO (cost drivers) alongside Basic.
- Separate AI input/output token factors per area, and an "AI generates more code" LOC
  inflation factor surfaced per area.

**UX / sharing (must preserve "no persistence by default")**
- Optional URL-encoded share link (serialize state to the query string — opt-in, still no
  server/localStorage).
- Export the comparison to CSV / printable PDF.
- A few neutral-domain example presets (e-commerce, healthcare, logistics) as one-click
  starting points — strictly within §3 constraints.
- Dark mode (Tailwind v4 `@theme` + `prefers-color-scheme`).

**Maintainability**
- Centralize the "last verified" date and price metadata so the banner and any future
  staleness warnings read from one place.
- Consider migrating Recharts to v3 when the React/peer story is settled.

---

## 11. Disclaimer (also shown in-app)

All figures are rough estimates based on the user's own editable assumptions and on
pricing/salary benchmarks verified as of June 2026. LOC is a weak proxy for effort; AI
productivity gains are real but contested and highly task-dependent. Re-verify prices,
subscription tiers, and salaries before relying on any number. Nothing here is financial
advice or a fixed quote.
