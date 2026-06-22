import { Card, Tooltip, Pill } from './ui.jsx'
import Charts from './Charts.jsx'
import { bufferedScenario } from '../lib/calc.js'
import { money, integer, number1, weeksFromDays, monthsFromDays } from '../lib/format.js'

export default function Results({ state, results }) {
  const { scenarios, headline, loc, areas, model, plan } = results
  const wdy = state.human.workingDaysPerYear
  const buffer = state.buffer

  return (
    <div className="space-y-4">
      <ComparisonBanner headline={headline} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryCard
          side="ai"
          title="Build with AI"
          tone="sky"
          subtitle={state.ai.costMode === 'token' ? `Pay-per-token · ${model?.name || '—'}` : `Subscription · ${plan?.name || '—'}`}
          scenarios={scenarios}
          buffer={buffer}
          wdy={wdy}
        />
        <SummaryCard
          side="human"
          title="Build with humans"
          tone="green"
          subtitle={`${integer(totalDevs(state))} dev(s)${state.human.cocomoEnabled ? ' · COCOMO shown' : ''}`}
          scenarios={scenarios}
          buffer={buffer}
          wdy={wdy}
          cocomo={state.human.cocomoEnabled ? scenarios : null}
        />
      </div>

      <Charts results={results} buffer={buffer} />

      <BreakdownTable areas={areas} loc={loc} cocomoEnabled={state.human.cocomoEnabled} scenarios={scenarios} />
    </div>
  )
}

function totalDevs(state) {
  return ['Junior', 'Mid', 'Senior', 'Staff'].reduce((s, t) => s + (Number(state.human.team[t]) || 0), 0)
}

// ---- Headline cheaper/faster comparison ----
function ComparisonBanner({ headline }) {
  const aiCost = headline.ai.costBuffered
  const huCost = headline.human.costBuffered
  const aiTime = headline.ai.timeBuffered
  const huTime = headline.human.timeBuffered

  const cost = compare(aiCost, huCost)
  const time = compare(aiTime, huTime)

  return (
    <Card
      title="Headline comparison"
      subtitle="Using buffered, Expected (PERT) figures. Positive = the named option wins on that metric."
      right={<Pill tone="slate">buffered · expected</Pill>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Verdict
          label="Cheaper"
          icon="$"
          winner={cost.winner}
          deltaAbs={cost.abs == null ? null : money(cost.abs)}
          deltaPct={cost.pct}
          deltaWord="cheaper"
          loserNote={cost.winner ? `${money(Math.min(aiCost, huCost))} vs ${money(Math.max(aiCost, huCost))}` : null}
        />
        <Verdict
          label="Faster"
          icon="⏱"
          winner={time.winner}
          deltaAbs={time.abs == null ? null : `${integer(time.abs)} days`}
          deltaPct={time.pct}
          deltaWord="faster"
          loserNote={time.winner ? `${integer(Math.min(aiTime, huTime))} vs ${integer(Math.max(aiTime, huTime))} days` : null}
        />
      </div>
    </Card>
  )
}

// Returns the winner label ('AI'|'Humans'|null tie/unknown), absolute and % delta.
function compare(aiVal, huVal) {
  if (!Number.isFinite(aiVal) || !Number.isFinite(huVal)) return { winner: null, abs: null, pct: null }
  if (aiVal === huVal) return { winner: 'Tie', abs: 0, pct: 0 }
  const aiWins = aiVal < huVal
  const winner = aiWins ? 'AI' : 'Humans'
  const lo = Math.min(aiVal, huVal)
  const hi = Math.max(aiVal, huVal)
  const abs = hi - lo
  const pct = hi > 0 ? (abs / hi) * 100 : null
  return { winner, abs, pct }
}

function Verdict({ label, icon, winner, deltaAbs, deltaPct, deltaWord = 'less', loserNote }) {
  const tone = winner === 'AI' ? 'sky' : winner === 'Humans' ? 'green' : 'slate'
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      {winner == null ? (
        <div className="mt-1 text-sm text-slate-400">Not enough input (set a team / velocity).</div>
      ) : winner === 'Tie' ? (
        <div className="mt-1 text-sm font-semibold text-slate-600">Effectively equal</div>
      ) : (
        <>
          <div className="mt-1 flex items-baseline gap-2">
            <Pill tone={tone}>{winner} win</Pill>
            <span className="text-lg font-bold text-slate-800">{deltaAbs}</span>
            {deltaPct != null && <span className="text-sm font-medium text-slate-500">({number1(deltaPct)}% {deltaWord})</span>}
          </div>
          {loserNote && <div className="mt-0.5 text-[11px] text-slate-400">{loserNote}</div>}
        </>
      )}
    </div>
  )
}

