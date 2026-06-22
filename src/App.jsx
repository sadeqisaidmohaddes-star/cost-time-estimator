import { useState, useMemo } from 'react'
import { makeInitialState, PRICES_LAST_CHECKED } from './lib/defaults.js'
import { computeAll } from './lib/calc.js'
import { Button } from './components/ui.jsx'
import ProjectBreakdown from './components/ProjectBreakdown.jsx'
import AiPanel from './components/AiPanel.jsx'
import HumanPanel from './components/HumanPanel.jsx'
import BufferPanel from './components/BufferPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import Results from './components/Results.jsx'
import About from './components/About.jsx'

export default function App() {
  const [state, setState] = useState(makeInitialState)

  // Deep-clone-on-write keeps updates simple and immutable without extra deps.
  const update = (mutator) =>
    setState((prev) => {
      const draft = structuredClone(prev)
      mutator(draft)
      return draft
    })

  const results = useMemo(() => computeAll(state), [state])
  const expected = results.scenarios.expected

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Project Cost &amp; Time Estimator</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Compare building a software project two ways — with AI, and with human developers — driven by a lines-of-code
                breakdown. Honest and transparent: every assumption below is visible and editable, and the comparison is not
                rigged in either direction.
              </p>
            </div>
            <Button variant="subtle" onClick={() => setState(makeInitialState())}>
              ↺ Reset to defaults
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Prices last checked: {PRICES_LAST_CHECKED}</span>
            <span className="text-amber-600">— API rates, subscription tiers and salaries change often. Edit any value to update.</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <ProjectBreakdown state={state} update={update} loc={results.loc} />

        <div className="grid gap-4 lg:grid-cols-2">
          <AiPanel state={state} update={update} expected={expected} />
          <HumanPanel state={state} update={update} expected={expected} />
        </div>

        <BufferPanel state={state} update={update} />

        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-1 shadow-sm">
          <div className="px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-800">5–6 · Three-point (PERT) results &amp; comparison</h2>
            <p className="text-xs text-slate-500">
              Best / Expected / Worst come from the optimistic, PERT-expected and pessimistic LOC totals. Base and buffered
              shown side by side.
            </p>
          </div>
          <div className="p-3">
            <Results state={state} results={results} />
          </div>
        </div>

        <SettingsPanel state={state} update={update} />
        <About />

        <footer className="pb-8 pt-2 text-center text-[11px] text-slate-400">
          All figures are rough estimates based on your own editable assumptions and on pricing/salary benchmarks verified as
          of {PRICES_LAST_CHECKED}. In-memory only — nothing is saved; reloading the page resets everything.
        </footer>
      </main>
    </div>
  )
}
