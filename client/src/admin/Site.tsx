import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, errText } from '../lib/api';
import { Img, Skeleton } from '../components/ui';
import { Title } from './Core';
import { Asset, Field, ImageField, ImageRef, Notice, Toggle } from './ui';

export function AdminMedia() {
  const [q, setQ] = useState(''); const [folder, setFolder] = useState(''); const [upFolder, setUpFolder] = useState('general');
  const d = useApi<{ items: Asset[]; folders: string[] }>(`/media?q=${encodeURIComponent(q)}&folder=${encodeURIComponent(folder)}`);
  const [sel, setSel] = useState<Asset | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]); const [files, setFiles] = useState<File[]>([]);
  const up = useRef<HTMLInputElement>(null); const rep = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => { const fs = [...(e.target.files ?? [])]; setFiles(fs); setPreviews(fs.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))); };
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setErr(''); setMsg(''); try { await fn(); setMsg(ok); d.reload(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); } };
  const upload = () => run(async () => { const fd = new FormData(); files.forEach((f) => fd.append('files', f)); fd.append('folder', upFolder); await api('/media/upload', { method: 'POST', form: fd }); setFiles([]); setPreviews([]); if (up.current) up.current.value = ''; }, 'Uploaded.');
  const replace = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !sel) return; run(async () => { const fd = new FormData(); fd.append('file', f); const r = await api(`/media/${sel._id}/replace`, { method: 'POST', form: fd }); setSel(r.asset); }, 'Image replaced everywhere it is used.'); e.target.value = ''; };
  useEffect(() => { if (sel) setSel(d.data?.items.find((x) => x._id === sel._id) ?? sel); }, [d.data]); // eslint-disable-line
  return (<div><Title>Media library</Title>
    <div className="mb-6 space-y-3 bg-white p-5"><div className="flex flex-wrap items-end gap-3"><Field label="Upload to folder"><input className="field w-44" value={upFolder} onChange={(e) => setUpFolder(e.target.value)} /></Field>
      <input ref={up} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={pick} /><button className="btn btn-line" onClick={() => up.current?.click()}>Select images</button><button className="btn btn-dark" disabled={!files.length || busy} onClick={upload}>{busy ? 'Uploading…' : `Upload ${files.length || ''}`}</button></div>
      {previews.length > 0 && <div className="flex flex-wrap gap-3">{previews.map((p) => <div key={p.url} className="w-24"><img src={p.url} alt="Preview" className="h-24 w-24 object-cover" /><p className="truncate text-xs">{p.name}</p></div>)}</div>}
      <p className="text-xs text-roast">JPEG, PNG, WebP or AVIF, up to 8 MB each. Files are stored on Cloudinary.</p></div>
    {err && <div className="mb-4"><Notice kind="error">{err}</Notice></div>}{msg && <div className="mb-4"><Notice kind="ok">{msg}</Notice></div>}
    <div className="mb-4 flex gap-3"><input className="field max-w-xs" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search images" /><select className="field max-w-[12rem]" value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Folder"><option value="">All folders</option>{d.data?.folders.map((f) => <option key={f}>{f}</option>)}</select></div>
    <div className="grid gap-6 xl:grid-cols-3"><div className="xl:col-span-2">{d.loading ? <Skeleton className="h-64" /> : d.error ? <Notice kind="error">{d.error}</Notice> : !d.data?.items.length ? <p className="text-roast">No images found.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{d.data.items.map((a) => <button key={a._id} onClick={() => setSel(a)} aria-pressed={sel?._id === a._id} className={sel?._id === a._id ? 'ring-2 ring-espresso' : ''}><div className="aspect-square overflow-hidden bg-cream"><Img src={a.url} alt={a.alt || a.filename} label={a.filename} className="text-sm" /></div><p className="mt-1 truncate text-left text-xs">{a.filename}</p></button>)}</div>}</div>
      <aside className="bg-white p-5">{!sel ? <p className="text-sm text-roast">Select an image to edit it.</p> : <div className="space-y-3"><div className="aspect-[4/3] overflow-hidden bg-cream"><Img src={sel.url} alt={sel.alt} label={sel.filename} /></div>
        <Field label="File name"><input className="field" value={sel.filename} onChange={(e) => setSel({ ...sel, filename: e.target.value })} /></Field><Field label="Alt text"><input className="field" value={sel.alt} onChange={(e) => setSel({ ...sel, alt: e.target.value })} /></Field><Field label="Folder"><input className="field" value={sel.folder} onChange={(e) => setSel({ ...sel, folder: e.target.value })} /></Field>
        <p className="text-xs text-roast">{sel.width}×{sel.height}px · {sel.format?.toUpperCase()} · {sel.bytes ? `${Math.round(sel.bytes / 1024)} KB` : ''}</p><p className="break-all text-xs text-roast">{sel.url}</p>
        <div className="flex flex-wrap gap-2"><button className="btn btn-dark !py-2" disabled={busy} onClick={() => run(() => api(`/media/${sel._id}`, { method: 'PATCH', body: { alt: sel.alt, filename: sel.filename, folder: sel.folder || 'general' } }), 'Saved.')}>Save</button>
          <input ref={rep} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={replace} /><button className="btn btn-line !py-2" disabled={busy} onClick={() => rep.current?.click()}>Replace file</button>
          <button className="btn btn-line !py-2" disabled={busy} onClick={() => { if (confirm('Delete this image? It will be removed from every product, origin, article and homepage section that uses it.')) run(async () => { await api(`/media/${sel._id}`, { method: 'DELETE' }); setSel(null); }, 'Deleted.'); }}>Delete</button></div></div>}</aside></div></div>);
}

