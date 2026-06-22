import { Card, Field, NumberField, TextField, SegToggle, Checkbox, Button, Tooltip, Pill } from './ui.jsx'
import { TIER_LABELS, SALARY_TIERS, uid } from '../lib/defaults.js'
import { money, integer, number1 } from '../lib/format.js'

export default function AiPanel({ state, update, expected }) {
  const ai = state.ai
  const setAi = (fn) => update((d) => fn(d.ai))

  return (
    <Card
      title="2 · Build with AI"
      subtitle="Token or subscription cost for the AI tool, PLUS the human-oversight labor that AI work always requires. Both are added together for the true AI cost."
      right={<Pill tone="sky">AI mode</Pill>}
    >
      {/* Cost sub-mode toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-slate-600">Costing method</span>
        <SegToggle
          value={ai.costMode}
          onChange={(v) => setAi((a) => (a.costMode = v))}
          options={[
            { value: 'token', label: 'Pay-per-token' },
            { value: 'subscription', label: 'Subscription' },
          ]}
        />
      </div>

      {/* Token factors */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field
          label="Input tokens / final LOC"
          tip="Tokens of prompt/context consumed per line of final code. Default ~30 — context, instructions and existing code dominate input."
        >
          <NumberField value={ai.tokensPerLocInput} min={0} onChange={(v) => setAi((a) => (a.tokensPerLocInput = v))} />
        </Field>
        <Field
          label="Output tokens / final LOC"
          tip="Tokens generated per line of final code. Default ~10. AI often produces more code than a human would for the same feature — bump your LOC estimate if you're sizing AI output specifically."
        >
          <NumberField value={ai.tokensPerLocOutput} min={0} onChange={(v) => setAi((a) => (a.tokensPerLocOutput = v))} />
        </Field>
        <Field
          label="Rework / iteration ×"
          tip="Multiplier on tokens because code is regenerated, debugged and refined across iterations. Default 3× — a single pass rarely ships."
        >
          <NumberField value={ai.reworkMultiplier} min={0} onChange={(v) => setAi((a) => (a.reworkMultiplier = v))} />
        </Field>
      </div>

      {ai.costMode === 'token' ? (
        <TokenSection ai={ai} setAi={setAi} expected={expected} />
      ) : (
        <SubscriptionSection ai={ai} setAi={setAi} expected={expected} />
      )}

      {/* Speed */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">AI speed</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field
            label="Productivity × vs human"
            tip="AI effective velocity = human baseline velocity × this multiplier. Default 1.5×. Controlled studies range from ~0.8× (slower) to ~2× depending on task and developer; headline '10×' claims are not supported by controlled trials, and developers consistently overestimate their own speedup."
          >
            <NumberField value={ai.productivityMultiplier} min={0} onChange={(v) => setAi((a) => (a.productivityMultiplier = v))} />
          </Field>
          <Field
            label="AI work streams"
            tip="How many AI-assisted streams run in parallel. Time = total LOC ÷ (streams × effective velocity)."
          >
            <NumberField value={ai.aiTeamSize} min={0} onChange={(v) => setAi((a) => (a.aiTeamSize = v))} />
          </Field>
        </div>
      </div>

      {/* Oversight (required) */}
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <h3 className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wide text-amber-700">
          Human oversight (always added)
          <Tooltip text="AI does not run itself. Supervising, reviewing, integrating and fixing AI output is real labor. This cost is added to the token/subscription cost for the true AI total — it is never hidden." />
        </h3>
        <p className="mb-3 text-[11px] text-amber-700/80">
          Default ≈ 0.5 of one mid-level developer. Cost = people × % time × fully-loaded monthly salary × project months.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="People" tip="Headcount supervising/reviewing AI. Can be fractional, e.g. 0.5.">
            <NumberField value={ai.oversightPeople} min={0} onChange={(v) => setAi((a) => (a.oversightPeople = v))} />
          </Field>
          <Field label="Seniority tier" tip="Which salary tier the overseers are paid at. Salaries are set in the Build-with-humans panel.">
            <select
              value={ai.oversightTier}
              onChange={(e) => setAi((a) => (a.oversightTier = e.target.value))}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {SALARY_TIERS.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="% of their time" tip="Share of the overseers' time spent on this project (0–100%).">
            <NumberField
              value={Math.round(ai.oversightTimeFraction * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => setAi((a) => (a.oversightTimeFraction = v / 100))}
            />
          </Field>
        </div>
      </div>

      {/* Live preview */}
      {expected && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">Expected total (AI):</span>
          <span>
            {ai.costMode === 'token' ? 'tokens' : 'subscription'}{' '}
            <strong className="text-slate-800">{money(expected.ai.toolCost)}</strong>
          </span>
          <span>+</span>
          <span>
            oversight <strong className="text-slate-800">{money(expected.ai.oversightCost)}</strong>
          </span>
          <span>=</span>
          <span className="font-semibold text-sky-700">{money(expected.ai.totalCost)}</span>
        </div>
      )}
    </Card>
  )
}

function TokenSection({ ai, setAi, expected }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Model prices (USD / million tokens)
        </h3>
        <Button
          variant="subtle"
          onClick={() => setAi((a) => a.models.push({ id: uid('model'), name: 'New model', in: 1, out: 5 }))}
        >
          + Add model
        </Button>
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <div className="col-span-1" />
          <div className="col-span-5">Model</div>
          <div className="col-span-3">Input $/MTok</div>
          <div className="col-span-2">Output $/MTok</div>
          <div className="col-span-1" />
        </div>
        {ai.models.map((m) => (
          <div key={m.id} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-1 flex justify-center">
              <input
                type="radio"
                name="ai-model"
                checked={ai.selectedModelId === m.id}
                onChange={() => setAi((a) => (a.selectedModelId = m.id))}
                className="h-4 w-4 text-sky-600 focus:ring-sky-400"
              />
            </div>
            <div className="col-span-5">
              <TextField value={m.name} onChange={(v) => setAi((a) => mutById(a.models, m.id, (x) => (x.name = v)))} />
            </div>
            <div className="col-span-3">
              <NumberField value={m.in} min={0} prefix="$" onChange={(v) => setAi((a) => mutById(a.models, m.id, (x) => (x.in = v)))} />
            </div>
            <div className="col-span-2">
              <NumberField value={m.out} min={0} prefix="$" onChange={(v) => setAi((a) => mutById(a.models, m.id, (x) => (x.out = v)))} />
            </div>
            <div className="col-span-1 text-right">
              {ai.models.length > 1 && (
                <Button variant="danger" onClick={() => setAi((a) => (a.models = a.models.filter((x) => x.id !== m.id)))}>
                  ✕
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cost levers */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-2.5">
          <Checkbox
            checked={ai.batchEnabled}
            onChange={(v) => setAi((a) => (a.batchEnabled = v))}
            label="Batch processing"
            tip="Many APIs offer batch/async pricing at roughly half cost. Off by default so the comparison isn't pre-discounted."
          />
          <div className="mt-2">
            <Field label="Batch discount" tip="Fraction off all tokens when batching. Default 50%.">
              <NumberField
                value={Math.round(ai.batchDiscount * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => setAi((a) => (a.batchDiscount = v / 100))}
              />
            </Field>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-2.5">
          <Checkbox
            checked={ai.cachingEnabled}
            onChange={(v) => setAi((a) => (a.cachingEnabled = v))}
            label="Prompt caching"
            tip="Cached input tokens (reused context) can cost up to 90% less. Applies only to the cached portion of input. Off by default."
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Cache discount" tip="Max discount on cached input tokens. Default 90%.">
              <NumberField
                value={Math.round(ai.cacheDiscount * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => setAi((a) => (a.cacheDiscount = v / 100))}
              />
            </Field>
            <Field label="% input cached" tip="Share of input tokens served from cache.">
              <NumberField
                value={Math.round(ai.cachedFraction * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => setAi((a) => (a.cachedFraction = v / 100))}
              />
            </Field>
          </div>
        </div>
      </div>

      {expected && (
        <div className="mt-2 text-[11px] text-slate-500">
          Expected token volume: {integer(expected.ai.tokens.inTok)} in / {integer(expected.ai.tokens.outTok)} out
          {' · '}input {money(expected.ai.tokens.inCost)} + output {money(expected.ai.tokens.outCost)}
        </div>
      )}
    </div>
  )
}

function SubscriptionSection({ ai, setAi, expected }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Subscription plans (USD / month)
          <Tooltip text="Subscription cost = monthly price × seats (for per-seat plans) × number of months from the AI time estimate." />
        </h3>
        <div className="flex items-center gap-2">
          <Field label="Seats">
            <NumberField value={ai.seats} min={1} onChange={(v) => setAi((a) => (a.seats = v))} className="w-16" />
          </Field>
          <Button
            variant="subtle"
            onClick={() => setAi((a) => a.plans.push({ id: uid('plan'), name: 'New plan', price: 20, perSeat: false }))}
          >
            + Add plan
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <div className="col-span-1" />
          <div className="col-span-6">Plan</div>
          <div className="col-span-2">$/month</div>
          <div className="col-span-2">Per seat</div>
          <div className="col-span-1" />
        </div>
        {ai.plans.map((p) => (
          <div key={p.id} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-1 flex justify-center">
              <input
                type="radio"
                name="ai-plan"
                checked={ai.selectedPlanId === p.id}
                onChange={() => setAi((a) => (a.selectedPlanId = p.id))}
                className="h-4 w-4 text-sky-600 focus:ring-sky-400"
              />
            </div>
            <div className="col-span-6">
              <TextField value={p.name} onChange={(v) => setAi((a) => mutById(a.plans, p.id, (x) => (x.name = v)))} />
            </div>
            <div className="col-span-2">
              <NumberField value={p.price} min={0} prefix="$" onChange={(v) => setAi((a) => mutById(a.plans, p.id, (x) => (x.price = v)))} />
            </div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                checked={p.perSeat}
                onChange={(e) => setAi((a) => mutById(a.plans, p.id, (x) => (x.perSeat = e.target.checked)))}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
            </div>
            <div className="col-span-1 text-right">
              {ai.plans.length > 1 && (
                <Button variant="danger" onClick={() => setAi((a) => (a.plans = a.plans.filter((x) => x.id !== p.id)))}>
                  ✕
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {expected && (
        <div className="mt-2 text-[11px] text-slate-500">
          Expected: {number1(expected.ai.months)} months × subscription = {money(expected.ai.subCost)}
        </div>
      )}
    </div>
  )
}

// Mutate an array item by id inside the draft.
function mutById(arr, id, fn) {
  const it = arr.find((x) => x.id === id)
  if (it) fn(it)
}
