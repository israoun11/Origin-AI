import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Empty, ErrorState, Img, Seo, Skeleton } from '../components/ui';

export function Story() {
  const { data, loading, error, reload } = useApi<{ sections: { key: string; content: any }[] }>('/settings/homepage');
  if (loading) return <div className="container-x py-24"><Skeleton className="h-96" /></div>;
  if (error || !data) return <div className="container-x py-24"><ErrorState message={error ?? ''} onRetry={reload} /></div>;
  const blocks = data.sections.filter((s) => s.key === 'intro' || s.key === 'philosophy');
  return (
    <div className="container-x py-16 md:py-24"><Seo title="Our story" description="Why ORIGIN exists and how we think about coffee." />
      <h1 className="display text-6xl md:text-8xl">Our story</h1>
      {blocks.length === 0 ? <div className="mt-12"><Empty title="Our story is being written" /></div> : blocks.map((b) => (
        <section key={b.key} className="mt-16 grid gap-10 md:grid-cols-12"><h2 className="display text-4xl md:col-span-6 md:text-6xl">{b.content.headline}</h2>
          <div className="md:col-span-5 md:col-start-8"><p className="text-lg leading-relaxed text-espresso/80">{b.content.text}</p>{b.content.image?.url && <div className="mt-8 aspect-[4/3]"><Img src={b.content.image.url} alt={b.content.image.alt} /></div>}</div></section>))}
      <Link to="/coffee" className="btn btn-dark mt-16">Explore the selection</Link>
    </div>
  );
}

export function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  return (
    <div className="container-x max-w-3xl py-16 md:py-24"><Seo title={privacy ? 'Privacy policy' : 'Terms and conditions'} />
      <h1 className="display text-6xl md:text-7xl">{privacy ? 'Privacy policy' : 'Terms and conditions'}</h1>
      <div className="mt-8 space-y-4 leading-relaxed text-espresso/85">
        {privacy ? <>
          <p>This is a demonstration storefront. We store the information you provide (name, email, phone, delivery address, orders and saved recipes) only to operate your account and fulfil your orders.</p>
          <p>Passwords are stored hashed. Newsletter addresses are used only to send the newsletter and can be removed on request.</p>
          <p>Replace this text with your final policy, reviewed for your jurisdiction, before going live.</p></> : <>
          <p>This is a demonstration storefront. Orders are placed with cash on delivery or a clearly labelled simulated payment; no online payment is processed.</p>
          <p>Prices, availability and shipping are confirmed when an order is placed. Orders can be cancelled before they ship.</p>
          <p>Replace this text with your final terms, reviewed for your jurisdiction, before going live.</p></>}
      </div>
    </div>
  );
}

export function NotFound() {
  return <div className="container-x py-32"><Empty title="Page not found" text="The page you are looking for does not exist." action={<Link to="/" className="btn btn-dark">Back home</Link>} /></div>;
}
