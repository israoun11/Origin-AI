import { FormEvent, ReactNode, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useApi } from '../hooks/useApi';
import { api, download, errText } from '../lib/api';
import { date, grams, money } from '../lib/format';
import { ErrorState, Skeleton } from '../components/ui';
import { Notice } from './ui';

export function AdminLogin() {
  const { adminLogin, admin } = useAuth(); const nav = useNavigate(); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (admin) return <Navigate to="/admin" replace />;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); setBusy(true); setErr('');
    try { await adminLogin(String(fd.get('email')), String(fd.get('password'))); nav('/admin', { replace: true }); } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-espresso p-6"><form onSubmit={submit} className="w-full max-w-sm bg-ivory p-8"><h1 className="font-serif text-4xl tracking-[0.15em]">ORIGIN</h1><p className="mt-1 text-sm text-roast">Administration</p>
      <label className="mt-6 block"><span className="mb-1 block text-sm text-roast">Email</span><input name="email" type="email" required className="field" autoComplete="username" /></label>
      <label className="mt-4 block"><span className="mb-1 block text-sm text-roast">Password</span><input name="password" type="password" required className="field" autoComplete="current-password" /></label>
      {err && <div className="mt-4"><Notice kind="error">{err}</Notice></div>}<button disabled={busy} className="btn btn-dark mt-6 w-full">{busy ? 'Signing in…' : 'Sign in'}</button></form></div>
  );
}

export function AdminLayout() {
  const { admin, adminLogout } = useAuth(); const nav = useNavigate();
  if (!admin) return <Navigate to="/admin/login" replace />;
  const links = [['/admin', 'Overview', true], ['/admin/homepage', 'Homepage'], ['/admin/products', 'Coffees'], ['/admin/origins', 'Origins'], ['/admin/articles', 'Journal'], ['/admin/media', 'Media library'], ['/admin/orders', 'Orders'], ['/admin/customers', 'Customers'], ['/admin/newsletter', 'Newsletter'], ['/admin/settings', 'Settings']] as const;
  return (
    <div className="min-h-screen bg-cream/40 lg:flex">
      <aside className="bg-espresso p-5 text-ivory lg:min-h-screen lg:w-60 lg:shrink-0"><p className="font-serif text-3xl tracking-[0.15em]">ORIGIN</p>
        <nav aria-label="Admin" className="mt-6 flex gap-1 overflow-x-auto text-sm lg:flex-col">{links.map(([to, label, end]) => <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `whitespace-nowrap px-3 py-2 ${isActive ? 'bg-ivory text-espresso' : 'hover:bg-ivory/10'}`}>{label}</NavLink>)}</nav>
        <div className="mt-6 hidden text-sm text-ivory/70 lg:block"><p>{admin.email}</p><Link to="/" className="mt-2 block underline">View site</Link><button className="mt-2 underline" onClick={() => { adminLogout(); nav('/admin/login'); }}>Sign out</button></div></aside>
      <div className="min-w-0 flex-1 p-5 md:p-10"><Outlet /></div>
    </div>
  );
}

export const Title = ({ children, actions }: { children: string; actions?: ReactNode }) => <div className="mb-8 flex flex-wrap items-center justify-between gap-3"><h1 className="font-serif text-5xl">{children}</h1>{actions}</div>;
const Load = ({ d }: { d: { loading: boolean; error: string | null; reload(): void } }) => d.loading ? <Skeleton className="h-64" /> : d.error ? <ErrorState message={d.error} onRetry={d.reload} /> : null;

