import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/auth';
import { api } from '../lib/api';
import RecipeCard, { Recipe } from '../components/RecipeCard';
import { ErrorState, Seo, Skeleton } from '../components/ui';

const FLAVORS = ['Bright and fruity', 'Sweet and balanced', 'Rich and chocolatey', 'Floral and delicate', 'Bold and earthy'];
const EQUIP = ['Gooseneck kettle', 'Burr grinder', 'Kitchen scale', 'Timer'];
interface Opts { coffees: { id: string; name: string; origin: string; roast: string; flavorNotes: string[] }[]; methods: string[] }

export default function Barista() {
  const [sp] = useSearchParams();
  const { data, loading, error, reload } = useApi<Opts>('/barista/options');
  const { user } = useAuth();
  const [coffeeId, setCoffeeId] = useState(sp.get('coffee') ?? '');
  const [generic, setGeneric] = useState(false);
  const [gRoast, setGRoast] = useState('Medium');
  const [method, setMethod] = useState(sp.get('method') ?? '');
  const [cups, setCups] = useState(2);
  const [flavor, setFlavor] = useState(FLAVORS[1]);
  const [strength, setStrength] = useState<'light' | 'balanced' | 'strong'>('balanced');
  const [equipment, setEquipment] = useState<string[]>(['Kitchen scale']);
  const [exp, setExp] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ recipe: Recipe; coffeeId?: string } | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle');
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => { if (data && method && !data.methods.includes(method)) setMethod(''); }, [data, method]);
  const ready = (generic || coffeeId) && method;

  const generate = async () => {
    setBusy(true); setErr(''); setSaved('idle'); setSaveErr('');
    try {
      const body: any = { method, cups, flavorProfile: flavor, strength, equipment, experience: exp };
      if (generic) body.generic = { roast: gRoast }; else body.coffeeId = coffeeId;
      setResult(await api('/barista/recipe', { method: 'POST', body }));
      setTimeout(() => document.getElementById('recipe')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!result) return;
    setSaved('saving'); setSaveErr('');
    try {
      await api('/recipes', { method: 'POST', role: 'customer', body: { recipe: result.recipe, coffeeId: result.coffeeId, preferences: { cups, flavorProfile: flavor, strength, equipment, experience: exp } } });
      setSaved('done');
    } catch (e: any) { setSaved('idle'); setSaveErr(e.message); }
  };
  const chip = (on: boolean) => `border px-4 py-2.5 text-sm transition-colors ${on ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/30 hover:border-espresso'}`;
  const step = (n: string, t: string) => <h2 className="mb-4 text-3xl"><span className="mr-3 text-roast">{n}</span>{t}</h2>;

  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="AI Barista" description="A personalised brewing recipe for your coffee, your method and your equipment." />
      <h1 className="display max-w-4xl text-6xl md:text-8xl">Your coffee. Your ritual. Your perfect brew.</h1>
      {loading ? <Skeleton className="mt-12 h-96" /> : error || !data ? <div className="mt-12"><ErrorState message={error ?? ''} onRetry={reload} /></div> : (
        <div className="mt-14 grid gap-14 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-7">
            <section>{step('1', 'Choose your coffee')}
              <div className="flex gap-2"><button className={chip(!generic)} onClick={() => setGeneric(false)}>ORIGIN catalogue</button><button className={chip(generic)} onClick={() => setGeneric(true)}>Coffee from elsewhere</button></div>
              {!generic ? (
                data.coffees.length === 0 ? <p className="mt-4 text-roast">No coffees are available yet.</p> :
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{data.coffees.map((c) => (
                  <button key={c.id} aria-pressed={coffeeId === c.id} onClick={() => setCoffeeId(c.id)} className={`border p-4 text-left transition-colors ${coffeeId === c.id ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/30 hover:border-espresso'}`}>
                    <span className="font-serif text-2xl">{c.name}</span><span className="mt-1 block text-sm opacity-75">{c.origin} · {c.roast} · {c.flavorNotes.join(', ')}</span></button>))}</div>
              ) : <label className="mt-4 block max-w-xs"><span className="mb-1.5 block text-sm text-roast">Roast level</span><select className="field" value={gRoast} onChange={(e) => setGRoast(e.target.value)}>{['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'].map((r) => <option key={r}>{r}</option>)}</select></label>}
            </section>
            <section>{step('2', 'Choose a method')}<div className="flex flex-wrap gap-2">{data.methods.map((m) => <button key={m} aria-pressed={method === m} className={chip(method === m)} onClick={() => setMethod(m)}>{m}</button>)}</div></section>
            <section>{step('3', 'Set your preferences')}
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm text-roast">Cups</span><input type="number" min={1} max={8} className="field" value={cups} onChange={(e) => setCups(Math.max(1, Math.min(8, Number(e.target.value) || 1)))} /></label>
                <label className="block"><span className="mb-1.5 block text-sm text-roast">Flavour profile</span><select className="field" value={flavor} onChange={(e) => setFlavor(e.target.value)}>{FLAVORS.map((f) => <option key={f}>{f}</option>)}</select></label>
                <fieldset><legend className="mb-1.5 text-sm text-roast">Strength</legend><div className="flex gap-2">{(['light', 'balanced', 'strong'] as const).map((s) => <button key={s} aria-pressed={strength === s} className={chip(strength === s)} onClick={() => setStrength(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></fieldset>
                <fieldset><legend className="mb-1.5 text-sm text-roast">Experience</legend><div className="flex gap-2">{(['beginner', 'intermediate', 'advanced'] as const).map((s) => <button key={s} aria-pressed={exp === s} className={chip(exp === s)} onClick={() => setExp(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></fieldset>
              </div>
              <fieldset className="mt-6"><legend className="mb-1.5 text-sm text-roast">Equipment you have</legend><div className="flex flex-wrap gap-2">{EQUIP.map((e) => <button key={e} aria-pressed={equipment.includes(e)} className={chip(equipment.includes(e))} onClick={() => setEquipment((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e])}>{e}</button>)}</div></fieldset>
            </section>
            <section>{step('4', 'Generate your recipe')}
              <button className="btn btn-dark" disabled={!ready || busy} onClick={generate}>{busy ? 'Your barista is thinking…' : result ? 'Regenerate recipe' : 'Generate recipe'}</button>
              {!ready && <p className="mt-3 text-sm text-roast">Choose a coffee and a method to continue.</p>}
              {err && <p role="alert" className="mt-4 border border-red-800/40 bg-red-50 p-4 text-sm text-red-900">{err}</p>}
            </section>
          </div>
          <div className="lg:col-span-5" id="recipe">
            {result ? <div className="lg:sticky lg:top-28 space-y-4">
              <RecipeCard r={result.recipe} />
              <div className="no-print flex flex-wrap gap-3">
                {user ? <button className="btn btn-dark" disabled={saved !== 'idle'} onClick={save}>{saved === 'done' ? 'Saved' : saved === 'saving' ? 'Saving…' : 'Save recipe'}</button> : <Link to="/account/login" state={{ from: '/barista' }} className="btn btn-dark">Sign in to save</Link>}
                <button className="btn btn-line" onClick={generate} disabled={busy}>Regenerate</button>
                <button className="btn btn-line" onClick={() => window.print()}>Print</button>
              </div>
              {saved === 'done' && <p role="status" className="text-sm text-roast">Saved. Find it in <Link to="/account/recipes" className="underline">your saved recipes</Link>.</p>}
              {saveErr && <p role="alert" className="text-sm text-red-800">{saveErr}</p>}
            </div> : <div className="border border-dashed border-espresso/25 p-10 text-roast lg:sticky lg:top-28"><p className="font-serif text-3xl text-espresso">Your recipe will appear here.</p><p className="mt-3 text-sm">Dose, water, temperature, grind and timing, built from the coffee’s real profile.</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
