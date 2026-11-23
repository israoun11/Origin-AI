import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/auth';
import { Empty, ErrorState, Img, Seo, Skeleton } from '../components/ui';
import { date } from '../lib/format';

export function JournalList() {
  const [sp, setSp] = useSearchParams();
  const { data, loading, error, reload } = useApi<{ items: any[]; categories: string[] }>(`/articles?${sp.toString()}`);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };
  const [f, ...rest] = data?.items ?? [];
  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="Brew Journal" description="Notes on origin, method and the small decisions that change a cup." />
      <h1 className="display text-6xl md:text-8xl">Brew Journal</h1>
      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2"><button className={`border px-4 py-2 text-sm ${!sp.get('category') ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/30'}`} onClick={() => set('category', '')}>All</button>
          {(data?.categories ?? []).map((c) => <button key={c} className={`border px-4 py-2 text-sm ${sp.get('category') === c ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/30'}`} onClick={() => set('category', c)}>{c}</button>)}</div>
        <input aria-label="Search articles" placeholder="Search articles" className="field md:max-w-xs" defaultValue={sp.get('q') ?? ''} onKeyDown={(e) => e.key === 'Enter' && set('q', e.currentTarget.value)} />
      </div>
      <div className="mt-12">
        {loading ? <Skeleton className="h-96" /> : error ? <ErrorState message={error} onRetry={reload} /> : !f ? <Empty title="No articles found" text="Try a different category or search." /> : (
          <div className="grid gap-14 lg:grid-cols-12">
            <Link to={`/journal/${f.slug}`} className="group lg:col-span-8"><div className="aspect-[16/10] overflow-hidden"><div className="h-full transition-transform duration-[900ms] group-hover:scale-[1.03]"><Img src={f.cover?.url} alt={f.cover?.alt || f.title} label={f.category} /></div></div>
              <p className="mt-5 text-sm text-roast">{f.category} · {f.readingTime} min read · {date(f.publishedAt)}</p><h2 className="display mt-2 text-5xl">{f.title}</h2><p className="mt-3 max-w-xl text-espresso/75">{f.excerpt}</p></Link>
            <div className="lg:col-span-4">{rest.map((a) => <Link key={a._id} to={`/journal/${a.slug}`} className="group flex gap-4 border-t border-espresso/20 py-5"><div className="h-24 w-24 shrink-0 overflow-hidden"><Img src={a.cover?.url} label={a.category} className="text-base" alt="" /></div><div><p className="text-sm text-roast">{a.category} · {a.readingTime} min</p><h3 className="font-serif text-2xl leading-tight group-hover:text-roast">{a.title}</h3></div></Link>)}</div>
          </div>)}
      </div>
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi<{ article: any; related: any[] }>(`/articles/${slug}`);
  const { user, favorites, toggleFavorite } = useAuth();
  if (loading) return <div className="container-x py-20"><Skeleton className="h-96" /></div>;
  if (error || !data) return <div className="container-x py-24"><ErrorState message={error ?? ''} onRetry={reload} /></div>;
  const a = data.article; const fav = favorites.articles.includes(a._id);
  return (
    <article>
      <Seo title={a.seo?.title || a.title} description={a.seo?.description || a.excerpt} />
      <header className="container-x pt-16 md:pt-24"><p className="text-sm text-roast"><Link to="/journal" className="underline">Journal</Link> · {a.category} · {a.readingTime} min read · {date(a.publishedAt)}</p>
        <h1 className="display mt-4 max-w-5xl text-5xl md:text-8xl">{a.title}</h1><p className="mt-6 max-w-2xl text-xl text-espresso/75">{a.excerpt}</p></header>
      <div className="container-x mt-12"><div className="aspect-[16/8] overflow-hidden"><Img src={a.cover?.url} alt={a.cover?.alt || a.title} label={a.category} eager /></div></div>
      <div className="mx-auto mt-14 max-w-2xl px-5 font-serif text-[1.35rem] leading-[1.7]">
        {a.blocks.map((b: any, i: number) => b.type === 'heading' ? <h2 key={i} className="mb-4 mt-12 font-sans text-2xl font-semibold">{b.text}</h2>
          : b.type === 'quote' ? <blockquote key={i} className="my-10 border-l-2 border-roast pl-6 text-3xl italic leading-snug">{b.text}</blockquote>
          : b.type === 'list' ? <ul key={i} className="my-6 list-disc space-y-2 pl-6">{(b.items ?? []).map((x: string, j: number) => <li key={j}>{x}</li>)}</ul>
          : b.type === 'image' ? <figure key={i} className="my-10"><img src={b.url} alt={b.alt ?? ''} loading="lazy" className="w-full" /></figure>
          : <p key={i} className="my-5">{b.text}</p>)}
        <button className="btn btn-line mt-10 font-sans" aria-pressed={fav} onClick={() => user ? toggleFavorite('article', a._id) : nav('/account/login')}>{fav ? 'Saved to favourites' : 'Save article'}</button>
      </div>
      {data.related.length > 0 && <section className="container-x py-24"><h2 className="display text-4xl">Keep reading</h2><div className="mt-8 grid gap-8 md:grid-cols-3">{data.related.map((r) => <Link key={r._id} to={`/journal/${r.slug}`} className="group"><div className="aspect-[4/3] overflow-hidden"><Img src={r.cover?.url} label={r.category} alt={r.title} /></div><h3 className="mt-3 font-serif text-2xl group-hover:text-roast">{r.title}</h3></Link>)}</div></section>}
    </article>
  );
}
