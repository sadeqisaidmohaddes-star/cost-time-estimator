// Number / currency formatting helpers. All display-only — calculations stay in raw numbers.

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const num0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

function isBad(n) {
  return n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)
}

// Money. Small amounts get cents; large amounts are rounded to whole dollars.
export function money(n) {
  if (isBad(n)) return '—'
  if (n !== 0 && Math.abs(n) < 100) return usd2.format(n)
  return usd0.format(n)
}

// Compact money for chart axes / tight spaces: $1.2k, $3.4M.
export function moneyCompact(n) {
  if (isBad(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${num1.format(abs / 1_000_000)}M`
  if (abs >= 1_000) return `${sign}$${num1.format(abs / 1_000)}k`
  return `${sign}$${num0.format(abs)}`
}

export function integer(n) {
  if (isBad(n)) return '—'
  return num0.format(Math.round(n))
}

export function number1(n) {
  if (isBad(n)) return '—'
  return num1.format(n)
}

export function percent(n, digits = 0) {
  if (isBad(n)) return '—'
  return `${n.toFixed(digits)}%`
}

// Show a span of working days as days / weeks / months for quick reading.
// Months are derived from the configurable working-days-per-year so the unit is
// internally consistent with the cost math (no hidden calendar assumptions).
export function days(n) {
  if (isBad(n)) return '—'
  return `${num1.format(n)} d`
}

export function weeksFromDays(d) {
  if (isBad(d)) return '—'
  return `${num1.format(d / 5)} wk`
}

export function monthsFromDays(d, workingDaysPerYear) {
  if (isBad(d)) return '—'
  const daysPerMonth = (workingDaysPerYear || 230) / 12
  return `${num1.format(d / daysPerMonth)} mo`
}

// Raw month count (number), used by cost math that bills per month.
export function monthCount(d, workingDaysPerYear) {
  if (isBad(d)) return 0
  const daysPerMonth = (workingDaysPerYear || 230) / 12
  return d / daysPerMonth
}
