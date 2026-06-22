import { Card, Field, NumberField, TextField, SegToggle, Select, Button, Tooltip, Pill } from './ui.jsx'
import { areaLoc, pert } from '../lib/calc.js'
import { integer, number1 } from '../lib/format.js'
import { COMPLEXITY_LEVELS, uid, defaultComplexityMap } from '../lib/defaults.js'

export default function ProjectBreakdown({ state, update, loc }) {
  const addArea = () =>
    update((d) => {
      d.areas.push({
        id: uid('area'),
        name: 'New area',
        mode: 'complexity',
        complexity: 'Moderate',
        loc: { ...defaultComplexityMap.Moderate },
      })
    })

  const complexityOpts = COMPLEXITY_LEVELS.map((c) => ({ value: c, label: c }))

  return (
    <Card
      title="1 · Project breakdown (LOC by area)"
      subtitle="Enter lines of code per area directly, or pick a complexity preset. Every figure is a three-point estimate (Optimistic / Most likely / Pessimistic)."
      right={
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800">{integer(loc.e)}</div>
          <div className="text-[11px] text-slate-500">
            expected LOC
            <Tooltip
              width="w-72"
              text="PERT expected total = (Optimistic + 4×Most-likely + Pessimistic) / 6, summed across all areas. LOC is only a rough proxy for effort — treat every number here as approximate."
            />
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          Optimistic <strong className="text-slate-700">{integer(loc.o)}</strong>
        </span>
        <span>
          Most likely <strong className="text-slate-700">{integer(loc.m)}</strong>
        </span>
        <span>
          Pessimistic <strong className="text-slate-700">{integer(loc.p)}</strong>
        </span>
        <span>
          σ (std dev) <strong className="text-slate-700">±{integer(loc.sigma)}</strong>
          <Tooltip text="PERT standard deviation of the total = (Pessimistic − Optimistic) / 6. A rough spread of the estimate." />
        </span>
      </div>

      <div className="space-y-2">
        <div className="hidden grid-cols-12 gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 md:grid">
          <div className="col-span-3">Area</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-4">Optimistic / Likely / Pessimistic LOC</div>
          <div className="col-span-2 text-right">Expected · share</div>
          <div className="col-span-1" />
        </div>

        {state.areas.map((a) => {
          const L = areaLoc(a, state.complexityMap)
          const e = pert(L.o, L.m, L.p)
          const share = loc.e > 0 ? (e / loc.e) * 100 : 0
          return (
            <div
              key={a.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2 md:grid-cols-12"
            >
              <div className="md:col-span-3">
                <TextField value={a.name} onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.name = v)))} />
              </div>
              <div className="md:col-span-2">
                <SegToggle
                  value={a.mode}
                  onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.mode = v)))}
                  options={[
                    { value: 'complexity', label: 'Preset' },
                    { value: 'manual', label: 'Manual' },
                  ]}
                />
              </div>
              <div className="md:col-span-4">
                {a.mode === 'complexity' ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={a.complexity}
                      onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.complexity = v)))}
                      options={complexityOpts}
                      className="max-w-[10rem]"
                    />
                    <span className="text-[11px] text-slate-400">
                      {integer(L.o)} / {integer(L.m)} / {integer(L.p)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <NumberField value={a.loc.o} min={0} onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.loc.o = v)))} />
                    <NumberField value={a.loc.m} min={0} onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.loc.m = v)))} />
                    <NumberField value={a.loc.p} min={0} onChange={(v) => update((d) => setArea(d, a.id, (x) => (x.loc.p = v)))} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between md:col-span-2 md:justify-end md:gap-2">
                <span className="text-sm font-semibold text-slate-700">{integer(e)}</span>
                <Pill tone="sky">{number1(share)}%</Pill>
              </div>
              <div className="md:col-span-1 md:text-right">
                <Button
                  variant="danger"
                  onClick={() => update((d) => (d.areas = d.areas.filter((x) => x.id !== a.id)))}
                >
                  Remove
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="subtle" onClick={addArea}>
          + Add area
        </Button>
        <span className="text-[11px] text-slate-400">
          Complexity → LOC ranges are editable in “All assumptions &amp; settings” below.
        </span>
      </div>
    </Card>
  )
}

// Mutate a single area inside the draft state.
function setArea(draft, id, fn) {
  const a = draft.areas.find((x) => x.id === id)
  if (a) fn(a)
}