// ---- Per-side summary card ----
function SummaryCard({ side, title, tone, subtitle, scenarios, buffer, wdy, cocomo }) {
  const rows = ['best', 'expected', 'worst'].map((key) => ({
    key,
    label: key === 'best' ? 'Best' : key === 'expected' ? 'Expected' : 'Worst',
    buf: bufferedScenario(scenarios[key], side, buffer),
  }))
  const expected = scenarios.expected
  const itemize = side === 'ai' ? expected.ai : null

  return (
    <Card title={title} subtitle={subtitle} right={<Pill tone={tone}>{side === 'ai' ? 'AI' : 'Humans'}</Pill>}>
      {/* Headline expected */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Headline
          label="Expected cost"
          base={side === 'ai' ? expected.ai.totalCost : expected.human.cost}
          buffered={rows[1].buf.costBuffered}
          fmt={money}
        />
        <Headline
          label="Expected time"
          base={side === 'ai' ? expected.ai.days : expected.human.days}
          buffered={rows[1].buf.daysBuffered}
          fmt={(v) => `${integer(v)} d`}
          sub={(v) => `${weeksFromDays(v)} · ${monthsFromDays(v, wdy)}`}
        />
      </div>

      {/* AI itemization */}
      {itemize && (
        <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs">
          <div className="mb-1 font-medium text-sky-800">True AI cost = tool + oversight (Expected, base)</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
            <span>{itemize.toolCost != null ? money(itemize.toolCost) : '—'} tool</span>
            <span className="text-slate-400">+</span>
            <span>{money(itemize.oversightCost)} oversight</span>
            <span className="text-slate-400">=</span>
            <strong className="text-sky-700">{money(itemize.totalCost)}</strong>
          </div>
        </div>
      )}

      {/* Scenario table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Scenario</th>
              <th className="py-1 text-right font-medium">Time base</th>
              <th className="py-1 text-right font-medium">Time +buf</th>
              <th className="py-1 text-right font-medium">Cost base</th>
              <th className="py-1 text-right font-medium">Cost +buf</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={`border-t border-slate-100 ${r.key === 'expected' ? 'bg-slate-50/60 font-medium' : ''}`}>
                <td className="py-1.5 text-slate-600">{r.label}</td>
                <td className="py-1.5 text-right text-slate-500">{fmtDays(r.buf.daysBase)}</td>
                <td className="py-1.5 text-right text-slate-700">{fmtDays(r.buf.daysBuffered)}</td>
                <td className="py-1.5 text-right text-slate-500">{money(r.buf.costBase)}</td>
                <td className="py-1.5 text-right text-slate-700">{money(r.buf.costBuffered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COCOMO comparison (human side) */}
      {cocomo && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-[11px] text-slate-600">
          <div className="mb-1 flex items-center font-medium text-slate-700">
            COCOMO vs simple (Expected)
            <Tooltip text="COCOMO estimates effort and a prescribed schedule from KLOC. It often diverges from the simple team-velocity estimate — that divergence is the point of showing both." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              Simple: <strong>{money(cocomo.expected.human.cost)}</strong> · {integer(cocomo.expected.human.days)} d
            </div>
            <div>
              COCOMO: <strong>{money(cocomo.expected.human.cocomo.cost)}</strong> ·{' '}
              {integer(cocomo.expected.human.cocomo.effort)} pm · {integer(cocomo.expected.human.cocomo.months)} mo
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function Headline({ label, base, buffered, fmt, sub }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-slate-800">{Number.isFinite(buffered) ? fmt(buffered) : '—'}</div>
      <div className="text-[11px] text-slate-500">
        base {Number.isFinite(base) ? fmt(base) : '—'}
        {sub && Number.isFinite(buffered) ? ` · ${sub(buffered)}` : ''}
      </div>
    </div>
  )
}

function fmtDays(v) {
  return Number.isFinite(v) ? `${integer(v)} d` : '—'
}

// ---- Per-area breakdown ----
function BreakdownTable({ areas, loc, cocomoEnabled, scenarios }) {
  return (
    <Card title="Breakdown by area" subtitle="Three-point LOC and each area's share of the expected total.">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Area</th>
              <th className="py-1 text-left font-medium">Source</th>
              <th className="py-1 text-right font-medium">Optimistic</th>
              <th className="py-1 text-right font-medium">Likely</th>
              <th className="py-1 text-right font-medium">Pessimistic</th>
              <th className="py-1 text-right font-medium">Expected</th>
              <th className="py-1 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-700">{a.name}</td>
                <td className="py-1.5 text-slate-400">{a.mode === 'complexity' ? a.complexity : 'manual'}</td>
                <td className="py-1.5 text-right text-slate-500">{integer(a.loc.o)}</td>
                <td className="py-1.5 text-right text-slate-500">{integer(a.loc.m)}</td>
                <td className="py-1.5 text-right text-slate-500">{integer(a.loc.p)}</td>
                <td className="py-1.5 text-right font-medium text-slate-700">{integer(a.loc.e)}</td>
                <td className="py-1.5 text-right text-slate-500">{number1(a.contributionPct)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
              <td className="py-1.5">Total</td>
              <td />
              <td className="py-1.5 text-right">{integer(loc.o)}</td>
              <td className="py-1.5 text-right">{integer(loc.m)}</td>
              <td className="py-1.5 text-right">{integer(loc.p)}</td>
              <td className="py-1.5 text-right">{integer(loc.e)}</td>
              <td className="py-1.5 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {cocomoEnabled && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600">
          <div className="mb-1 font-medium text-slate-700">Human method comparison (Expected)</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              Simple (LOC ÷ velocity): <strong>{money(scenarios.expected.human.cost)}</strong> ·{' '}
              {integer(scenarios.expected.human.days)} days
            </div>
            <div>
              COCOMO ({scenarios.expected.human.cocomo.modeName}):{' '}
              <strong>{money(scenarios.expected.human.cocomo.cost)}</strong> ·{' '}
              {integer(scenarios.expected.human.cocomo.effort)} person-months ·{' '}
              {integer(scenarios.expected.human.cocomo.months)} months schedule
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
