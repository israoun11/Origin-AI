import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useState } from 'react';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { useSettings } from '../context/settings';
import { api } from '../lib/api';
import { date, grams, money } from '../lib/format';
import { Empty, FormField, Img, Seo } from '../components/ui';

function useTotals() {
  const { subtotal } = useCart();
  const s = useSettings();
  const shipping = subtotal === 0 ? 0 : subtotal >= s.freeShippingThreshold ? 0 : s.shippingFee;
  return { subtotal, shipping, total: subtotal + shipping, currency: s.currency, threshold: s.freeShippingThreshold };
}

export function Bag() {
  const { lines, setQty, remove } = useCart();
  const t = useTotals();
  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="Your bag" />
      <h1 className="display text-6xl md:text-8xl">Your bag</h1>
      {lines.length === 0 ? <div className="mt-12"><Empty title="Your bag is empty" text="Find a coffee you will love." action={<Link to="/coffee" className="btn btn-dark">Explore coffee</Link>} /></div> : (
        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <ul className="lg:col-span-8">{lines.map((l) => (
            <li key={l.coffeeId + l.weight} className="flex gap-5 border-t border-espresso/20 py-6">
              <Link to={`/coffee/${l.slug}`} className="h-32 w-24 shrink-0 overflow-hidden"><Img src={l.image} label={l.name.split(' ')[0]} alt={l.name} className="text-xl" /></Link>
              <div className="flex flex-1 flex-col justify-between sm:flex-row">
                <div><Link to={`/coffee/${l.slug}`} className="font-serif text-3xl">{l.name}</Link><p className="text-sm text-roast">{grams(l.weight)} · {money(l.price, t.currency)} each</p></div>
                <div className="mt-3 flex items-center gap-4 sm:mt-0 sm:flex-col sm:items-end sm:justify-between">
                  <div className="flex items-center border border-espresso/30"><button aria-label="Decrease quantity" className="h-10 w-10" onClick={() => setQty(l.coffeeId, l.weight, l.quantity - 1)}>−</button><span className="w-8 text-center">{l.quantity}</span><button aria-label="Increase quantity" disabled={l.quantity >= l.max} className="h-10 w-10 disabled:opacity-30" onClick={() => setQty(l.coffeeId, l.weight, l.quantity + 1)}>+</button></div>
                  <p>{money(l.price * l.quantity, t.currency)}</p><button className="text-sm underline" onClick={() => remove(l.coffeeId, l.weight)}>Remove</button>
                </div>
              </div>
            </li>))}<li className="border-t border-espresso/20" /></ul>
          <aside className="lg:col-span-4"><div className="bg-cream p-7 lg:sticky lg:top-28">
            <h2 className="text-3xl">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(t.subtotal, t.currency)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{t.shipping === 0 ? 'Free' : money(t.shipping, t.currency)}</dd></div><div className="flex justify-between border-t border-espresso/25 pt-3 text-base"><dt>Total</dt><dd>{money(t.total, t.currency)}</dd></div></dl>
            {t.shipping > 0 && <p className="mt-3 text-xs text-roast">Free shipping from {money(t.threshold, t.currency)}.</p>}
            <Link to="/checkout" className="btn btn-dark mt-6 w-full">Checkout</Link></div></aside>
        </div>)}
    </div>
  );
}

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'), email: z.string().trim().email('Enter a valid email'), phone: z.string().trim().min(6, 'Enter a phone number'),
  country: z.string().trim().min(2, 'Enter your country'), city: z.string().trim().min(2, 'Enter your city'), address: z.string().trim().min(4, 'Enter your address'),
  notes: z.string().max(500).optional(), paymentMethod: z.enum(['cod', 'simulated']),
});
type Form = z.infer<typeof schema>;

