import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../lib/format';
import { useSettings } from '../context/settings';
import { Img } from './ui';

export interface Coffee {
  _id: string; name: string; slug: string; description: string; origin: { _id?: string; country: string; slug: string } | string; region?: string; producer?: string; altitude?: string;
  process: string; roast: string; flavorNotes: string[]; brewMethods: string[]; variants: { weight: number; price: number; stock: number }[];
  images: { url: string; alt?: string; asset?: string }[]; fromPrice: number; inStock: boolean; featured?: boolean; seo?: { title?: string; description?: string };
}
export const originName = (c: Coffee) => (typeof c.origin === 'string' ? '' : c.origin?.country ?? '');

function Availability({ c }: { c: Coffee }) {
  return <span className={c.inStock ? 'text-roast' : 'text-red-800'}>{c.inStock ? 'In stock' : 'Sold out'}</span>;
}

/** Vertical card with subtle 3D tilt (disabled for reduced motion / touch). */
export function CoffeeTile({ c }: { c: Coffee }) {
  const { currency } = useSettings();
  const reduce = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 150, damping: 18 });
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0); }} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}>
      <Link to={`/coffee/${c.slug}`} className="group block">
        <div className="aspect-[4/5] overflow-hidden bg-cream">
          <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"><Img src={c.images[0]?.url} alt={c.images[0]?.alt || c.name} label={c.name} /></div>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-serif text-2xl leading-tight">{c.name}</h3>
          <p className="shrink-0 text-sm">from {money(c.fromPrice, currency)}</p>
        </div>
        <p className="mt-1 text-sm text-roast">{originName(c)} · {c.roast} roast · <Availability c={c} /></p>
        <p className="mt-2 text-sm text-espresso/75">{c.flavorNotes.join(', ')}</p>
      </Link>
    </motion.div>
  );
}

export function CoffeeFeature({ c }: { c: Coffee }) {
  const { currency } = useSettings();
  return (
    <Link to={`/coffee/${c.slug}`} className="group grid h-full gap-6 md:grid-cols-5">
      <div className="aspect-[4/5] overflow-hidden bg-cream md:col-span-3"><div className="h-full w-full transition-transform duration-[900ms] group-hover:scale-[1.03]"><Img src={c.images[0]?.url} alt={c.images[0]?.alt || c.name} label={c.name} /></div></div>
      <div className="flex flex-col justify-end md:col-span-2">
        <p className="text-sm text-roast">{originName(c)}{c.region ? `, ${c.region}` : ''}</p>
        <h3 className="display mt-2 text-5xl md:text-6xl">{c.name}</h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-espresso/80">{c.description}</p>
        <p className="mt-4 font-serif text-xl">{c.flavorNotes.join(' · ')}</p>
        <p className="mt-4 text-sm">{c.roast} roast · from {money(c.fromPrice, currency)} · <Availability c={c} /></p>
        <span className="mt-6 w-fit border-b border-espresso pb-1 text-sm transition-colors group-hover:border-roast group-hover:text-roast">View coffee</span>
      </div>
    </Link>
  );
}

export function CoffeeRow({ c }: { c: Coffee }) {
  const { currency } = useSettings();
  return (
    <Link to={`/coffee/${c.slug}`} className="group flex gap-5 border-t border-espresso/20 py-5">
      <div className="h-24 w-20 shrink-0 overflow-hidden bg-cream"><Img src={c.images[0]?.url} alt={c.images[0]?.alt || c.name} label={c.name.split(' ')[0]} className="text-xl" /></div>
      <div className="flex-1">
        <h3 className="font-serif text-2xl leading-tight transition-colors group-hover:text-roast">{c.name}</h3>
        <p className="mt-1 text-sm text-roast">{originName(c)} · {c.roast} roast</p>
        <p className="mt-1 text-sm">{c.flavorNotes.join(', ')}</p>
      </div>
      <div className="text-right text-sm"><p>from {money(c.fromPrice, currency)}</p><p className="mt-1"><Availability c={c} /></p></div>
    </Link>
  );
}
