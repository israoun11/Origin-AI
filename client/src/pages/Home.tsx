import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useHeroFlag } from '../components/Layout';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Coffee, CoffeeFeature, CoffeeRow } from '../components/CoffeeCard';
import HeroVisual from '../components/Hero3DLoader';
import NewsletterForm from '../components/NewsletterForm';
import { Empty, ErrorState, Img, Reveal, Seo, Skeleton } from '../components/ui';
import { date } from '../lib/format';

type Sec = Record<string, any>;
interface Home { sections: { key: string; content: Sec }[]; coffees: Coffee[]; origins: any[]; articles: any[] }
const METHODS = ['V60', 'French Press', 'AeroPress', 'Espresso', 'Chemex'];

function Hero({ c }: { c: Sec }) {
  const setHero = useHeroFlag();
  useEffect(() => { setHero(true); return () => setHero(false); }, [setHero]);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  return (
    <section ref={ref} className="on-dark relative isolate flex min-h-[100svh] items-end overflow-hidden bg-espresso text-ivory">
      {c.image?.url && <div className="absolute inset-0 -z-10 opacity-40"><Img src={c.image.url} alt={c.image.alt} eager /></div>}
      <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(70% 60% at 75% 40%, rgba(114,81,59,.45), transparent 70%)' }} />
      <motion.div style={{ y }} className="pointer-events-none absolute right-[-6%] top-[8%] -z-0 h-[75%] w-[62%] max-lg:right-[-25%] max-lg:top-[14%] max-lg:h-[46%] max-lg:w-[110%] max-lg:opacity-40 lg:pointer-events-auto"><HeroVisual /></motion.div>
      <div className="container-x relative z-10 pb-16 pt-40 sm:pb-24">
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="display max-w-[11ch] text-[clamp(3.6rem,10.5vw,10rem)]">{c.headline}</motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg leading-relaxed text-ivory/80">{c.text}</p>
          <div className="flex flex-wrap gap-3">
            {c.primaryCta?.label && <Link to={c.primaryCta.href || '/coffee'} className="btn btn-light">{c.primaryCta.label}</Link>}
            {c.secondaryCta?.label && <Link to={c.secondaryCta.href || '/barista'} className="btn btn-line-light">{c.secondaryCta.label}</Link>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Intro({ c }: { c: Sec }) {
  return (
    <section className="container-x grid gap-12 py-24 md:grid-cols-12 md:py-36">
      <Reveal className="md:col-span-7"><h2 className="display text-[clamp(2.8rem,6.5vw,6.5rem)]">{c.headline}</h2></Reveal>
      <Reveal delay={0.15} className="md:col-span-4 md:col-start-9 md:pt-24"><p className="text-lg leading-relaxed text-espresso/80">{c.text}</p></Reveal>
      {(c.image?.url || c.imageSecondary?.url) && (
        <div className="grid gap-6 md:col-span-12 md:grid-cols-12">
          {c.image?.url && <div className="aspect-[4/3] md:col-span-7"><Img src={c.image.url} alt={c.image.alt} /></div>}
          {c.imageSecondary?.url && <div className="aspect-[3/4] md:col-span-4 md:col-start-9 md:-mt-24"><Img src={c.imageSecondary.url} alt={c.imageSecondary.alt} /></div>}
        </div>
      )}
    </section>
  );
}

function Origins({ c, items }: { c: Sec; items: any[] }) {
  const [hover, setHover] = useState(0);
  const cur = items[hover];
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="container-x">
        <Reveal><h2 className="display max-w-3xl text-5xl md:text-7xl">{c.headline}</h2><p className="mt-4 max-w-md text-roast">{c.text}</p></Reveal>
        {items.length === 0 ? <div className="mt-12"><Empty title="Origins are being prepared" text="Add origins from the admin dashboard to see them here." /></div> : (
          <div className="mt-14 grid gap-10 lg:grid-cols-12">
            <ul className="lg:col-span-7">
              {items.map((o, i) => (
                <li key={o._id} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                  <Link to={`/coffee?origin=${o.slug}`} className="group flex items-baseline justify-between gap-4 border-t border-espresso/25 py-5 transition-colors hover:bg-champagne/20 md:py-7">
                    <span className="display text-4xl transition-transform duration-500 group-hover:translate-x-3 md:text-6xl">{o.country}</span>
                    <span className="hidden text-right text-sm text-roast sm:block">{o.region && <>{o.region}<br /></>}{(o.tastingNotes ?? []).slice(0, 3).join(' · ')}</span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-espresso/25" />
            </ul>
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <div className="aspect-[4/5] overflow-hidden"><Img src={cur?.image?.url} alt={cur?.image?.alt || cur?.country} label={cur?.country} /></div>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-espresso/80">{cur?.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Selection({ c, items }: { c: Sec; items: Coffee[] }) {
  const [a, b, ...rest] = items;
  return (
    <section className="container-x py-24 md:py-36">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="display text-5xl md:text-7xl">{c.headline}</h2><p className="mt-3 max-w-md text-roast">{c.text}</p></div><Link to="/coffee" className="btn btn-line w-fit">See all coffee</Link></Reveal>
      {!a ? <div className="mt-12"><Empty title="No coffees selected yet" text="Publish coffees from the admin dashboard." /></div> : (
        <div className="mt-14 space-y-20">
          <Reveal><CoffeeFeature c={a} /></Reveal>
          {b && <Reveal><div className="md:pl-[20%]"><CoffeeFeature c={b} /></div></Reveal>}
          {rest.length > 0 && <Reveal><div className="grid gap-x-14 md:grid-cols-2">{rest.map((r) => <CoffeeRow key={r._id} c={r} />)}</div></Reveal>}
        </div>
      )}
    </section>
  );
}

function BaristaSection({ c }: { c: Sec }) {
  return (
    <section className="on-dark relative overflow-hidden bg-coffee py-24 text-ivory md:py-36">
      {c.image?.url && <div className="absolute inset-0 opacity-25"><Img src={c.image.url} alt={c.image.alt} /></div>}
      <div className="container-x relative grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-7"><h2 className="display text-[clamp(2.8rem,6.5vw,6.5rem)]">{c.headline}</h2><p className="mt-6 max-w-lg text-lg text-ivory/80">{c.text}</p>
          {c.cta?.label && <Link to={c.cta.href || '/barista'} className="btn btn-light mt-10">{c.cta.label}</Link>}</Reveal>
        <Reveal delay={0.15} className="lg:col-span-4 lg:col-start-9"><p className="text-sm text-champagne">Choose a method</p>
          <ul className="mt-4">{METHODS.map((m) => <li key={m}><Link to={`/barista?method=${encodeURIComponent(m)}`} className="flex items-center justify-between border-t border-ivory/20 py-4 font-serif text-3xl transition-colors hover:text-champagne">{m}<span aria-hidden className="text-base">→</span></Link></li>)}<li className="border-t border-ivory/20" /></ul></Reveal>
      </div>
    </section>
  );
}

function Journal({ c, items }: { c: Sec; items: any[] }) {
  const [f, ...rest] = items;
  return (
    <section className="container-x py-24 md:py-36">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="display text-5xl md:text-7xl">{c.headline}</h2><p className="mt-3 max-w-md text-roast">{c.text}</p></div><Link to="/journal" className="btn btn-line w-fit">Read the journal</Link></Reveal>
      {!f ? <div className="mt-12"><Empty title="No articles yet" text="Publish articles from the admin dashboard." /></div> : (
        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7"><Link to={`/journal/${f.slug}`} className="group block"><div className="aspect-[16/11] overflow-hidden"><div className="h-full transition-transform duration-[900ms] group-hover:scale-[1.03]"><Img src={f.cover?.url} alt={f.cover?.alt || f.title} label={f.category} /></div></div>
            <p className="mt-5 text-sm text-roast">{f.category} · {f.readingTime} min read · {date(f.publishedAt)}</p><h3 className="display mt-2 text-4xl md:text-5xl">{f.title}</h3><p className="mt-3 max-w-xl text-espresso/75">{f.excerpt}</p></Link></Reveal>
          <div className="lg:col-span-4 lg:col-start-9">{rest.map((a) => (
            <Link key={a._id} to={`/journal/${a.slug}`} className="group block border-t border-espresso/20 py-6"><p className="text-sm text-roast">{a.category} · {a.readingTime} min read</p><h3 className="mt-1 font-serif text-3xl leading-tight transition-colors group-hover:text-roast">{a.title}</h3><p className="mt-1 text-sm text-roast">{date(a.publishedAt)}</p></Link>))}</div>
        </div>
      )}
    </section>
  );
}

function Philosophy({ c }: { c: Sec }) {
  return (
    <section className="on-dark relative overflow-hidden bg-espresso py-28 text-ivory md:py-44">
      {c.image?.url && <div className="absolute inset-0 opacity-30"><Img src={c.image.url} alt={c.image.alt} /></div>}
      <div className="container-x relative"><Reveal><h2 className="display max-w-5xl text-[clamp(2.6rem,6.5vw,6.5rem)]">{c.headline}</h2><p className="mt-10 max-w-xl text-lg leading-relaxed text-ivory/80">{c.text}</p></Reveal></div>
    </section>
  );
}

function Newsletter({ c }: { c: Sec }) {
  return (
    <section className="container-x grid gap-10 py-24 md:grid-cols-12 md:py-32">
      <Reveal className="md:col-span-6"><h2 className="display text-5xl md:text-6xl">{c.headline}</h2><p className="mt-4 max-w-sm text-roast">{c.text}</p></Reveal>
      <Reveal delay={0.1} className="md:col-span-5 md:col-start-8 md:pt-6"><NewsletterForm /></Reveal>
    </section>
  );
}

export default function HomePage() {
  const { data, loading, error, reload } = useApi<Home>('/settings/homepage');
  if (loading) return <div><Skeleton className="h-[100svh] !bg-espresso" /><div className="container-x space-y-6 py-24"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-64" /></div></div>;
  if (error || !data) return <div className="container-x py-40"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>;
  const view = (key: string, c: Sec) => {
    switch (key) {
      case 'hero': return <Hero key={key} c={c} />;
      case 'intro': return <Intro key={key} c={c} />;
      case 'origins': return <Origins key={key} c={c} items={data.origins} />;
      case 'coffees': return <Selection key={key} c={c} items={data.coffees} />;
      case 'barista': return <BaristaSection key={key} c={c} />;
      case 'journal': return <Journal key={key} c={c} items={data.articles} />;
      case 'philosophy': return <Philosophy key={key} c={c} />;
      case 'newsletter': return <Newsletter key={key} c={c} />;
      default: return null;
    }
  };
  return <><Seo title="Specialty coffee, origins and your AI Barista" description="Exceptional beans, distinctive origins and a personal AI Barista." />{data.sections.map((s) => view(s.key, s.content))}</>;
}
