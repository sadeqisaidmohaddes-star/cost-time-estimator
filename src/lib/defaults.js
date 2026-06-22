// ---------------------------------------------------------------------------
// Default state for the estimator.
//
// EVERY number in here is an editable assumption surfaced in the UI. Nothing is
// a hidden "magic" constant. Prices/salaries were verified ~June 2026 and will
// drift — the app shows a "last checked" banner and lets the user edit anything.
//
// The defaults are intentionally NOT rigged toward AI or humans: AI cost levers
// (batch / caching) default OFF, the AI productivity multiplier is a modest 1.5x,
// and human oversight cost for AI is always added in.
// ---------------------------------------------------------------------------

let _id = 0
export const uid = (prefix = 'id') => `${prefix}_${++_id}`

export const PRICES_LAST_CHECKED = 'June 2026'

export const COMPLEXITY_LEVELS = ['Trivial', 'Simple', 'Moderate', 'Complex', 'Very Complex']

// Complexity -> three-point LOC (Optimistic / Most likely / Pessimistic). Editable.
export const defaultComplexityMap = {
  Trivial: { o: 50, m: 100, p: 200 },
  Simple: { o: 200, m: 400, p: 700 },
  Moderate: { o: 700, m: 1200, p: 2000 },
  Complex: { o: 2000, m: 3500, p: 6000 },
  'Very Complex': { o: 6000, m: 10000, p: 18000 },
}

// Pre-seeded project areas. mode 'complexity' pulls LOC from the map above;
// mode 'manual' uses the area's own three-point `loc`.
function area(name, complexity) {
  return {
    id: uid('area'),
    name,
    mode: 'complexity', // 'complexity' | 'manual'
    complexity,
    loc: { ...defaultComplexityMap[complexity] }, // used when mode === 'manual'
  }
}

export const defaultAreas = () => [
  area('Frontend', 'Complex'),
  area('Backend', 'Complex'),
  area('Database', 'Moderate'),
  area('Auth', 'Moderate'),
  area('API integrations', 'Moderate'),
  area('DevOps/CI', 'Simple'),
  area('Testing', 'Moderate'),
  area('Docs', 'Simple'),
]

// --- AI: pay-per-token model rows (USD per million tokens, standard rates, June 2026) ---
export const defaultModels = () => [
  { id: uid('model'), name: 'Claude Opus 4.8', in: 5, out: 25 },
  { id: uid('model'), name: 'Claude Sonnet 4.6', in: 3, out: 15 },
  { id: uid('model'), name: 'Claude Haiku 4.5', in: 1, out: 5 },
  { id: uid('model'), name: 'GPT-5.2', in: 1.75, out: 14 },
  { id: uid('model'), name: 'Gemini 3.1 Pro', in: 2, out: 12 },
]

// --- AI: subscription plan rows (USD per month, June 2026) ---
export const defaultPlans = () => [
  { id: uid('plan'), name: 'GitHub Copilot Pro', price: 10, perSeat: false },
  { id: uid('plan'), name: 'GitHub Copilot Pro+', price: 39, perSeat: false },
  { id: uid('plan'), name: 'GitHub Copilot Business', price: 19, perSeat: true },
  { id: uid('plan'), name: 'GitHub Copilot Max', price: 100, perSeat: false },
  { id: uid('plan'), name: 'Cursor Pro', price: 20, perSeat: false },
  { id: uid('plan'), name: 'Cursor Pro+', price: 60, perSeat: false },
  { id: uid('plan'), name: 'Cursor Ultra', price: 200, perSeat: false },
  { id: uid('plan'), name: 'Cursor Teams', price: 40, perSeat: true },
  { id: uid('plan'), name: 'Claude Pro', price: 20, perSeat: false },
  { id: uid('plan'), name: 'Claude Max 5x', price: 100, perSeat: false },
  { id: uid('plan'), name: 'Claude Max 20x', price: 200, perSeat: false },
  { id: uid('plan'), name: 'ChatGPT Plus (for Codex)', price: 20, perSeat: false },
]