export function Checkout() {
  const { lines, clear } = useCart();
  const { user } = useAuth();
  const t = useTotals();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema), defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', paymentMethod: 'cod' },
  });
  if (lines.length === 0) return <Navigate to="/bag" replace />;
  const submit = async (d: Form) => {
    setErr('');
    try {
      const r = await api('/orders', { method: 'POST', role: user ? 'customer' : null, body: {
        items: lines.map((l) => ({ coffeeId: l.coffeeId, weight: l.weight, quantity: l.quantity })),
        customer: { name: d.name, email: d.email, phone: d.phone }, shippingAddress: { country: d.country, city: d.city, address: d.address, notes: d.notes || undefined }, paymentMethod: d.paymentMethod } });
      sessionStorage.setItem('origin.lastOrder', JSON.stringify(r.order));
      clear(); nav('/order/confirmation', { replace: true });
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="Checkout" />
      <h1 className="display text-6xl md:text-8xl">Checkout</h1>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" error={errors.name?.message}><input className="field" autoComplete="name" {...register('name')} /></FormField>
            <FormField label="Email" error={errors.email?.message}><input className="field" type="email" autoComplete="email" {...register('email')} /></FormField>
            <FormField label="Phone" error={errors.phone?.message}><input className="field" type="tel" autoComplete="tel" {...register('phone')} /></FormField>
            <FormField label="Country" error={errors.country?.message}><input className="field" autoComplete="country-name" {...register('country')} /></FormField>
            <FormField label="City" error={errors.city?.message}><input className="field" autoComplete="address-level2" {...register('city')} /></FormField>
            <FormField label="Address" error={errors.address?.message}><input className="field" autoComplete="street-address" {...register('address')} /></FormField>
          </div>
          <FormField label="Delivery notes (optional)" error={errors.notes?.message}><textarea className="field" rows={3} {...register('notes')} /></FormField>
          <fieldset><legend className="mb-2 text-sm text-roast">Payment</legend>
            <label className="flex items-start gap-3 border border-espresso/25 p-4"><input type="radio" value="cod" className="mt-1 accent-roast" {...register('paymentMethod')} /><span><span className="block">Cash on delivery</span><span className="text-sm text-roast">Pay when your order arrives.</span></span></label>
            <label className="mt-2 flex items-start gap-3 border border-espresso/25 p-4"><input type="radio" value="simulated" className="mt-1 accent-roast" {...register('paymentMethod')} /><span><span className="block">Simulated payment (demo)</span><span className="text-sm text-roast">No payment is taken. The order is recorded as unpaid.</span></span></label></fieldset>
        </div>
        <aside className="lg:col-span-5"><div className="bg-cream p-7">
          <h2 className="text-3xl">Order summary</h2>
          <ul className="mt-4 divide-y divide-espresso/15 text-sm">{lines.map((l) => <li key={l.coffeeId + l.weight} className="flex justify-between py-3"><span>{l.name} · {grams(l.weight)} × {l.quantity}</span><span>{money(l.price * l.quantity, t.currency)}</span></li>)}</ul>
          <dl className="mt-3 space-y-2 border-t border-espresso/25 pt-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(t.subtotal, t.currency)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{t.shipping === 0 ? 'Free' : money(t.shipping, t.currency)}</dd></div><div className="flex justify-between text-base"><dt>Total</dt><dd>{money(t.total, t.currency)}</dd></div></dl>
          <p className="mt-2 text-xs text-roast">Final prices and stock are confirmed by the server when you place the order.</p>
          {err && <p role="alert" className="mt-4 border border-red-800/40 bg-red-50 p-3 text-sm text-red-900">{err}</p>}
          <button disabled={isSubmitting} className="btn btn-dark mt-5 w-full">{isSubmitting ? 'Placing order…' : 'Place order'}</button></div></aside>
      </form>
    </div>
  );
}

export function Confirmation() {
  const raw = sessionStorage.getItem('origin.lastOrder');
  if (!raw) return <Navigate to="/" replace />;
  const o = JSON.parse(raw);
  return (
    <div className="container-x max-w-3xl py-20 md:py-28">
      <Seo title="Order confirmed" />
      <h1 className="display text-6xl md:text-8xl">Thank you.</h1>
      <p className="mt-4 text-lg">Your order <strong>{o.orderNumber}</strong> was placed on {date(o.createdAt)}.</p>
      <p className="mt-1 text-roast">{o.paymentMethod === 'cod' ? 'Payment: cash on delivery.' : 'Payment: simulated (no payment was taken).'} Status: {o.status}.</p>
      <ul className="mt-8 divide-y divide-espresso/15 border-y border-espresso/20">{o.items.map((i: any, k: number) => <li key={k} className="flex justify-between py-3 text-sm"><span>{i.name} · {grams(i.weight)} × {i.quantity}</span><span>{money(i.unitPrice * i.quantity, o.currency)}</span></li>)}</ul>
      <dl className="mt-4 space-y-1 text-sm"><div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping === 0 ? 'Free' : money(o.shipping, o.currency)}</dd></div><div className="flex justify-between text-lg"><dt>Total</dt><dd>{money(o.total, o.currency)}</dd></div></dl>
      <p className="mt-6 text-sm text-roast">Delivering to {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.country}.</p>
      <div className="mt-8 flex gap-3"><Link to="/coffee" className="btn btn-dark">Keep exploring</Link>{o.user && <Link to="/account/orders" className="btn btn-line">My orders</Link>}</div>
    </div>
  );
}
