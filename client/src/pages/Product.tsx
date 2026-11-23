import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Coffee, CoffeeTile, originName } from '../components/CoffeeCard';
import { ErrorState, Img, Seo, Skeleton } from '../components/ui';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { useSettings } from '../context/settings';
import { grams, money } from '../lib/format';

export default function Product() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi<{ coffee: Coffee; related: Coffee[] }>(`/coffees/${slug}`);
  const { add } = useCart();
  const { user, favorites, toggleFavorite } = useAuth();
  const { currency } = useSettings();
  const [img, setImg] = useState(0);
  const [weight, setWeight] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => { setImg(0); setWeight(null); setQty(1); }, [slug]);

  if (loading) return <div className="container-x grid gap-10 py-16 md:grid-cols-2"><Skeleton className="aspect-[4/5]" /><div className="space-y-4"><Skeleton className="h-14 w-3/4" /><Skeleton className="h-40" /></div></div>;
  if (error || !data) return <div className="container-x py-24"><ErrorState message={error === 'Coffee not found' ? 'This coffee is no longer available.' : error ?? 'Not found'} onRetry={error === 'Coffee not found' ? undefined : reload} /></div>;
  const c = data.coffee;
  const v = c.variants.find((x) => x.weight === (weight ?? c.variants.find((y) => y.stock > 0)?.weight ?? c.variants[0].weight))!;
  const fav = favorites.coffees.includes(c._id);
  const images = c.images.length ? c.images : [{ url: '', alt: c.name }];
  const detail = (k: string, val?: string) => val ? <div className="flex justify-between gap-6 border-t border-espresso/15 py-3 text-sm"><dt className="text-roast">{k}</dt><dd className="text-right">{val}</dd></div> : null;

  return (
    <div>
      <Seo title={c.seo?.title || c.name} description={c.seo?.description || c.description.slice(0, 155)} />
      <div className="container-x grid gap-12 py-12 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/5] cursor-zoom-in overflow-hidden bg-cream sm:aspect-[5/6]"
            onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }} onPointerLeave={() => setZoom(null)}>
            <div className="h-full w-full transition-transform duration-200" style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}><Img src={images[img]?.url} alt={images[img]?.alt || c.name} label={c.name} eager /></div>
          </div>
          {images.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto">{images.map((im, i) => <button key={i} aria-label={`Show image ${i + 1}`} aria-current={i === img} onClick={() => setImg(i)} className={`h-20 w-16 shrink-0 overflow-hidden border-2 ${i === img ? 'border-espresso' : 'border-transparent opacity-70'}`}><Img src={im.url} alt="" label="" /></button>)}</div>}
        </div>
        <div className="lg:col-span-5">
          <p className="text-sm text-roast"><Link to={`/coffee?origin=${typeof c.origin === 'object' ? c.origin.slug : ''}`} className="underline">{originName(c)}</Link>{c.region ? `, ${c.region}` : ''}</p>
          <h1 className="display mt-2 text-5xl md:text-7xl">{c.name}</h1>
          <p className="mt-6 leading-relaxed text-espresso/80">{c.description}</p>
          <p className="mt-5 font-serif text-2xl">{c.flavorNotes.join(' · ')}</p>
          <fieldset className="mt-8"><legend className="mb-3 text-sm text-roast">Weight</legend>
            <div className="flex flex-wrap gap-2">{c.variants.map((x) => (
              <button key={x.weight} disabled={x.stock === 0} aria-pressed={x.weight === v.weight} onClick={() => { setWeight(x.weight); setQty(1); }}
                className={`border px-5 py-3 text-sm transition-colors ${x.weight === v.weight ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/30 hover:border-espresso'} disabled:opacity-40 disabled:line-through`}>{grams(x.weight)} · {money(x.price, currency)}</button>))}</div></fieldset>
          <p className="mt-4 text-sm">{v.stock === 0 ? <span className="text-red-800">Sold out</span> : v.stock <= 5 ? <span className="text-roast">Only {v.stock} left</span> : <span className="text-roast">In stock</span>}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-espresso/30"><button aria-label="Decrease quantity" className="h-12 w-12" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><span className="w-10 text-center" aria-live="polite">{qty}</span><button aria-label="Increase quantity" className="h-12 w-12" onClick={() => setQty((q) => Math.min(v.stock, q + 1))}>+</button></div>
            <button className="btn btn-dark flex-1" disabled={v.stock === 0} onClick={() => add({ coffeeId: c._id, slug: c.slug, name: c.name, image: c.images[0]?.url, weight: v.weight, price: v.price, max: v.stock }, qty)}>Add to bag</button>
            <button aria-pressed={fav} aria-label={fav ? 'Remove from favourites' : 'Save to favourites'} className="btn btn-line" onClick={() => user ? toggleFavorite('coffee', c._id) : nav('/account/login')}>{fav ? 'Saved' : 'Save'}</button>
          </div>
          <Link to={`/barista?coffee=${c._id}`} className="btn btn-line mt-3 w-full">Brew this coffee</Link>
          <dl className="mt-10">{detail('Origin', `${originName(c)}${c.region ? `, ${c.region}` : ''}`)}{detail('Producer', c.producer)}{detail('Altitude', c.altitude)}{detail('Process', c.process)}{detail('Roast', c.roast)}{detail('Brew with', c.brewMethods.join(', '))}<div className="border-t border-espresso/15" /></dl>
        </div>
      </div>
      {data.related.length > 0 && <section className="container-x pb-24"><h2 className="display text-4xl md:text-5xl">You may also like</h2><div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{data.related.map((r) => <CoffeeTile key={r._id} c={r} />)}</div></section>}
    </div>
  );
}
