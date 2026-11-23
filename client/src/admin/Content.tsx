import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api, errText } from '../lib/api';
import { grams, money } from '../lib/format';
import { Img, Skeleton } from '../components/ui';
import { Title } from './Core';
import { Field, GalleryField, ImageField, ImageRef, Notice, Tags, Toggle } from './ui';

const ROASTS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];
const PROCESSES = ['Washed', 'Natural', 'Honey', 'Anaerobic'];
const METHODS = ['V60', 'French Press', 'AeroPress', 'Espresso', 'Chemex'];
const clean = (a: string[]) => a.map((s) => s.trim()).filter(Boolean);

export function AdminProducts() {
  const d = useApi<{ items: any[] }>('/coffees/admin/list'); const [err, setErr] = useState('');
  const act = async (fn: () => Promise<unknown>) => { setErr(''); try { await fn(); d.reload(); } catch (e) { setErr(errText(e)); } };
  return (<div><Title actions={<Link to="/admin/products/new" className="btn btn-dark">New coffee</Link>}>Coffees</Title>{err && <Notice kind="error">{err}</Notice>}
    {d.loading ? <Skeleton className="h-64" /> : d.error ? <Notice kind="error">{d.error}</Notice> : !d.data?.items.length ? <p className="text-roast">No coffees yet.</p> :
      <div className="overflow-x-auto bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-espresso/15 text-roast"><tr>{['', 'Coffee', 'Origin', 'From', 'Stock', 'Status', ''].map((h, i) => <th key={i} className="p-3 font-normal">{h}</th>)}</tr></thead><tbody>
        {d.data.items.map((c) => <tr key={c._id} className="border-b border-espresso/10"><td className="p-3"><div className="h-12 w-10 overflow-hidden"><Img src={c.images[0]?.url} label={c.name[0]} alt="" className="text-lg" /></div></td>
          <td className="p-3"><Link className="underline" to={`/admin/products/${c._id}`}>{c.name}</Link>{c.featured && <span className="ml-2 text-xs text-roast">featured</span>}</td><td className="p-3">{c.origin?.country}</td><td className="p-3">{money(c.fromPrice)}</td>
          <td className="p-3">{c.variants.map((v: any) => `${grams(v.weight)}: ${v.stock}`).join(' · ')}</td><td className="p-3">{c.published ? 'Published' : 'Draft'}</td>
          <td className="space-x-3 p-3 text-right"><button className="underline" onClick={() => act(() => api(`/coffees/${c._id}/duplicate`, { method: 'POST' }))}>Duplicate</button><button className="underline" onClick={() => { if (confirm(`Delete ${c.name}? Past orders keep their own copy of the product details.`)) act(() => api(`/coffees/${c._id}`, { method: 'DELETE' })); }}>Delete</button></td></tr>)}</tbody></table></div>}</div>);
}

const blank = () => ({ name: '', description: '', origin: '', region: '', producer: '', altitude: '', process: 'Washed', roast: 'Medium', flavorNotes: [] as string[], brewMethods: [] as string[], variants: [{ weight: 250, price: 20, stock: 20 }], images: [] as ImageRef[], featured: false, published: false, seo: { title: '', description: '' } });

