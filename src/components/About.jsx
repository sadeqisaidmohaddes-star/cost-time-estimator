import { Collapsible } from './ui.jsx'

export default function About() {
  return (
    <Collapsible title="About these estimates — read before relying on any number" defaultOpen={false}>
      <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
        <li>
          <strong className="text-slate-800">LOC is a weak proxy for effort and value.</strong> Two features with the same
          line count can differ wildly in difficulty. Treat every output here as a rough order-of-magnitude, not a quote.
        </li>
        <li>
          <strong className="text-slate-800">AI productivity gains are real but contested and highly task-dependent.</strong>{' '}
          Controlled studies range from slightly negative (AI made experienced developers a bit slower on familiar code) to
          roughly 2× on greenfield or boilerplate work. Developers consistently overestimate their own speedup. The default
          1.5× multiplier is deliberately modest — avoid headline “10×” assumptions, which controlled trials do not support.
        </li>
        <li>
          <strong className="text-slate-800">AI-generated code still needs human review and integration.</strong> That labor
          is added on purpose as the “human oversight” line, and it is never hidden inside the AI total.
        </li>
        <li>
          <strong className="text-slate-800">AI tends to generate more code than humans</strong> for the same feature. If you
          are sizing AI output specifically, bump the LOC estimates upward.
        </li>
        <li>
          <strong className="text-slate-800">Token, subscription and salary numbers change frequently.</strong> The pre-filled
          values were verified around June 2026. Re-verify and edit them before relying on any figure.
        </li>
        <li>
          <strong className="text-slate-800">Two methods are better than one.</strong> The simple LOC ÷ velocity estimate and
          Basic COCOMO use different assumptions and will diverge. When they disagree by a lot, your real uncertainty is
          larger than either number suggests.
        </li>
      </ul>
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Disclaimer: all figures are rough estimates based on your own editable assumptions and on pricing/salary benchmarks
        verified as of June 2026. Nothing here is financial advice or a fixed quote.
      </p>
    </Collapsible>
  )
}
