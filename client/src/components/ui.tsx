import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

const TONES = ['#38251D', '#72513B', '#2B1B16', '#A89179', '#C6AD8B'];
const tone = (s: string) => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/** Image with an art-directed typographic fallback when no image is assigned or it fails to load. */
export function Img({ src, alt, label, className = '', eager }: { src?: string | null; alt?: string; label?: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed) {
    return <img src={src} alt={alt ?? ''} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />;
  }
  const bg = tone(label ?? alt ?? 'o');
  const light = bg === '#A89179' || bg === '#C6AD8B';
  return (
    <div role="img" aria-label={alt ?? label ?? 'Image'} className={`relative flex h-full w-full items-end overflow-hidden p-5 ${className}`} style={{ background: bg }}>
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(120% 90% at 85% 10%, rgba(245,240,231,.35), transparent 60%)' }} />
      <span className={`display relative text-3xl sm:text-4xl ${light ? 'text-espresso/80' : 'text-ivory/80'}`}>{label}</span>
    </div>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export const Skeleton = ({ className = '' }: { className?: string }) => <div aria-hidden className={`animate-pulse bg-cream ${className}`} />;

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border border-espresso/20 bg-cream/50 p-8 text-center">
      <p className="font-serif text-2xl">We could not load this.</p>
      <p className="mt-2 text-sm text-roast">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-dark mt-5">Try again</button>}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-espresso/25 p-10 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-roast">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Seo({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = `${title} | ORIGIN`;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
      m.setAttribute('content', description);
    }
    const setProp = (p: string, v: string) => {
      let m = document.querySelector(`meta[property="${p}"]`);
      if (!m) { m = document.createElement('meta'); m.setAttribute('property', p); document.head.appendChild(m); }
      m.setAttribute('content', v);
    };
    setProp('og:title', `${title} | ORIGIN`); if (description) setProp('og:description', description);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = window.location.origin + window.location.pathname;
  }, [title, description]);
  return null;
}

export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-roast">{label}</span>
      {children}
      {error && <span role="alert" className="field-error block">{error}</span>}
    </label>
  );
}

export function BeanArt({ className = '' }: { className?: string }) {
  const bean = (x: number, y: number, r: number, s: number, o = 1) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <ellipse rx="100" ry="70" fill="#72513B" />
      <ellipse rx="100" ry="70" fill="url(#hl)" />
      <path d="M-86 4 C-40 -26 30 30 86 -6" fill="none" stroke="#1d110d" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden>
      <defs><radialGradient id="hl" cx="30%" cy="25%" r="80%"><stop offset="0" stopColor="#C6AD8B" stopOpacity=".55" /><stop offset=".6" stopColor="#72513B" stopOpacity="0" /></radialGradient></defs>
      {bean(300, 300, -18, 1.5)}{bean(160, 160, 28, 0.8, 0.9)}{bean(450, 180, -50, 0.7, 0.85)}{bean(450, 450, 35, 0.9, 0.9)}{bean(150, 450, -30, 0.65, 0.8)}
    </svg>
  );
}
