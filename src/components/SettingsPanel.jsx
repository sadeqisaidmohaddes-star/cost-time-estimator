import { Collapsible, NumberField, TextField, Field, Tooltip } from './ui.jsx'
import { COMPLEXITY_LEVELS } from '../lib/defaults.js'

export default function SettingsPanel({ state, update }) {
  return (
    <Collapsible
      title="All assumptions & settings (advanced)"
      tip="Every global multiplier and lookup table lives here. Nothing in this app is a hidden magic number — edit any of these and the whole comparison updates."
    >
      <div className="space-y-6">
        <ComplexityMap state={state} update={update} />
        <Cocomo state={state} update={update} />
        <Regions state={state} update={update} />
        <p className="text-[11px] text-slate-400">
          Per-area LOC, token factors, model/subscription prices, salaries, velocities, oversight and buffers are edited
          directly in their panels above — they are settings too, just placed where you use them.
        </p>
      </div>
    </Collapsible>
  )
}

function ComplexityMap({ state, update }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        Complexity → LOC ranges (three-point)
        <Tooltip text="Defaults for each complexity preset. These are rough industry-flavored buckets, not authoritative — tune them to your codebase." />
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Level</th>
              <th className="py-1 text-right font-medium">Optimistic</th>
              <th className="py-1 text-right font-medium">Most likely</th>
              <th className="py-1 text-right font-medium">Pessimistic</th>
            </tr>
          </thead>
          <tbody>
            {COMPLEXITY_LEVELS.map((lvl) => {
              const c = state.complexityMap[lvl] || { o: 0, m: 0, p: 0 }
              return (
                <tr key={lvl} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 text-slate-700">{lvl}</td>
                  {['o', 'm', 'p'].map((k) => (
                    <td key={k} className="py-1.5">
                      <NumberField
                        value={c[k]}
                        min={0}
                        onChange={(v) => update((d) => (d.complexityMap[lvl][k] = v))}
                        className="text-right"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cocomo({ state, update }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        COCOMO (Basic) constants
        <Tooltip text="Effort(person-months) = a × KLOC^b · Schedule(months) = c × Effort^d. Boehm's classic Organic / Semi-detached / Embedded coefficients." />
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Mode</th>
              <th className="py-1 text-right font-medium">a</th>
              <th className="py-1 text-right font-medium">b</th>
              <th className="py-1 text-right font-medium">c</th>
              <th className="py-1 text-right font-medium">d</th>
            </tr>
          </thead>
          <tbody>
            {state.human.cocomoModes.map((m, i) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="py-1.5 pr-2 text-slate-700">{m.name}</td>
                {['a', 'b', 'c', 'd'].map((k) => (
                  <td key={k} className="py-1.5">
                    <NumberField
                      value={m[k]}
                      min={0}
                      onChange={(v) => update((d) => (d.human.cocomoModes[i][k] = v))}
                      className="text-right"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Regions({ state, update }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        Regional salary modifiers
        <Tooltip text="Multipliers applied to the US base salary. Editable estimates — real markets vary widely. Remote-global commonly ranges 0.7–0.9×." />
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.human.regions.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2">
            <TextField value={r.name} onChange={(v) => update((d) => (d.human.regions[i].name = v))} className="flex-1" />
            <NumberField value={r.mod} min={0} suffix="×" onChange={(v) => update((d) => (d.human.regions[i].mod = v))} className="w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