// --- Human salaries: US base (annual USD, 2026), editable ---
export const SALARY_TIERS = ['Junior', 'Mid', 'Senior', 'Staff']
export const TIER_LABELS = {
  Junior: 'Junior (0–2 yr)',
  Mid: 'Mid (3–5 yr)',
  Senior: 'Senior (5–8 yr)',
  Staff: 'Staff/Principal (8+ yr)',
}
export const defaultSalariesUS = { Junior: 78000, Mid: 125000, Senior: 150000, Staff: 200000 }

// Regional modifiers applied to the US base. Editable.
export const defaultRegions = () => [
  { id: 'us', name: 'US', mod: 1.0 },
  { id: 'weu', name: 'Western Europe', mod: 0.85 },
  { id: 'remote', name: 'Remote-global', mod: 0.8 },
  { id: 'eeu', name: 'Eastern Europe', mod: 0.4 },
]

// COCOMO (Basic) mode constants: Effort = a*KLOC^b, DevTime = c*Effort^d. Editable.
export const defaultCocomoModes = () => [
  { id: 'organic', name: 'Organic', a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
  { id: 'semi', name: 'Semi-detached', a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
  { id: 'embedded', name: 'Embedded', a: 3.6, b: 1.2, c: 2.5, d: 0.32 },
]

export function makeInitialState() {
  const models = defaultModels()
  const plans = defaultPlans()
  // Default the active model to Claude Sonnet 4.6 (a common mid-tier coding model)
  // and the active plan to Cursor Pro — both editable, both just starting points.
  const selectedModelId = (models.find((m) => m.name === 'Claude Sonnet 4.6') || models[0]).id
  const selectedPlanId = (plans.find((p) => p.name === 'Cursor Pro') || plans[0]).id

  return {
    areas: defaultAreas(),
    complexityMap: { ...structuredCloneMap(defaultComplexityMap) },

    // ---------------- AI mode ----------------
    ai: {
      costMode: 'token', // 'token' | 'subscription'

      // Token model
      tokensPerLocInput: 30,
      tokensPerLocOutput: 10,
      reworkMultiplier: 3, // code is regenerated/debugged
      models,
      selectedModelId,

      // Cost levers (default OFF so the comparison is not rigged cheaper)
      batchEnabled: false,
      batchDiscount: 0.5, // -50% on all tokens
      cachingEnabled: false,
      cacheDiscount: 0.9, // up to -90% on cached input
      cachedFraction: 0.5, // % of input that is cached

      // Subscription model
      plans,
      selectedPlanId,
      seats: 1,

      // Speed: productivity multiplier vs human baseline velocity
      productivityMultiplier: 1.5,
      aiTeamSize: 1, // number of parallel AI-assisted work streams

      // Human oversight (REQUIRED, always added to AI cost)
      oversightPeople: 0.5, // ~0.5 of one mid-level developer
      oversightTier: 'Mid',
      oversightTimeFraction: 1.0, // share of their time on this project (0..1)
    },

    // ---------------- Human mode ----------------
    human: {
      regionId: 'us',
      regions: defaultRegions(),
      salariesUS: { ...defaultSalariesUS },
      fullyLoadedMultiplier: 1.3, // benefits, taxes, equity, overhead
      team: { Junior: 1, Mid: 1, Senior: 1, Staff: 0 },
      velocityPerDev: 15, // LOC/day/developer (all-in)
      nonCodingOverhead: 1.0, // >1 slows the team (meetings, PM, review)
      workingDaysPerYear: 230,

      // COCOMO advanced model (shown alongside the simple estimate)
      cocomoEnabled: false,
      cocomoModeId: 'organic',
      cocomoModes: defaultCocomoModes(),
    },

    // ---------------- Buffers ----------------
    buffer: {
      aiPercent: 25,
      humanPercent: 20,
      aiApplyTime: true,
      aiApplyCost: true,
      humanApplyTime: true,
      humanApplyCost: true,
    },
  }
}

function structuredCloneMap(m) {
  const out = {}
  for (const k of Object.keys(m)) out[k] = { ...m[k] }
  return out
}
