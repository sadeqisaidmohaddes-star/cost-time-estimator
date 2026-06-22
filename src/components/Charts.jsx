import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { bufferedScenario } from '../lib/calc.js'
import { moneyCompact, money, integer } from '../lib/format.js'

const SCEN_COLORS = { Best: '#10b981', Expected: '#f59e0b', Worst: '#f43f5e' }

export default function Charts({ results, buffer }) {
  const { scenarios } = results
  const ai = {
    Best: bufferedScenario(scenarios.best, 'ai', buffer),
    Expected: bufferedScenario(scenarios.expected, 'ai', buffer),
    Worst: bufferedScenario(scenarios.worst, 'ai', buffer),
  }
  const hu = {
    Best: bufferedScenario(scenarios.best, 'human', buffer),
    Expected: bufferedScenario(scenarios.expected, 'human', buffer),
    Worst: bufferedScenario(scenarios.worst, 'human', buffer),
  }

  const costData = [
    { name: 'AI', Best: safe(ai.Best.costBuffered), Expected: safe(ai.Expected.costBuffered), Worst: safe(ai.Worst.costBuffered) },
    { name: 'Humans', Best: safe(hu.Best.costBuffered), Expected: safe(hu.Expected.costBuffered), Worst: safe(hu.Worst.costBuffered) },
  ]
  const timeData = [
    { name: 'AI', Best: safe(ai.Best.daysBuffered), Expected: safe(ai.Expected.daysBuffered), Worst: safe(ai.Worst.daysBuffered) },
    { name: 'Humans', Best: safe(hu.Best.daysBuffered), Expected: safe(hu.Expected.daysBuffered), Worst: safe(hu.Worst.daysBuffered) },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Cost — buffered (Best / Expected / Worst)"
        data={costData}
        fmtAxis={moneyCompact}
        fmtTip={money}
      />
      <ChartCard
        title="Time — buffered, in working days"
        data={timeData}
        fmtAxis={(v) => `${integer(v)}d`}
        fmtTip={(v) => `${integer(v)} days`}
      />
    </div>
  )
}

function ChartCard({ title, data, fmtAxis, fmtTip }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} width={56} />
            <RTooltip
              formatter={(v) => fmtTip(v)}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {['Best', 'Expected', 'Worst'].map((k) => (
              <Bar key={k} dataKey={k} fill={SCEN_COLORS[k]} radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                <LabelList dataKey={k} position="top" formatter={fmtAxis} style={{ fontSize: 10, fill: '#64748b' }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function safe(n) {
  return Number.isFinite(n) ? n : 0
}
