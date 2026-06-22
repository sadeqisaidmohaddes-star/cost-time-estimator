import { Card, Field, NumberField, Select, Checkbox, Tooltip, Pill } from './ui.jsx'
import { SALARY_TIERS, TIER_LABELS } from '../lib/defaults.js'
import { regionMod, loadedAnnualForTier, num } from '../lib/calc.js'
import { money, integer } from '../lib/format.js'

export default function HumanPanel({ state, update, expected }) {
  const h = state.human
  const setH = (fn) => update((d) => fn(d.human))
  const rmod = regionMod(state)

  const regionOpts = h.regions.map((r) => ({ value: r.id, label: `${r.name} (${num(r.mod).toFixed(2)}×)` }))
  const cocomoOpts = h.cocomoModes.map((m) => ({ value: m.id, label: m.name }))
  const totalDevs = SALARY_TIERS.reduce((s, t) => s + num(h.team[t]), 0)

  return (
    <Card
      title="3 · Build with humans"
      subtitle="Team by seniority, editable salary benchmarks, and an all-in velocity. Cost = time × fully-loaded salaries."
      right={<Pill tone="green">Human mode</Pill>}
    >
      {/* Region */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field
          label="Region"
          tip="Pre-fills salary modifiers applied to the US base. These are editable estimates, not live Glassdoor data — type your own."
        >
          <Select value={h.regionId} onChange={(v) => setH((x) => (x.regionId = v))} options={regionOpts} className="min-w-[14rem]" />
        </Field>
        <p className="pb-1.5 text-[11px] text-slate-400">Editable estimates, not live market data — type your own.</p>
      </div>

      {/* Salary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Tier</th>
              <th className="py-1 text-right font-medium">US base $/yr</th>
              <th className="py-1 text-right font-medium">
                Region-adj.
                <Tooltip text="US base × region modifier." />
              </th>
              <th className="py-1 text-right font-medium">
                Fully-loaded
                <Tooltip text="Region-adjusted salary × fully-loaded multiplier (benefits, taxes, equity, overhead)." />
              </th>
              <th className="py-1 text-center font-medium"># devs</th>
            </tr>
          </thead>
          <tbody>
            {SALARY_TIERS.map((t) => {
              const adj = num(h.salariesUS[t]) * rmod
              const loaded = loadedAnnualForTier(state, t)
              return (
                <tr key={t} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 text-slate-700">{TIER_LABELS[t]}</td>
                  <td className="py-1.5">
                    <NumberField
                      value={h.salariesUS[t]}
                      min={0}
                      prefix="$"
                      onChange={(v) => setH((x) => (x.salariesUS[t] = v))}
                      className="text-right"
                    />
                  </td>
                  <td className="py-1.5 text-right text-slate-500">{money(adj)}</td>
                  <td className="py-1.5 text-right font-medium text-slate-700">{money(loaded)}</td>
                  <td className="py-1.5">
                    <NumberField value={h.team[t]} min={0} onChange={(v) => setH((x) => (x.team[t] = v))} className="text-center" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field
          label="Fully-loaded ×"
          tip="Multiplier on base salary for benefits, taxes, equity and overhead. Default 1.3× — industry rule of thumb is +25–30% benefits, more with equity."
        >
          <NumberField value={h.fullyLoadedMultiplier} min={0} onChange={(v) => setH((x) => (x.fullyLoadedMultiplier = v))} />
        </Field>
        <Field
          label="Velocity LOC/day/dev"
          tip="All-in productive output per developer per day. Default 15 (NOT 50): real net output averages ~10–20 LOC/day including testing, meetings and debugging. Raw commit counts look higher but aren't sustained net output."
        >
          <NumberField value={h.velocityPerDev} min={0} onChange={(v) => setH((x) => (x.velocityPerDev = v))} />
        </Field>
        <Field
          label="Non-coding overhead ×"
          tip="Drag from meetings, PM, code review and context-switching. 1.0× = neutral; 1.5× makes the team 50% slower. Default 1.0×."
        >
          <NumberField value={h.nonCodingOverhead} min={0} onChange={(v) => setH((x) => (x.nonCodingOverhead = v))} />
        </Field>
        <Field
          label="Working days / year"
          tip="Used to convert annual salary to a daily rate and days to months. Default 230 (after weekends, holidays and PTO)."
        >
          <NumberField value={h.workingDaysPerYear} min={1} onChange={(v) => setH((x) => (x.workingDaysPerYear = v))} />
        </Field>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Team: <strong className="text-slate-700">{integer(totalDevs)}</strong> developer(s) ·
        combined {integer(totalDevs * num(h.velocityPerDev))} raw LOC/day before overhead.
      </div>

      {/* COCOMO */}
      <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <Checkbox
          checked={h.cocomoEnabled}
          onChange={(v) => setH((x) => (x.cocomoEnabled = v))}
          label="Also estimate with Basic COCOMO (advanced)"
          tip="An alternative effort model: Effort(person-months) = a × KLOC^b, schedule(months) = c × Effort^d. Shown alongside the simple LOC/velocity estimate so you can compare methods. Constants are editable under All assumptions."
        />
        {h.cocomoEnabled && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="COCOMO mode" tip="Organic = small/simple teams; Semi-detached = medium; Embedded = tightly-constrained systems.">
              <Select value={h.cocomoModeId} onChange={(v) => setH((x) => (x.cocomoModeId = v))} options={cocomoOpts} />
            </Field>
            {expected && (
              <div className="pb-1 text-[11px] text-slate-500">
                Expected COCOMO: <strong className="text-slate-700">{integer(expected.human.cocomo.effort)}</strong> person-months ·
                schedule <strong className="text-slate-700">{integer(expected.human.cocomo.months)}</strong> mo ·
                cost <strong className="text-slate-700">{money(expected.human.cocomo.cost)}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {expected && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">Expected (humans, simple):</span>
          <span>
            time <strong className="text-slate-800">{integer(expected.human.days)} days</strong>
          </span>
          <span>·</span>
          <span>
            cost <strong className="text-emerald-700">{money(expected.human.cost)}</strong>
          </span>
        </div>
      )}
    </Card>
  )
}