const LABELS: Record<string, string> = { hero: 'Hero', intro: 'Brand introduction', origins: 'Featured origins', coffees: 'Featured coffee selection', barista: 'AI Barista', journal: 'Coffee journal', philosophy: 'Brand philosophy', newsletter: 'Newsletter' };

export function AdminHomepage() {
  const d = useApi<{ settings: any }>('/settings/admin'); const coffees = useApi<{ items: any[] }>('/coffees/admin/list'); const arts = useApi<{ items: any[] }>('/articles/admin/list');
  const [secs, setSecs] = useState<any[]>([]); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (d.data) setSecs([...d.data.settings.homepage].sort((a: any, b: any) => a.order - b.order).map((s: any) => ({ key: s.key, visible: s.visible, order: s.order, content: s.content ?? {} }))); }, [d.data]);
  const upd = (i: number, patch: any) => setSecs((p) => p.map((s, j) => j === i ? { ...s, content: { ...s.content, ...patch } } : s));
  const move = (i: number, dir: number) => setSecs((p) => { const n = [...p]; const j = i + dir; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const save = async () => { setErr(''); setMsg(''); try { await api('/settings/admin/homepage', { method: 'PUT', body: secs.map((s, i) => ({ ...s, order: i, content: JSON.parse(JSON.stringify(s.content, (_k, v) => v === null ? undefined : v)) })) }); setMsg('Homepage saved. Reload the public site to see the changes.'); } catch (e) { setErr(errText(e)); } };
  const txt = (i: number, k: string, label: string, area = false) => <Field label={label}>{area ? <textarea rows={3} className="field" value={secs[i].content[k] ?? ''} onChange={(e) => upd(i, { [k]: e.target.value })} /> : <input className="field" value={secs[i].content[k] ?? ''} onChange={(e) => upd(i, { [k]: e.target.value })} />}</Field>;
  const cta = (i: number, k: string, label: string) => <div className="grid gap-3 sm:grid-cols-2"><Field label={`${label} text`}><input className="field" value={secs[i].content[k]?.label ?? ''} onChange={(e) => upd(i, { [k]: { ...secs[i].content[k], label: e.target.value } })} /></Field><Field label={`${label} link`}><input className="field" value={secs[i].content[k]?.href ?? ''} onChange={(e) => upd(i, { [k]: { ...secs[i].content[k], href: e.target.value } })} /></Field></div>;
  const img = (i: number, k: string, label: string) => <ImageField label={label} value={secs[i].content[k]?.url ? secs[i].content[k] : null} onChange={(v: ImageRef | null) => upd(i, { [k]: v })} folder="homepage" />;
  const pickMany = (i: number, items: any[], label: string, nameKey: string) => <fieldset><legend className="mb-1 text-sm text-roast">{label} (leave empty to use the default selection)</legend><div className="flex flex-wrap gap-x-5 gap-y-1">{items.map((x) => { const ids: string[] = secs[i].content.featuredIds ?? []; return <Toggle key={x._id} label={x[nameKey]} checked={ids.includes(x._id)} onChange={(v) => upd(i, { featuredIds: v ? [...ids, x._id] : ids.filter((y) => y !== x._id) })} />; })}</div></fieldset>;
  if (d.loading) return <Skeleton className="h-96" />; if (d.error) return <Notice kind="error">{d.error}</Notice>;
  return (<div><Title actions={<button className="btn btn-dark" onClick={save}>Save homepage</button>}>Homepage</Title>{err && <Notice kind="error">{err}</Notice>}{msg && <Notice kind="ok">{msg}</Notice>}
    <div className="mt-4 space-y-4">{secs.map((s, i) => <details key={s.key} className="bg-white p-5" open={i === 0}><summary className="flex cursor-pointer flex-wrap items-center gap-4"><span className="font-serif text-2xl">{LABELS[s.key] ?? s.key}</span><span className="text-sm text-roast">{s.visible ? 'Visible' : 'Hidden'}</span></summary>
      <div className="mt-4 space-y-4"><div className="flex flex-wrap items-center gap-5"><Toggle label="Show on homepage" checked={s.visible} onChange={(v) => setSecs((p) => p.map((x, j) => j === i ? { ...x, visible: v } : x))} /><button className="underline text-sm" disabled={i === 0} onClick={() => move(i, -1)}>Move up</button><button className="underline text-sm" disabled={i === secs.length - 1} onClick={() => move(i, 1)}>Move down</button></div>
        {txt(i, 'headline', 'Heading')}{s.key !== 'coffees' || true ? txt(i, 'text', 'Description', true) : null}
        {s.key === 'hero' && <>{cta(i, 'primaryCta', 'Primary button')}{cta(i, 'secondaryCta', 'Secondary button')}{img(i, 'image', 'Hero background image')}</>}
        {s.key === 'intro' && <>{img(i, 'image', 'Main image')}{img(i, 'imageSecondary', 'Second image')}</>}
        {s.key === 'barista' && <>{cta(i, 'cta', 'Button')}{img(i, 'image', 'Background image')}</>}
        {s.key === 'philosophy' && img(i, 'image', 'Background image')}
        {s.key === 'coffees' && pickMany(i, (coffees.data?.items ?? []).filter((c) => c.published), 'Featured coffees', 'name')}
        {s.key === 'journal' && pickMany(i, (arts.data?.items ?? []).filter((a) => a.published), 'Featured articles', 'title')}
        {s.key === 'origins' && <p className="text-sm text-roast">Origins shown here are the ones marked “featured” in Origins.</p>}</div></details>)}</div></div>);
}

export function AdminSettings() {
  const d = useApi<{ settings: any }>('/settings/admin'); const [f, setF] = useState<any>(null); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (d.data) { const s = d.data.settings; setF({ brandName: s.brandName ?? '', tagline: s.tagline ?? '', logo: s.logo?.url ? s.logo : null, contactEmail: s.contactEmail ?? '', phone: s.phone ?? '', currency: s.currency, shippingFee: s.shippingFee, freeShippingThreshold: s.freeShippingThreshold, social: { instagram: '', facebook: '', x: '', ...s.social }, seo: { title: '', description: '', ...s.seo }, announcement: { enabled: false, text: '', ...s.announcement }, storeOpen: s.storeOpen, footer: { description: '', privacyUrl: '', termsUrl: '', ...s.footer } }); } }, [d.data]);
  if (!f) return d.error ? <Notice kind="error">{d.error}</Notice> : <Skeleton className="h-96" />;
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v })); const sub = (k: string, kk: string, v: any) => setF((p: any) => ({ ...p, [k]: { ...p[k], [kk]: v } }));
  const save = async () => { setErr(''); setMsg(''); try { await api('/settings/admin', { method: 'PUT', body: { ...f, logo: f.logo ?? undefined, shippingFee: Number(f.shippingFee), freeShippingThreshold: Number(f.freeShippingThreshold) } }); setMsg('Settings saved.'); } catch (e) { setErr(errText(e)); } };
  return (<div><Title>Settings</Title><div className="space-y-6 bg-white p-6">
    <div className="grid gap-4 md:grid-cols-2"><Field label="Brand name"><input className="field" value={f.brandName} onChange={(e) => set('brandName', e.target.value)} /></Field><Field label="Tagline"><input className="field" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
      <Field label="Contact email"><input className="field" value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field><Field label="Phone"><input className="field" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Currency (ISO code)"><input className="field" maxLength={3} value={f.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></Field><span />
      <Field label="Shipping fee"><input type="number" min={0} className="field" value={f.shippingFee} onChange={(e) => set('shippingFee', e.target.value)} /></Field><Field label="Free shipping threshold"><input type="number" min={0} className="field" value={f.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', e.target.value)} /></Field></div>
    <ImageField label="Logo (optional, replaces the text logo)" value={f.logo} onChange={(v) => set('logo', v)} folder="brand" />
    <div className="grid gap-4 md:grid-cols-3">{(['instagram', 'facebook', 'x'] as const).map((k) => <Field key={k} label={`${k[0].toUpperCase() + k.slice(1)} URL`}><input className="field" value={f.social[k]} onChange={(e) => sub('social', k, e.target.value)} /></Field>)}</div>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Default SEO title"><input className="field" value={f.seo.title} onChange={(e) => sub('seo', 'title', e.target.value)} /></Field><Field label="Default SEO description"><input className="field" value={f.seo.description} onChange={(e) => sub('seo', 'description', e.target.value)} /></Field></div>
    <Field label="Footer description"><textarea rows={2} className="field" value={f.footer.description} onChange={(e) => sub('footer', 'description', e.target.value)} /></Field>
    <div className="space-y-2"><Toggle label="Show announcement bar" checked={f.announcement.enabled} onChange={(v) => sub('announcement', 'enabled', v)} /><input className="field" placeholder="Announcement text" value={f.announcement.text} onChange={(e) => sub('announcement', 'text', e.target.value)} aria-label="Announcement text" /></div>
    <Toggle label="Store is open for orders" checked={f.storeOpen} onChange={(v) => set('storeOpen', v)} />
    {err && <Notice kind="error">{err}</Notice>}{msg && <Notice kind="ok">{msg}</Notice>}<button className="btn btn-dark" onClick={save}>Save settings</button></div></div>);
}
