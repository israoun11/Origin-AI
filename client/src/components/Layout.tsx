import { AnimatePresence, motion } from 'framer-motion';
import { createContext, FormEvent, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useSettings } from '../context/settings';
import { money, grams } from '../lib/format';
import { Img } from './ui';
import NewsletterForm from './NewsletterForm';

const HeroFlag = createContext<(v: boolean) => void>(() => undefined);
/** The homepage hero registers itself so the header knows when it sits on a dark background. */
export const useHeroFlag = () => useContext(HeroFlag);

const Icon = ({ d }: { d: string }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d={d} /></svg>;

function Dropdown({ label, items, dark }: { label: string; items: { to: string; label: string }[]; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc]);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} className="py-2 text-sm tracking-wide hover:opacity-70">{label}</button>
      <AnimatePresence>
        {open && items.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
            className={`absolute left-0 top-full min-w-[220px] border p-2 ${dark ? 'border-ivory/15 bg-espresso text-ivory' : 'border-espresso/15 bg-ivory text-espresso'}`}>
            {items.map((i) => <li key={i.to}><Link to={i.to} className="block px-3 py-2 text-sm hover:bg-champagne/30">{i.label}</Link></li>)}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function BagDrawer() {
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart();
  const { currency } = useSettings();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside role="dialog" aria-label="Shopping bag" className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory p-6" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.35 }}>
            <div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Your bag</h2><button onClick={() => setOpen(false)} aria-label="Close bag" className="p-2">Close</button></div>
            <div className="mt-6 flex-1 overflow-y-auto">
              {lines.length === 0 ? <p className="text-roast">Your bag is empty.</p> : lines.map((l) => (
                <div key={l.coffeeId + l.weight} className="flex gap-4 border-t border-espresso/15 py-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden"><Img src={l.image} label={l.name.split(' ')[0]} className="text-lg" /></div>
                  <div className="flex-1 text-sm">
                    <p className="font-serif text-xl">{l.name}</p><p className="text-roast">{grams(l.weight)} · {money(l.price, currency)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button aria-label="Decrease quantity" className="h-7 w-7 border border-espresso/30" onClick={() => setQty(l.coffeeId, l.weight, l.quantity - 1)}>−</button>
                      <span>{l.quantity}</span>
                      <button aria-label="Increase quantity" className="h-7 w-7 border border-espresso/30" onClick={() => setQty(l.coffeeId, l.weight, l.quantity + 1)}>+</button>
                      <button className="ml-auto underline" onClick={() => remove(l.coffeeId, l.weight)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-espresso/20 pt-4">
              <p className="flex justify-between text-sm"><span>Subtotal</span><span>{money(subtotal, currency)}</span></p>
              <Link to="/bag" onClick={() => setOpen(false)} className="btn btn-dark mt-4 w-full">View bag and checkout</Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Layout() {
  const s = useSettings();
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const origins = useApi<{ items: { country: string; slug: string }[] }>('/origins');
  const [hero, setHero] = useState(false);
  const home = loc.pathname === '/' && hero;
  const dark = home && !scrolled; // transparent over the dark hero

  useEffect(() => { const f = () => setScrolled(window.scrollY > 40); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { setMenu(false); setSearch(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/coffee?q=${encodeURIComponent(q)}`); setQ(''); };
  const discover = (origins.data?.items ?? []).map((o) => ({ to: `/coffee?origin=${o.slug}`, label: o.country }));
  const social = s.social ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ivory focus:p-3">Skip to content</a>
      {s.announcement?.enabled && s.announcement.text && <div className="bg-roast px-4 py-2 text-center text-sm text-ivory">{s.announcement.text}</div>}
      <header className={`${home ? 'fixed' : 'sticky'} inset-x-0 top-0 z-40 transition-colors duration-500 ${dark ? 'on-dark bg-transparent text-ivory' : 'border-b border-espresso/10 bg-ivory/95 text-espresso backdrop-blur'}`} style={home && s.announcement?.enabled ? { top: 36 } : undefined}>
        <div className="container-x flex h-20 items-center justify-between">
          <Link to="/" className="font-serif text-3xl tracking-[0.18em]" aria-label={`${s.brandName} home`}>{s.logo?.url ? <img src={s.logo.url} alt={s.logo.alt || s.brandName} className="h-8" /> : s.brandName}</Link>
          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            <Dropdown label="Discover" items={discover} dark={dark} />
            <NavLink to="/coffee" className="py-2 text-sm tracking-wide hover:opacity-70">Coffee</NavLink>
            <Dropdown label="Brew Guide" items={[{ to: '/barista', label: 'AI Barista' }, { to: '/journal', label: 'Brew Journal' }]} dark={dark} />
            <NavLink to="/story" className="py-2 text-sm tracking-wide hover:opacity-70">Our Story</NavLink>
          </nav>
          <div className="flex items-center gap-1">
            <button aria-label="Search" onClick={() => setSearch((v) => !v)} className="p-2.5"><Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" /></button>
            <Link to={user ? '/account' : '/account/login'} aria-label="Account" className="p-2.5"><Icon d="M20 21a8 8 0 1 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></Link>
            <button aria-label={`Shopping bag, ${count} items`} onClick={() => setOpen(true)} className="relative p-2.5"><Icon d="M5 8h14l-1 12H6L5 8zM9 8a3 3 0 0 1 6 0" />{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-roast px-1 text-[11px] text-ivory">{count}</span>}</button>
            <button aria-label="Menu" aria-expanded={menu} className="p-2.5 lg:hidden" onClick={() => setMenu((m) => !m)}><Icon d={menu ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} /></button>
          </div>
        </div>
        {search && <form onSubmit={submit} role="search" className="border-t border-espresso/10 bg-ivory text-espresso"><div className="container-x flex gap-3 py-4"><input autoFocus aria-label="Search coffees" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coffees, origins, flavour notes" className="field" /><button className="btn btn-dark">Search</button></div></form>}
        {menu && (
          <div className="border-t border-espresso/10 bg-ivory text-espresso lg:hidden">
            <nav aria-label="Mobile" className="container-x flex flex-col gap-1 py-6 font-serif text-3xl">
              <Link className="py-2" to="/coffee">Coffee</Link><Link className="py-2" to="/barista">AI Barista</Link><Link className="py-2" to="/journal">Brew Journal</Link><Link className="py-2" to="/story">Our Story</Link>
              <p className="mt-4 font-sans text-sm text-roast">Origins</p>
              <div className="flex flex-wrap gap-x-5 font-sans text-base">{discover.map((d) => <Link key={d.to} to={d.to} className="py-1.5">{d.label}</Link>)}</div>
            </nav>
          </div>
        )}
      </header>
      <BagDrawer />
      <HeroFlag.Provider value={setHero}><main id="main" className="flex-1"><Outlet /></main></HeroFlag.Provider>
      <footer className="on-dark bg-espresso text-ivory">
        <div className="container-x grid gap-12 py-16 md:grid-cols-12">
          <div className="md:col-span-4"><p className="font-serif text-4xl tracking-[0.18em]">{s.brandName}</p><p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">{s.footer?.description || s.tagline}</p></div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-sm md:col-span-4">
            <ul className="space-y-2"><li className="mb-3 text-champagne">Explore</li><li><Link to="/coffee">All coffee</Link></li><li><Link to="/barista">AI Barista</Link></li><li><Link to="/journal">Brew Journal</Link></li><li><Link to="/story">Our Story</Link></li></ul>
            <ul className="space-y-2"><li className="mb-3 text-champagne">Collections</li>{discover.slice(0, 6).map((d) => <li key={d.to}><Link to={d.to}>{d.label}</Link></li>)}</ul>
          </nav>
          <div className="md:col-span-4"><p className="text-champagne text-sm">Newsletter</p><div className="mt-3"><NewsletterForm dark /></div></div>
        </div>
        <div className="container-x flex flex-col gap-4 border-t border-ivory/15 py-6 text-sm text-ivory/70 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-1">{s.contactEmail && <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}{s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
            {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer">Instagram</a>}{social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer">Facebook</a>}{social.x && <a href={social.x} target="_blank" rel="noreferrer">X</a>}</div>
          <div className="flex gap-6"><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms and conditions</Link></div>
        </div>
      </footer>
    </div>
  );
}
