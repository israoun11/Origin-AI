import { FormEvent, useState } from 'react';
import { api } from '../lib/api';

export default function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('loading'); setError('');
    try { await api('/newsletter', { method: 'POST', body: { email } }); setState('done'); setEmail(''); }
    catch (err: any) { setError(err.status === 400 ? 'Please enter a valid email address.' : err.message); setState('idle'); }
  };
  if (state === 'done') return <p role="status" className="font-serif text-2xl">Thank you. You are on the list.</p>;
  return (
    <form onSubmit={submit} noValidate>
      <div className="flex">
        <input type="email" required aria-label="Email address" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)}
          className={`min-w-0 flex-1 border bg-transparent px-4 py-3 text-sm outline-none ${dark ? 'border-ivory/40 placeholder:text-ivory/50 focus:border-ivory' : 'border-espresso/40 placeholder:text-espresso/50 focus:border-espresso'}`} />
        <button disabled={state === 'loading'} className={`btn ${dark ? 'btn-light' : 'btn-dark'}`}>{state === 'loading' ? 'Sending' : 'Subscribe'}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </form>
  );
}
