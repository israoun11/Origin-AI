import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { api, errText } from '../lib/api';
import { Img } from '../components/ui';

export interface Asset { _id: string; url: string; filename: string; alt: string; folder: string; width?: number; height?: number; bytes?: number; format?: string }
export interface ImageRef { asset?: string; url: string; alt?: string }

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block"><span className="mb-1 block text-sm text-roast">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-roast/80">{hint}</span>}</label>
);
export const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange(v: boolean): void }) => (
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-roast" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>
);
export const Tags = ({ value, onChange }: { value: string[]; onChange(v: string[]): void }) => (
  <input className="field" value={value.join(', ')} onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trimStart()))} onBlur={() => onChange(value.map((s) => s.trim()).filter(Boolean))} placeholder="Comma separated" />
);
export const Notice = ({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) => (
  <p role={kind === 'error' ? 'alert' : 'status'} className={`border p-3 text-sm ${kind === 'error' ? 'border-red-800/40 bg-red-50 text-red-900' : 'border-green-800/30 bg-green-50 text-green-900'}`}>{children}</p>
);

export function MediaPicker({ onClose, onSelect, multiple, folder }: { onClose(): void; onSelect(a: Asset[]): void; multiple?: boolean; folder?: string }) {
  const [items, setItems] = useState<Asset[]>([]); const [q, setQ] = useState(''); const [f, setF] = useState(''); const [folders, setFolders] = useState<string[]>([]);
  const [sel, setSel] = useState<Asset[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [loading, setLoading] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const load = () => { setLoading(true); api(`/media?q=${encodeURIComponent(q)}&folder=${encodeURIComponent(f)}`).then((r) => { setItems(r.items); setFolders(r.folders); }).catch((e) => setErr(errText(e))).finally(() => setLoading(false)); };
  useEffect(load, [q, f]); // eslint-disable-line
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    setBusy(true); setErr('');
    try { const fd = new FormData(); [...files].forEach((x) => fd.append('files', x)); fd.append('folder', folder || f || 'general'); await api('/media/upload', { method: 'POST', form: fd }); load(); } catch (x) { setErr(errText(x)); } finally { setBusy(false); e.target.value = ''; }
  };
  const toggle = (a: Asset) => setSel((p) => multiple ? (p.find((x) => x._id === a._id) ? p.filter((x) => x._id !== a._id) : [...p, a]) : [a]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Media library" className="fixed inset-0 z-[70] flex items-center justify-center bg-espresso/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col bg-ivory p-6">
        <div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto font-serif text-3xl">Media library</h2>
          <input className="field w-48" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search images" />
          <select className="field w-40" value={f} onChange={(e) => setF(e.target.value)} aria-label="Folder"><option value="">All folders</option>{folders.map((x) => <option key={x}>{x}</option>)}</select>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={upload} />
          <button className="btn btn-line" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : 'Upload images'}</button><button className="btn btn-line" onClick={onClose}>Cancel</button></div>
        {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}
        <div className="mt-4 grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
          {loading ? <p className="col-span-full text-roast">Loading…</p> : items.length === 0 ? <p className="col-span-full text-roast">No images yet. Upload your first image.</p> : items.map((a) => {
            const on = sel.some((x) => x._id === a._id);
            return <button key={a._id} aria-pressed={on} onClick={() => toggle(a)} onDoubleClick={() => !multiple && onSelect([a])} className={`text-left ${on ? 'ring-2 ring-espresso' : ''}`}><div className="aspect-square overflow-hidden bg-cream"><Img src={a.url} alt={a.alt || a.filename} label={a.filename} className="text-sm" /></div><p className="mt-1 truncate text-xs">{a.filename}</p></button>;
          })}</div>
        <div className="mt-4 flex justify-end gap-3"><button className="btn btn-dark" disabled={!sel.length} onClick={() => onSelect(sel)}>{multiple ? `Add ${sel.length || ''} selected` : 'Use selected image'}</button></div>
      </div>
    </div>
  );
}

/** Single image slot with live preview, library picker and remove. */
export function ImageField({ label, value, onChange, folder }: { label: string; value?: ImageRef | null; onChange(v: ImageRef | null): void; folder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div><span className="mb-1 block text-sm text-roast">{label}</span>
      <div className="flex items-start gap-4"><div className="h-28 w-28 shrink-0 overflow-hidden bg-cream">{value?.url ? <Img src={value.url} alt={value.alt} /> : <div className="flex h-full items-center justify-center p-2 text-center text-xs text-roast">No image</div>}</div>
        <div className="space-y-2"><div className="flex gap-2"><button type="button" className="btn btn-line !px-4 !py-2" onClick={() => setOpen(true)}>{value?.url ? 'Change' : 'Choose image'}</button>{value?.url && <button type="button" className="btn btn-line !px-4 !py-2" onClick={() => onChange(null)}>Remove</button>}</div>
          {value?.url && <input className="field" placeholder="Alt text" value={value.alt ?? ''} onChange={(e) => onChange({ ...value, alt: e.target.value })} aria-label={`${label} alt text`} />}</div></div>
      {open && <MediaPicker folder={folder} onClose={() => setOpen(false)} onSelect={([a]) => { onChange({ asset: a._id, url: a.url, alt: a.alt || a.filename }); setOpen(false); }} />}
    </div>
  );
}

/** Ordered gallery: first image is the primary one. */
export function GalleryField({ value, onChange, folder }: { value: ImageRef[]; onChange(v: ImageRef[]): void; folder?: string }) {
  const [open, setOpen] = useState(false);
  const move = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div><span className="mb-1 block text-sm text-roast">Gallery (first image is the primary image)</span>
      <ul className="grid gap-3 sm:grid-cols-2">{value.map((im, i) => (
        <li key={im.url + i} className="flex gap-3 border border-espresso/20 p-2"><div className="h-24 w-20 shrink-0 overflow-hidden"><Img src={im.url} alt={im.alt} /></div>
          <div className="min-w-0 flex-1 space-y-1.5"><input className="field !py-1.5" placeholder="Alt text" aria-label="Alt text" value={im.alt ?? ''} onChange={(e) => onChange(value.map((x, k) => k === i ? { ...x, alt: e.target.value } : x))} />
            <div className="flex flex-wrap gap-1 text-xs">{i === 0 ? <span className="px-2 py-1 text-roast">Primary</span> : <button type="button" className="underline" onClick={() => onChange([im, ...value.filter((_, k) => k !== i)])}>Set primary</button>}<button type="button" className="underline" onClick={() => move(i, -1)} disabled={i === 0}>Up</button><button type="button" className="underline" onClick={() => move(i, 1)} disabled={i === value.length - 1}>Down</button><button type="button" className="ml-auto underline" onClick={() => onChange(value.filter((_, k) => k !== i))}>Remove</button></div></div></li>))}</ul>
      <button type="button" className="btn btn-line mt-3 !py-2" onClick={() => setOpen(true)}>Add images from library</button>
      {open && <MediaPicker multiple folder={folder} onClose={() => setOpen(false)} onSelect={(as) => { onChange([...value, ...as.map((a) => ({ asset: a._id, url: a.url, alt: a.alt || a.filename }))]); setOpen(false); }} />}</div>
  );
}
