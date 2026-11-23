import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Coffee, CoffeeTile } from '../components/CoffeeCard';
import { Empty, ErrorState, Seo, Skeleton } from '../components/ui';

interface Filters { roasts: string[]; processes: string[]; notes: string[]; origins: { country: string; slug: string }[] }

export default function Discover() {
  const [sp, setSp] = useSearchParams();
  const filters = useApi<Filters>('/coffees/filters');
  const qs = sp.toString();
  const list = useApi<{ items: Coffee[]; total: number; pages: number; page: number }>(`/coffees?${qs}&limit=12`);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); n.delete('page'); setSp(n); };
  const f = filters.data;
  const active = ['q', 'origin', 'roast', 'process', 'note'].filter((k) => sp.get(k));
  const Select = ({ k, label, options }: { k: string; label: string; options: { value: string; label: string }[] }) => (
    <label className="block"><span className="mb-1.5 block text-sm text-roast">{label}</span>
      <select className="field" value={sp.get(k) ?? ''} onChange={(e) => set(k, e.target.value)}><option value="">All</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
  );
  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="Discover coffee" description="Browse specialty coffees by origin, roast, process and flavour." />
      <h1 className="display text-6xl md:text-8xl">Discover coffee</h1>
      <p className="mt-4 max-w-lg text-roast">Every coffee, described by where it grew, how it was processed and how it tastes.</p>
      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-3" aria-label="Filters">
          <div className="space-y-5 lg:sticky lg:top-28">
            <label className="block"><span className="mb-1.5 block text-sm text-roast">Search</span><input className="field" defaultValue={sp.get('q') ?? ''} key={sp.get('q') ?? ''} onKeyDown={(e) => { if (e.key === 'Enter') set('q', e.currentTarget.value); }} onBlur={(e) => set('q', e.currentTarget.value)} placeholder="Name, region or note" /></label>
            <Select k="origin" label="Origin" options={(f?.origins ?? []).map((o) => ({ value: o.slug, label: o.country }))} />
            <Select k="roast" label="Roast level" options={(f?.roasts ?? []).map((r) => ({ value: r, label: r }))} />
            <Select k="process" label="Processing" options={(f?.processes ?? []).map((r) => ({ value: r, label: r }))} />
            <Select k="note" label="Flavour note" options={(f?.notes ?? []).map((r) => ({ value: r, label: r }))} />
            <label className="block"><span className="mb-1.5 block text-sm text-roast">Sort by</span>
              <select className="field" value={sp.get('sort') ?? 'newest'} onChange={(e) => set('sort', e.target.value)}><option value="newest">Newest</option><option value="name">Name</option><option value="price_asc">Price, low to high</option><option value="price_desc">Price, high to low</option></select></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={sp.get('featured') === 'true'} onChange={(e) => set('featured', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-roast" />Featured only</label>
            {active.length > 0 && <button className="text-sm underline" onClick={() => setSp(new URLSearchParams())}>Clear filters</button>}
          </div>
        </aside>
        <section className="lg:col-span-9" aria-live="polite">
          {list.loading ? <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i}><Skeleton className="aspect-[4/5]" /><Skeleton className="mt-4 h-6 w-2/3" /></div>)}</div>
            : list.error ? <ErrorState message={list.error} onRetry={list.reload} />
            : !list.data || list.data.items.length === 0 ? <Empty title="No coffee matches your filters" text="Try removing a filter or searching for something broader." action={<button className="btn btn-dark" onClick={() => setSp(new URLSearchParams())}>Clear filters</button>} />
            : <>
                <p className="mb-8 text-sm text-roast">{list.data.total} {list.data.total === 1 ? 'coffee' : 'coffees'}</p>
                <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">{list.data.items.map((c, i) => <div key={c._id} className={i % 3 === 1 ? 'xl:mt-12' : ''}><CoffeeTile c={c} /></div>)}</div>
                {list.data.pages > 1 && <div className="mt-14 flex items-center justify-center gap-4 text-sm">
                  <button className="btn btn-line" disabled={list.data.page <= 1} onClick={() => { const n = new URLSearchParams(sp); n.set('page', String(list.data!.page - 1)); setSp(n); }}>Previous</button>
                  <span>Page {list.data.page} of {list.data.pages}</span>
                  <button className="btn btn-line" disabled={list.data.page >= list.data.pages} onClick={() => { const n = new URLSearchParams(sp); n.set('page', String(list.data!.page + 1)); setSp(n); }}>Next</button></div>}
              </>}
        </section>
      </div>
    </div>
  );
}
