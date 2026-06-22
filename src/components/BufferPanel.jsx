import { Card, Field, NumberField, Checkbox, Tooltip, Pill } from './ui.jsx'

export default function BufferPanel({ state, update }) {
  const b = state.buffer
  const setB = (fn) => update((d) => fn(d.buffer))

  return (
    <Card
      title="4 · Buffer / contingency"
      subtitle="A simple risk margin on top of the base estimate. Separate percentages for AI and humans because they carry different risk profiles. The PERT Best/Expected/Worst view (below) is the richer uncertainty model — this is the simpler fallback."
      right={<Pill tone="amber">Risk margin</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
          <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-sky-700">
            AI buffer
            <Tooltip text="Default 25%. AI estimates carry extra uncertainty from variable rework, integration surprises and prompt iteration." />
          </h3>
          <Field label="Contingency %">
            <NumberField value={b.aiPercent} min={0} suffix="%" onChange={(v) => setB((x) => (x.aiPercent = v))} />
          </Field>
          <div className="mt-2 flex flex-col gap-1.5">
            <Checkbox checked={b.aiApplyTime} onChange={(v) => setB((x) => (x.aiApplyTime = v))} label="Apply to time" />
            <Checkbox checked={b.aiApplyCost} onChange={(v) => setB((x) => (x.aiApplyCost = v))} label="Apply to cost" />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
          <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Human buffer
            <Tooltip text="Default 20%. The classic contingency margin for software schedules." />
          </h3>
          <Field label="Contingency %">
            <NumberField value={b.humanPercent} min={0} suffix="%" onChange={(v) => setB((x) => (x.humanPercent = v))} />
          </Field>
          <div className="mt-2 flex flex-col gap-1.5">
            <Checkbox checked={b.humanApplyTime} onChange={(v) => setB((x) => (x.humanApplyTime = v))} label="Apply to time" />
            <Checkbox checked={b.humanApplyCost} onChange={(v) => setB((x) => (x.humanApplyCost = v))} label="Apply to cost" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Base and buffered figures are always shown side by side in the results so you can see exactly what the margin adds.
      </p>
    </Card>
  )
}