export function Dashboard() {
  const d = useApi<any>('/admin/stats');
  const s = d.data;
  return (<div><Title>Overview</Title><Load d={d} />{s && <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Orders', s.orders], ['Revenue', money(s.revenue)], ['Customers', s.customers], ['Published coffees', s.publishedProducts]].map(([k, v]) => <div key={k as string} className="bg-white p-5"><p className="text-sm text-roast">{k}</p><p className="mt-2 font-serif text-4xl">{v}</p></div>)}</div>
    <div className="mt-8 grid gap-8 xl:grid-cols-2">
      <section className="bg-white p-5"><h2 className="font-serif text-3xl">Recent orders</h2>{s.recentOrders.length === 0 ? <p className="mt-3 text-sm text-roast">No orders yet.</p> : <ul className="mt-3 divide-y divide-espresso/10">{s.recentOrders.map((o: any) => <li key={o._id}><Link to={`/admin/orders/${o._id}`} className="flex justify-between py-3 text-sm hover:bg-champagne/20"><span>{o.orderNumber} · {o.customer.name}</span><span>{o.status} · {money(o.total, o.currency)}</span></Link></li>)}</ul>}</section>
      <section className="bg-white p-5"><h2 className="font-serif text-3xl">Low stock</h2>{s.lowStock.length === 0 ? <p className="mt-3 text-sm text-roast">Nothing running low.</p> : <ul className="mt-3 divide-y divide-espresso/10">{s.lowStock.map((c: any) => <li key={c._id} className="flex justify-between py-3 text-sm"><Link className="underline" to={`/admin/products/${c._id}`}>{c.name}</Link><span>{c.variants.filter((v: any) => v.stock <= 5).map((v: any) => `${grams(v.weight)}: ${v.stock}`).join(', ')}</span></li>)}</ul>}</section></div></>}</div>);
}

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
export function AdminOrders() {
  const [q, setQ] = useState(''); const [st, setSt] = useState('');
  const d = useApi<{ items: any[] }>(`/admin/orders?q=${encodeURIComponent(q)}&status=${st}`);
  return (<div><Title>Orders</Title><div className="mb-4 flex gap-3"><input className="field max-w-xs" placeholder="Search number, name, email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" /><select className="field max-w-[12rem]" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
    <Load d={d} />{d.data && (d.data.items.length === 0 ? <p className="text-roast">No orders match.</p> : <div className="overflow-x-auto bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-espresso/15 text-roast"><tr>{['Order', 'Date', 'Customer', 'Status', 'Payment', 'Total'].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr></thead><tbody>{d.data.items.map((o) => <tr key={o._id} className="border-b border-espresso/10 hover:bg-champagne/20"><td className="p-3"><Link className="underline" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td><td className="p-3">{date(o.createdAt)}</td><td className="p-3">{o.customer.name}</td><td className="p-3">{o.status}</td><td className="p-3">{o.paymentStatus}</td><td className="p-3">{money(o.total, o.currency)}</td></tr>)}</tbody></table></div>)}</div>);
}

export function AdminOrderDetail() {
  const { id } = useParams(); const d = useApi<{ order: any }>(`/admin/orders/${id}`); const [note, setNote] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const patch = async (body: object) => { setErr(''); setMsg(''); try { const r = await api(`/admin/orders/${id}`, { method: 'PATCH', body }); d.setData(r); setMsg('Saved.'); setNote(''); } catch (e) { setErr(errText(e)); } };
  const o = d.data?.order;
  return (<div><Title actions={<Link to="/admin/orders" className="underline">All orders</Link>}>{o ? o.orderNumber : 'Order'}</Title><Load d={d} />{o && <div className="grid gap-8 xl:grid-cols-3">
    <section className="space-y-4 bg-white p-5 xl:col-span-2"><ul className="divide-y divide-espresso/10 text-sm">{o.items.map((i: any, k: number) => <li key={k} className="flex justify-between py-3"><span>{i.name} · {grams(i.weight)} × {i.quantity}</span><span>{money(i.unitPrice * i.quantity, o.currency)}</span></li>)}</ul>
      <p className="text-right text-sm">Subtotal {money(o.subtotal, o.currency)} · Shipping {money(o.shipping, o.currency)} · <strong>Total {money(o.total, o.currency)}</strong></p>
      <div className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-roast">Customer</p><p>{o.customer.name}</p><p>{o.customer.email}</p><p>{o.customer.phone}</p></div><div><p className="text-roast">Delivery</p><p>{o.shippingAddress.address}</p><p>{o.shippingAddress.city}, {o.shippingAddress.country}</p>{o.shippingAddress.notes && <p className="mt-1 italic">{o.shippingAddress.notes}</p>}</div></div></section>
    <section className="space-y-4 bg-white p-5"><label className="block text-sm"><span className="mb-1 block text-roast">Order status</span><select className="field" value={o.status} disabled={o.status === 'Cancelled'} onChange={(e) => { if (e.target.value !== 'Cancelled' || confirm('Cancel this order and restore stock?')) patch({ status: e.target.value }); }}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="block text-sm"><span className="mb-1 block text-roast">Payment status</span><select className="field" value={o.paymentStatus} onChange={(e) => patch({ paymentStatus: e.target.value })}>{['Unpaid', 'Paid', 'Refunded'].map((s) => <option key={s}>{s}</option>)}</select></label>
      <p className="text-xs text-roast">Payment method: {o.paymentMethod === 'cod' ? 'cash on delivery' : 'simulated'}. {o.stockRestored && 'Stock restored after cancellation.'}</p>
      <div><p className="mb-1 text-sm text-roast">Internal notes</p><ul className="mb-2 space-y-1 text-sm">{o.internalNotes.map((n: any, i: number) => <li key={i} className="border-l-2 border-roast pl-2">{n.text}<span className="block text-xs text-roast">{date(n.at)}</span></li>)}</ul><textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" /><button className="btn btn-line mt-2 !py-2" disabled={!note.trim()} onClick={() => patch({ note })}>Add note</button></div>
      {msg && <Notice kind="ok">{msg}</Notice>}{err && <Notice kind="error">{err}</Notice>}</section></div>}</div>);
}

export function AdminCustomers() {
  const [q, setQ] = useState(''); const d = useApi<{ items: any[] }>(`/admin/customers?q=${encodeURIComponent(q)}`);
  return (<div><Title>Customers</Title><input className="field mb-4 max-w-xs" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" /><Load d={d} />{d.data && (d.data.items.length === 0 ? <p className="text-roast">No customers found.</p> : <div className="overflow-x-auto bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-espresso/15 text-roast"><tr>{['Name', 'Email', 'Joined'].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr></thead><tbody>{d.data.items.map((c) => <tr key={c._id} className="border-b border-espresso/10"><td className="p-3"><Link to={`/admin/customers/${c._id}`} className="underline">{c.name}</Link></td><td className="p-3">{c.email}</td><td className="p-3">{date(c.createdAt)}</td></tr>)}</tbody></table></div>)}</div>);
}
export function AdminCustomer() {
  const { id } = useParams(); const d = useApi<{ customer: any; orders: any[] }>(`/admin/customers/${id}`);
  return (<div><Title actions={<Link to="/admin/customers" className="underline">All customers</Link>}>{d.data?.customer.name ?? 'Customer'}</Title><Load d={d} />{d.data && <div className="bg-white p-5"><p className="text-sm">{d.data.customer.email} · {d.data.customer.phone || 'no phone'} · joined {date(d.data.customer.createdAt)}</p><h2 className="mt-6 font-serif text-3xl">Orders</h2>{d.data.orders.length === 0 ? <p className="mt-2 text-sm text-roast">No orders.</p> : <ul className="mt-2 divide-y divide-espresso/10">{d.data.orders.map((o) => <li key={o._id}><Link className="flex justify-between py-3 text-sm underline" to={`/admin/orders/${o._id}`}><span>{o.orderNumber} · {o.status}</span><span>{money(o.total, o.currency)}</span></Link></li>)}</ul>}</div>}</div>);
}

export function AdminNewsletter() {
  const [q, setQ] = useState(''); const d = useApi<{ items: any[] }>(`/admin/newsletter?q=${encodeURIComponent(q)}`); const [err, setErr] = useState('');
  return (<div><Title actions={<button className="btn btn-dark" onClick={() => download('/admin/newsletter/export', 'subscribers.csv').catch((e) => setErr(errText(e)))}>Export CSV</button>}>Newsletter</Title>{err && <Notice kind="error">{err}</Notice>}
    <input className="field mb-4 max-w-xs" placeholder="Search email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search subscribers" /><Load d={d} />
    {d.data && (d.data.items.length === 0 ? <p className="text-roast">No subscribers.</p> : <div className="bg-white"><p className="p-3 text-sm text-roast">{d.data.items.length} subscribers</p><ul className="divide-y divide-espresso/10">{d.data.items.map((s) => <li key={s._id} className="flex items-center justify-between px-3 py-2.5 text-sm"><span>{s.email}<span className="ml-3 text-roast">{date(s.createdAt)}</span></span><button className="underline" onClick={async () => { if (confirm(`Remove ${s.email}?`)) { await api(`/admin/newsletter/${s._id}`, { method: 'DELETE' }); d.reload(); } }}>Remove</button></li>)}</ul></div>)}</div>);
}
