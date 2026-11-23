import { mmss } from '../lib/format';

export interface Recipe {
  title: string; coffeeName: string; method: string; doseGrams: number; waterGrams: number; waterTempC: number; grindSize: string; brewTimeSeconds: number;
  steps: { instruction: string; atSeconds: number }[]; adjustments: string[]; rationale: string;
}

export default function RecipeCard({ r }: { r: Recipe }) {
  const stat = (k: string, v: string) => <div className="border-t border-espresso/20 pt-3"><dt className="text-sm text-roast">{k}</dt><dd className="mt-1 font-serif text-3xl">{v}</dd></div>;
  return (
    <article className="border border-espresso/20 bg-white/50 p-6 md:p-10">
      <p className="text-sm text-roast">{r.coffeeName} · {r.method}</p>
      <h2 className="display mt-2 text-4xl md:text-6xl">{r.title}</h2>
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-5">
        {stat('Coffee', `${r.doseGrams} g`)}{stat(r.method === 'Espresso' ? 'Yield' : 'Water', `${r.waterGrams} g`)}{stat('Temperature', `${r.waterTempC}°C`)}{stat('Brew time', mmss(r.brewTimeSeconds))}{stat('Grind', r.grindSize)}
      </dl>
      <h3 className="mt-10 text-2xl">Method</h3>
      <ol className="mt-3">{r.steps.map((s, i) => <li key={i} className="flex gap-5 border-t border-espresso/15 py-3"><span className="w-12 shrink-0 text-sm tabular-nums text-roast">{mmss(s.atSeconds)}</span><span>{s.instruction}</span></li>)}</ol>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div><h3 className="text-2xl">Adjust to taste</h3><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{r.adjustments.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
        <div><h3 className="text-2xl">Why this recipe</h3><p className="mt-3 text-sm leading-relaxed">{r.rationale}</p></div>
      </div>
    </article>
  );
}