export function ProductForm() {
  const { id } = useParams(); const nav = useNavigate(); const isNew = id === 'new';
  const origins = useApi<{ items: any[] }>('/origins/admin/all');
  const list = useApi<{ items: any[] }>(isNew ? null : '/coffees/admin/list');
  const [f, setF] = useState<any>(blank()); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const c = list.data?.items.find((x) => x._id === id); if (c) setF({ ...blank(), ...c, origin: c.origin?._id ?? c.origin, seo: { title: c.seo?.title ?? '', description: c.seo?.description ?? '' } }); }, [list.data, id]);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(''); setMsg('');
    const body = { name: f.name, description: f.description, origin: f.origin, region: f.region || undefined, producer: f.producer || undefined, altitude: f.altitude || undefined, process: f.process, roast: f.roast,
      flavorNotes: clean(f.flavorNotes), brewMethods: f.brewMethods, variants: f.variants.map((v: any) => ({ weight: Number(v.weight), price: Number(v.price), stock: Number(v.stock) })),
      images: f.images.map((i: ImageRef) => ({ asset: i.asset, url: i.url, alt: i.alt ?? '' })), featured: f.featured, published: f.published, seo: f.seo };
    try { const r = await api(isNew ? '/coffees' : `/coffees/${id}`, { method: isNew ? 'POST' : 'PUT', body }); setMsg('Saved.'); if (isNew) nav(`/admin/products/${r.coffee._id}`, { replace: true }); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  if (!isNew && list.loading) return <Skeleton className="h-96" />;
  return (<div><Title actions={<Link to="/admin/products" className="underline">All coffees</Link>}>{isNew ? 'New coffee' : f.name || 'Coffee'}</Title>
    <div className="space-y-6 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2"><Field label="Name"><input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Origin"><select className="field" value={f.origin} onChange={(e) => set('origin', e.target.value)}><option value="">Select origin</option>{origins.data?.items.map((o) => <option key={o._id} value={o._id}>{o.country}</option>)}</select></Field>
        <Field label="Region"><input className="field" value={f.region ?? ''} onChange={(e) => set('region', e.target.value)} /></Field><Field label="Farm or producer"><input className="field" value={f.producer ?? ''} onChange={(e) => set('producer', e.target.value)} /></Field>
        <Field label="Altitude"><input className="field" value={f.altitude ?? ''} onChange={(e) => set('altitude', e.target.value)} /></Field>
        <Field label="Processing"><select className="field" value={f.process} onChange={(e) => set('process', e.target.value)}>{PROCESSES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Roast"><select className="field" value={f.roast} onChange={(e) => set('roast', e.target.value)}>{ROASTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Tasting notes"><Tags value={f.flavorNotes} onChange={(v) => set('flavorNotes', v)} /></Field></div>
      <Field label="Description"><textarea rows={4} className="field" value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
      <fieldset><legend className="mb-1 text-sm text-roast">Recommended brewing methods</legend><div className="flex flex-wrap gap-4">{METHODS.map((m) => <Toggle key={m} label={m} checked={f.brewMethods.includes(m)} onChange={(v) => set('brewMethods', v ? [...f.brewMethods, m] : f.brewMethods.filter((x: string) => x !== m))} />)}</div></fieldset>
      <div><p className="mb-1 text-sm text-roast">Weights, prices and stock</p>{f.variants.map((v: any, i: number) => <div key={i} className="mb-2 flex flex-wrap items-end gap-3">
        {(['weight', 'price', 'stock'] as const).map((k) => <label key={k} className="text-xs text-roast">{k === 'weight' ? 'Grams' : k[0].toUpperCase() + k.slice(1)}<input type="number" min={0} className="field mt-1 w-28" value={v[k]} onChange={(e) => set('variants', f.variants.map((x: any, j: number) => j === i ? { ...x, [k]: e.target.value } : x))} /></label>)}
        {f.variants.length > 1 && <button type="button" className="underline" onClick={() => set('variants', f.variants.filter((_: any, j: number) => j !== i))}>Remove</button>}</div>)}
        <button type="button" className="btn btn-line !py-2" onClick={() => set('variants', [...f.variants, { weight: 500, price: 30, stock: 10 }])}>Add weight</button></div>
      <GalleryField value={f.images} onChange={(v) => set('images', v)} folder="products" />
      <div className="grid gap-4 md:grid-cols-2"><Field label="SEO title"><input className="field" value={f.seo.title} onChange={(e) => set('seo', { ...f.seo, title: e.target.value })} /></Field><Field label="SEO description"><input className="field" value={f.seo.description} onChange={(e) => set('seo', { ...f.seo, description: e.target.value })} /></Field></div>
      <div className="flex gap-6"><Toggle label="Published" checked={f.published} onChange={(v) => set('published', v)} /><Toggle label="Featured" checked={f.featured} onChange={(v) => set('featured', v)} /></div>
      {err && <Notice kind="error">{err}</Notice>}{msg && <Notice kind="ok">{msg}</Notice>}<button className="btn btn-dark" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save coffee'}</button></div></div>);
}

export function AdminOrigins() {
  const d = useApi<{ items: any[] }>('/origins/admin/all'); const [edit, setEdit] = useState<any | null>(null); const [err, setErr] = useState('');
  const blankO = { country: '', region: '', description: '', tastingNotes: [] as string[], image: null as ImageRef | null, featured: true, published: true, order: 0 };
  const save = async () => { setErr(''); try { const body = { ...edit, tastingNotes: clean(edit.tastingNotes), image: edit.image ?? undefined }; delete body._id; delete body.slug; delete body.createdAt; delete body.updatedAt; delete body.__v; await api(edit._id ? `/origins/${edit._id}` : '/origins', { method: edit._id ? 'PUT' : 'POST', body }); setEdit(null); d.reload(); } catch (e) { setErr(errText(e)); } };
  return (<div><Title actions={<button className="btn btn-dark" onClick={() => setEdit(blankO)}>New origin</button>}>Origins</Title>
    {edit && <div className="mb-8 space-y-4 bg-white p-6"><div className="grid gap-4 md:grid-cols-2"><Field label="Country"><input className="field" value={edit.country} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></Field><Field label="Region"><input className="field" value={edit.region ?? ''} onChange={(e) => setEdit({ ...edit, region: e.target.value })} /></Field></div>
      <Field label="Description"><textarea rows={3} className="field" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field><Field label="Featured tasting notes"><Tags value={edit.tastingNotes ?? []} onChange={(v) => setEdit({ ...edit, tastingNotes: v })} /></Field>
      <ImageField label="Photograph" value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} folder="origins" />
      <div className="flex flex-wrap items-center gap-6"><Toggle label="Published" checked={edit.published} onChange={(v) => setEdit({ ...edit, published: v })} /><Toggle label="Featured on homepage" checked={edit.featured} onChange={(v) => setEdit({ ...edit, featured: v })} /><label className="text-sm text-roast">Order <input type="number" className="field ml-2 inline-block w-20" value={edit.order} onChange={(e) => setEdit({ ...edit, order: Number(e.target.value) })} /></label></div>
      {err && <Notice kind="error">{err}</Notice>}<div className="flex gap-3"><button className="btn btn-dark" onClick={save}>Save origin</button><button className="btn btn-line" onClick={() => { setEdit(null); setErr(''); }}>Cancel</button></div></div>}
    {d.loading ? <Skeleton className="h-48" /> : d.error ? <Notice kind="error">{d.error}</Notice> : <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{d.data?.items.map((o) => <li key={o._id} className="flex gap-4 bg-white p-4"><div className="h-24 w-20 shrink-0 overflow-hidden"><Img src={o.image?.url} label={o.country} alt={o.country} className="text-lg" /></div><div className="text-sm"><p className="font-serif text-2xl">{o.country}</p><p className="text-roast">{o.region} · {o.published ? 'Published' : 'Hidden'}{o.featured ? ' · Featured' : ''}</p><div className="mt-2 space-x-3"><button className="underline" onClick={() => setEdit(o)}>Edit</button><button className="underline" onClick={async () => { if (confirm(`Delete ${o.country}?`)) { try { await api(`/origins/${o._id}`, { method: 'DELETE' }); d.reload(); } catch (e) { setErr(errText(e)); } } }}>Delete</button></div></div></li>)}</ul>}
    {!edit && err && <div className="mt-4"><Notice kind="error">{err}</Notice></div>}</div>);
}

export function AdminArticles() {
  const d = useApi<{ items: any[] }>('/articles/admin/list'); const [err, setErr] = useState('');
  return (<div><Title actions={<Link to="/admin/articles/new" className="btn btn-dark">New article</Link>}>Journal</Title>{err && <Notice kind="error">{err}</Notice>}
    {d.loading ? <Skeleton className="h-48" /> : d.error ? <Notice kind="error">{d.error}</Notice> : !d.data?.items.length ? <p className="text-roast">No articles yet.</p> : <ul className="divide-y divide-espresso/10 bg-white">{d.data.items.map((a) => <li key={a._id} className="flex items-center justify-between gap-4 p-4 text-sm"><span><Link className="font-serif text-2xl underline" to={`/admin/articles/${a._id}`}>{a.title}</Link><span className="block text-roast">{a.category} · {a.published ? 'Published' : 'Draft'}{a.featured ? ' · Featured' : ''}</span></span><button className="underline" onClick={async () => { if (confirm(`Delete "${a.title}"?`)) { try { await api(`/articles/${a._id}`, { method: 'DELETE' }); d.reload(); } catch (e) { setErr(errText(e)); } } }}>Delete</button></li>)}</ul>}</div>);
}

type Block = { type: 'heading' | 'paragraph' | 'quote' | 'list' | 'image'; text?: string; items?: string[]; url?: string; alt?: string };
export function ArticleForm() {
  const { id } = useParams(); const nav = useNavigate(); const isNew = id === 'new';
  const d = useApi<{ article: any }>(isNew ? null : `/articles/admin/${id}`);
  const [f, setF] = useState<any>({ title: '', excerpt: '', category: 'Brewing', blocks: [] as Block[], cover: null, readingTime: 4, featured: false, published: false, publishedAt: new Date().toISOString().slice(0, 10), seo: { title: '', description: '' } });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { const a = d.data?.article; if (a) setF({ ...f, ...a, cover: a.cover?.url ? a.cover : null, publishedAt: String(a.publishedAt).slice(0, 10), seo: { title: a.seo?.title ?? '', description: a.seo?.description ?? '' } }); }, [d.data]); // eslint-disable-line
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setBlock = (i: number, b: Block) => set('blocks', f.blocks.map((x: Block, j: number) => j === i ? b : x));
  const save = async () => {
    setErr(''); setMsg('');
    const body = { title: f.title, excerpt: f.excerpt, category: f.category, blocks: f.blocks.map((b: Block) => b.type === 'list' ? { type: 'list', items: clean(b.items ?? []) } : b.type === 'image' ? { type: 'image', url: b.url, alt: b.alt } : { type: b.type, text: b.text ?? '' }), cover: f.cover?.url ? { asset: f.cover.asset, url: f.cover.url, alt: f.cover.alt } : undefined,
      readingTime: Number(f.readingTime), featured: f.featured, published: f.published, publishedAt: f.publishedAt, seo: f.seo };
    try { const r = await api(isNew ? '/articles' : `/articles/${id}`, { method: isNew ? 'POST' : 'PUT', body }); setMsg('Saved.'); if (isNew) nav(`/admin/articles/${r.article._id}`, { replace: true }); } catch (e) { setErr(errText(e)); }
  };
  if (!isNew && d.loading) return <Skeleton className="h-96" />;
  return (<div><Title actions={<Link to="/admin/articles" className="underline">All articles</Link>}>{isNew ? 'New article' : f.title || 'Article'}</Title><div className="space-y-6 bg-white p-6">
    <div className="grid gap-4 md:grid-cols-2"><Field label="Title"><input className="field" value={f.title} onChange={(e) => set('title', e.target.value)} /></Field><Field label="Category"><input className="field" value={f.category} onChange={(e) => set('category', e.target.value)} /></Field>
      <Field label="Publication date"><input type="date" className="field" value={f.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></Field><Field label="Reading time (minutes)"><input type="number" min={1} className="field" value={f.readingTime} onChange={(e) => set('readingTime', e.target.value)} /></Field></div>
    <Field label="Excerpt"><textarea rows={2} className="field" value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></Field><ImageField label="Cover image" value={f.cover} onChange={(v) => set('cover', v)} folder="articles" />
    <div><p className="mb-2 text-sm text-roast">Content</p><div className="space-y-3">{f.blocks.map((b: Block, i: number) => (
      <div key={i} className="border border-espresso/20 p-3"><div className="mb-2 flex items-center gap-2 text-xs"><span className="text-roast">{b.type}</span><button type="button" className="ml-auto underline" disabled={i === 0} onClick={() => { const n = [...f.blocks]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set('blocks', n); }}>Up</button><button type="button" className="underline" disabled={i === f.blocks.length - 1} onClick={() => { const n = [...f.blocks]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set('blocks', n); }}>Down</button><button type="button" className="underline" onClick={() => set('blocks', f.blocks.filter((_: Block, j: number) => j !== i))}>Remove</button></div>
        {b.type === 'list' ? <textarea aria-label="List items, one per line" rows={4} className="field" value={(b.items ?? []).join('\n')} onChange={(e) => setBlock(i, { ...b, items: e.target.value.split('\n') })} />
          : b.type === 'image' ? <ImageField label="Inline image" value={b.url ? { url: b.url, alt: b.alt } : null} onChange={(v) => setBlock(i, { ...b, url: v?.url, alt: v?.alt })} folder="articles" />
          : <textarea aria-label={b.type} rows={b.type === 'heading' ? 1 : 4} className="field" value={b.text ?? ''} onChange={(e) => setBlock(i, { ...b, text: e.target.value })} />}</div>))}</div>
      <div className="mt-3 flex flex-wrap gap-2">{(['heading', 'paragraph', 'quote', 'list', 'image'] as const).map((t) => <button key={t} type="button" className="btn btn-line !px-4 !py-2" onClick={() => set('blocks', [...f.blocks, t === 'list' ? { type: t, items: [''] } : { type: t, text: '' }])}>Add {t}</button>)}</div></div>
    <div className="grid gap-4 md:grid-cols-2"><Field label="SEO title"><input className="field" value={f.seo.title} onChange={(e) => set('seo', { ...f.seo, title: e.target.value })} /></Field><Field label="SEO description"><input className="field" value={f.seo.description} onChange={(e) => set('seo', { ...f.seo, description: e.target.value })} /></Field></div>
    <div className="flex gap-6"><Toggle label="Published" checked={f.published} onChange={(v) => set('published', v)} /><Toggle label="Featured" checked={f.featured} onChange={(v) => set('featured', v)} /></div>
    {err && <Notice kind="error">{err}</Notice>}{msg && <Notice kind="ok">{msg}</Notice>}<button className="btn btn-dark" onClick={save}>Save article</button></div></div>);
}
