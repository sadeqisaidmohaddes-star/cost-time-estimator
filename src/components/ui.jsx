import { useState } from 'react'

// ---------------------------------------------------------------------------
// Small reusable UI primitives. Kept deliberately plain so every assumption in
// the app is an obvious, editable form control.
// ---------------------------------------------------------------------------

// Info tooltip (ⓘ). Opens on hover, focus, or click (touch-friendly).
export function Tooltip({ text, children, width = 'w-72' }) {
  const [open, setOpen] = useState(false)
  const content = text || children
  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label="More information"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute left-1/2 top-full z-50 mt-2 ${width} -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-slate-600 shadow-lg`}
        >
          {content}
        </span>
      )}
    </span>
  )
}

export function Card({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Field({ label, tip, children, hint }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center text-xs font-medium text-slate-600">
        {label}
        {tip && <Tooltip text={tip} />}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'

// Number input that tolerates empty/partial entry without fighting the cursor.
export function NumberField({ value, onChange, step = 'any', min, max, className = '', prefix, suffix }) {
  const [focused, setFocused] = useState(false)
  const [local, setLocal] = useState('')
  const display = focused ? local : Number.isFinite(value) ? String(value) : ''
  const input = (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={display}
      onFocus={() => {
        setFocused(true)
        setLocal(Number.isFinite(value) ? String(value) : '')
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const v = e.target.value
        setLocal(v)
        // Coerce empty/partial entries to 0, then make the advisory min/max
        // authoritative so negative or out-of-range values can never reach the
        // cost math (which would otherwise render nonsensical "-$1,234" figures).
        let n = v === '' || v === '-' || v === '.' ? 0 : Number(v)
        if (!Number.isFinite(n)) n = 0
        if (Number.isFinite(min) && n < min) n = min
        if (Number.isFinite(max) && n > max) n = max
        onChange(n)
      }}
      className={`${inputBase} ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-8' : ''} ${className}`}
    />
  )
  if (!prefix && !suffix) return input
  return (
    <span className="relative block">
      {prefix && <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefix}</span>}
      {input}
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
    </span>
  )
}

export function TextField({ value, onChange, className = '', placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${className}`}
    />
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputBase} ${className}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Checkbox({ checked, onChange, label, tip }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
      />
      <span className="flex items-center">
        {label}
        {tip && <Tooltip text={tip} />}
      </span>
    </label>
  )
}

// Two-state segmented toggle.
export function SegToggle({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            value === o.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Button({ children, onClick, variant = 'default', className = '', type = 'button' }) {
  const variants = {
    default: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700',
    danger: 'border-transparent bg-transparent text-rose-500 hover:bg-rose-50',
    subtle: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Collapsible({ title, defaultOpen = false, children, tip }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left select-none"
      >
        <span className="flex items-center text-sm font-semibold text-slate-800">
          {title}
          {tip && <Tooltip text={tip} />}
        </span>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </div>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </section>
  )
}

export function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}
