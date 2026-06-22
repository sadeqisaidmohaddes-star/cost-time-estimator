// ---------------------------------------------------------------------------
// Calculation engine. Pure functions, single source of truth for all numbers.
//
// Design principles:
//  - No divide-by-zero: every denominator is guarded; bad inputs yield NaN which
//    the UI renders as "—" rather than crashing or showing Infinity.
//  - Nothing is rigged. AI cost always includes human-oversight labor; AI cost
//    levers are honored only when the user enables them; the AI speed advantage
//    is a single visible multiplier, not a baked-in "10x".
//  - Three-point (PERT) drives Best / Expected / Worst everywhere.
// ---------------------------------------------------------------------------

import { monthCount } from './format.js'
import { SALARY_TIERS } from './defaults.js'

// ---- small numeric guards ----
export function num(n) {
  const v = typeof n === 'string' ? parseFloat(n) : n
  return Number.isFinite(v) ? v : 0
}
// strictly-positive (returns 0 for <=0 or non-finite) — for denominators
export function pos(n) {
  const v = num(n)
  return v > 0 ? v : 0
}
export function clamp01(n) {
  const v = num(n)
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

// ---- LOC ----
// Effective three-point LOC for one area, resolving complexity presets.
export function areaLoc(area, complexityMap) {
  if (area.mode === 'complexity') {
    const c = complexityMap[area.complexity] || { o: 0, m: 0, p: 0 }
    return { o: num(c.o), m: num(c.m), p: num(c.p) }
  }
  return { o: num(area.loc?.o), m: num(area.loc?.m), p: num(area.loc?.p) }
}

// PERT expected value and the per-area split.
export function pert(o, m, p) {
  return (num(o) + 4 * num(m) + num(p)) / 6
}

export function totalLoc(areas, complexityMap) {
  let o = 0,
    m = 0,
    p = 0
  for (const a of areas) {
    const L = areaLoc(a, complexityMap)
    o += L.o
    m += L.m
    p += L.p
  }
  const e = pert(o, m, p)
  // PERT standard deviation of the total. Math.abs keeps it sane if a user
  // inverts a three-point estimate (Optimistic > Pessimistic) so the displayed
  // spread never shows a negative "±-NNN".
  const sigma = Math.abs(p - o) / 6
  return { o, m, p, e, sigma }
}

// ---- shared salary helpers ----
export function regionMod(state) {
  const r = state.human.regions.find((x) => x.id === state.human.regionId)
  return r ? num(r.mod) : 1
}
export function loadedAnnualForTier(state, tier) {
  const base = num(state.human.salariesUS[tier])
  return base * regionMod(state) * num(state.human.fullyLoadedMultiplier)
}
// Average fully-loaded monthly salary across the team (fallback: Mid tier).
export function avgLoadedMonthly(state) {
  const team = state.human.team
  let devs = 0,
    sumAnnual = 0
  for (const t of SALARY_TIERS) {
    const c = num(team[t])
    devs += c
    sumAnnual += c * loadedAnnualForTier(state, t)
  }
  const avgAnnual = devs > 0 ? sumAnnual / devs : loadedAnnualForTier(state, 'Mid')
  return avgAnnual / 12
}

// ---- AI speed ----
// Effective AI velocity (LOC/day) = human baseline velocity × productivity
// multiplier × number of parallel AI-assisted work streams.
export function aiLocPerDay(state) {
  return pos(state.human.velocityPerDev) * pos(state.ai.productivityMultiplier) * pos(state.ai.aiTeamSize)
}
export function aiTimeDays(loc, state) {
  const v = aiLocPerDay(state)
  return v > 0 ? num(loc) / v : NaN
}

// ---- AI token cost (depends on LOC, not time) ----
export function tokenCost(loc, ai, model) {
  const L = num(loc)
  const rework = num(ai.reworkMultiplier)
  const inTok = L * num(ai.tokensPerLocInput) * rework
  const outTok = L * num(ai.tokensPerLocOutput) * rework
  const cacheMult = ai.cachingEnabled ? 1 - clamp01(ai.cachedFraction) * clamp01(ai.cacheDiscount) : 1
  const inCost = (inTok / 1e6) * num(model?.in) * cacheMult
  const outCost = (outTok / 1e6) * num(model?.out)
  let total = inCost + outCost
  if (ai.batchEnabled) total *= 1 - clamp01(ai.batchDiscount)
  return { inTok, outTok, inCost, outCost, total }
}

// ---- AI subscription cost (depends on time in months) ----
export function subscriptionCost(months, ai, plan) {
  if (!plan) return 0
  const seats = plan.perSeat ? Math.max(1, num(ai.seats)) : 1
  return num(plan.price) * seats * Math.max(0, num(months))
}

// ---- AI human-oversight labor cost (depends on time in months) ----
export function oversightCost(months, state) {
  const loadedMonthly = loadedAnnualForTier(state, state.ai.oversightTier) / 12
  return Math.max(0, num(state.ai.oversightPeople)) * clamp01(state.ai.oversightTimeFraction) * loadedMonthly * Math.max(0, num(months))
}

// ---- Human simple (LOC / velocity) ----
export function humanLocPerDay(state) {
  const team = state.human.team
  let devs = 0
  for (const t of SALARY_TIERS) devs += num(team[t])
  const overhead = pos(state.human.nonCodingOverhead) || 1
  return (devs * pos(state.human.velocityPerDev)) / overhead
}
export function humanTimeDays(loc, state) {
  const v = humanLocPerDay(state)
  return v > 0 ? num(loc) / v : NaN
}
// Total fully-loaded team cost per working day.
export function humanLoadedDaily(state) {
  const team = state.human.team
  const wdy = pos(state.human.workingDaysPerYear) || 230
  let perDay = 0
  for (const t of SALARY_TIERS) {
    perDay += num(team[t]) * (loadedAnnualForTier(state, t) / wdy)
  }
  return perDay
}
export function humanCostForDays(days, state) {
  if (!Number.isFinite(days)) return NaN
  return days * humanLoadedDaily(state)
}

// ---- Human COCOMO (Basic) ----
export function cocomoCalc(loc, state) {
  const mode = state.human.cocomoModes.find((m) => m.id === state.human.cocomoModeId) || state.human.cocomoModes[0]
  const kloc = num(loc) / 1000
  if (kloc <= 0) return { effort: 0, months: 0, cost: 0, modeName: mode?.name || '' }
  const effort = num(mode.a) * Math.pow(kloc, num(mode.b)) // person-months
  const months = num(mode.c) * Math.pow(effort, num(mode.d)) // schedule months
  const cost = effort * avgLoadedMonthly(state) // person-months × loaded monthly
  return { effort, months, cost, modeName: mode.name }
}

// ---- One full scenario for a single LOC figure ----
function scenarioFor(loc, state, model, plan) {
  const aiDays = aiTimeDays(loc, state)
  const aiMonths = monthCount(aiDays, state.human.workingDaysPerYear)
  const tok = tokenCost(loc, state.ai, model)
  const subCost = subscriptionCost(aiMonths, state.ai, plan)
  const aiToolCost = state.ai.costMode === 'token' ? tok.total : subCost
  const oversight = oversightCost(aiMonths, state)
  const aiTotalCost = aiToolCost + oversight

  const hDays = humanTimeDays(loc, state)
  const hCost = humanCostForDays(hDays, state)
  const cocomo = cocomoCalc(loc, state)

  return {
    loc: num(loc),
    ai: {
      days: aiDays,
      months: aiMonths,
      toolCost: aiToolCost,
      oversightCost: oversight,
      totalCost: aiTotalCost,
      tokens: tok,
      subCost,
    },
    human: {
      days: hDays,
      cost: hCost,
      cocomo,
    },
  }
}

// ---- Buffer ----
export function applyBuffer(value, percent, apply) {
  if (!apply || !Number.isFinite(value)) return value
  return value * (1 + num(percent) / 100)
}

// ---------------------------------------------------------------------------
// Master compute: everything the UI needs in one object.
// ---------------------------------------------------------------------------
export function computeAll(state) {
  const loc = totalLoc(state.areas, state.complexityMap)
  const model = state.ai.models.find((m) => m.id === state.ai.selectedModelId) || state.ai.models[0]
  const plan = state.ai.plans.find((p) => p.id === state.ai.selectedPlanId) || state.ai.plans[0]

  // Per-area breakdown
  const areas = state.areas.map((a) => {
    const L = areaLoc(a, state.complexityMap)
    const e = pert(L.o, L.m, L.p)
    return {
      id: a.id,
      name: a.name,
      mode: a.mode,
      complexity: a.complexity,
      loc: { ...L, e },
      contributionPct: loc.e > 0 ? (e / loc.e) * 100 : 0,
    }
  })

  // Three-point scenarios: best=optimistic LOC, expected=PERT, worst=pessimistic
  const scenarios = {
    best: scenarioFor(loc.o, state, model, plan),
    expected: scenarioFor(loc.e, state, model, plan),
    worst: scenarioFor(loc.p, state, model, plan),
  }

  // Convenience: headline base + buffered for the EXPECTED scenario.
  const b = state.buffer
  const headline = {
    ai: {
      timeBase: scenarios.expected.ai.days,
      timeBuffered: applyBuffer(scenarios.expected.ai.days, b.aiPercent, b.aiApplyTime),
      costBase: scenarios.expected.ai.totalCost,
      costBuffered: applyBuffer(scenarios.expected.ai.totalCost, b.aiPercent, b.aiApplyCost),
    },
    human: {
      timeBase: scenarios.expected.human.days,
      timeBuffered: applyBuffer(scenarios.expected.human.days, b.humanPercent, b.humanApplyTime),
      costBase: scenarios.expected.human.cost,
      costBuffered: applyBuffer(scenarios.expected.human.cost, b.humanPercent, b.humanApplyCost),
    },
  }

  return { loc, areas, scenarios, headline, model, plan }
}

// Build a buffered view of a scenario value for either side (used by tables/charts).
export function bufferedScenario(scenario, side, buffer) {
  const pct = side === 'ai' ? buffer.aiPercent : buffer.humanPercent
  const applyTime = side === 'ai' ? buffer.aiApplyTime : buffer.humanApplyTime
  const applyCost = side === 'ai' ? buffer.aiApplyCost : buffer.humanApplyCost
  const days = side === 'ai' ? scenario.ai.days : scenario.human.days
  const cost = side === 'ai' ? scenario.ai.totalCost : scenario.human.cost
  return {
    daysBase: days,
    daysBuffered: applyBuffer(days, pct, applyTime),
    costBase: cost,
    costBuffered: applyBuffer(cost, pct, applyCost),
  }
}
