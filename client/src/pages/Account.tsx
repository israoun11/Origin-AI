import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../context/auth';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { date, grams, money } from '../lib/format';
import { CoffeeTile } from '../components/CoffeeCard';
import RecipeCard from '../components/RecipeCard';
import { Empty, ErrorState, FormField, Seo, Skeleton } from '../components/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [err, setErr] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const to = (loc.state as any)?.from || '/account';

  if (user) return <Navigate to={to} replace />;

  return (
    <div className="container-x max-w-md py-20">
      <Seo title="Sign in" />
      <h1 className="display text-6xl">Sign in</h1>

      <form
        noValidate
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(async (d) => {
          setErr('');
          try {
            await login(d.email, d.password);
            nav(to, { replace: true });
          } catch (e: any) {
            setErr(e.message);
          }
        })}
      >
        <FormField label="Email" error={errors.email?.message}>
          <input
            className="field"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </FormField>

        {err && <p role="alert" className="text-sm text-red-800">{err}</p>}

        <button className="btn btn-dark w-full" disabled={isSubmitting}>
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm">
        New to ORIGIN?{' '}
        <Link to="/account/register" state={loc.state} className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function Register() {
  const { register: signup, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [err, setErr] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const to = (loc.state as any)?.from || '/account';

  if (user) return <Navigate to={to} replace />;

  return (
    <div className="container-x max-w-md py-20">
      <Seo title="Create account" />
      <h1 className="display text-6xl">Create account</h1>

      <form
        noValidate
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(async (d) => {
          setErr('');
          try {
            await signup(d);
            nav(to, { replace: true });
          } catch (e: any) {
            setErr(e.message);
          }
        })}
      >
        <FormField label="Name" error={errors.name?.message}>
          <input className="field" autoComplete="name" {...register('name')} />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <input
            className="field"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
        </FormField>

        {err && <p role="alert" className="text-sm text-red-800">{err}</p>}

        <button className="btn btn-dark w-full" disabled={isSubmitting}>
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm">
        Already registered?{' '}
        <Link to="/account/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function AccountLayout() {
  const { user, ready, logout } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return (
      <div className="container-x py-24">
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/account/login" replace state={{ from: loc.pathname }} />;
  }

  const tab = ({ isActive }: { isActive: boolean }) =>
    `block py-2 ${isActive ? 'text-espresso underline underline-offset-8' : 'text-roast'}`;

  return (
    <div className="container-x py-16 md:py-24">
      <Seo title="My account" />
      <h1 className="display text-6xl md:text-8xl">
        Hello, {user.name.split(' ')[0]}
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <nav aria-label="Account" className="font-serif text-2xl lg:col-span-3">
          <NavLink end to="/account" className={tab}>Profile</NavLink>
          <NavLink to="/account/orders" className={tab}>Orders</NavLink>
          <NavLink to="/account/saved" className={tab}>Saved coffees and articles</NavLink>
          <NavLink to="/account/recipes" className={tab}>Saved recipes</NavLink>
          <button onClick={logout} className="mt-4 text-base text-roast underline">
            Sign out
          </button>
        </nav>

        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function Profile() {
  const { user, setUser } = useAuth();
  const [msg, setMsg] = useState('');
  const [pmsg, setPmsg] = useState('');
  const [perr, setPerr] = useState('');

  const p = useForm({
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  });

  const pw = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  return (
    <div className="grid gap-14 md:grid-cols-2">
      <form
        className="space-y-5"
        onSubmit={p.handleSubmit(async (d) => {
          const r = await api('/auth/me', {
            method: 'PATCH',
            role: 'customer',
            body: d,
          });
          setUser(r.user);
          setMsg('Profile updated.');
        })}
      >
        <h2 className="text-3xl">Profile</h2>

        <FormField label="Name">
          <input className="field" {...p.register('name')} />
        </FormField>

        <FormField label="Email">
          <input className="field opacity-60" value={user?.email} disabled readOnly />
        </FormField>

        <FormField label="Phone">
          <input className="field" {...p.register('phone')} />
        </FormField>

        <button className="btn btn-dark">Save changes</button>
        {msg && <p role="status" className="text-sm text-roast">{msg}</p>}
      </form>

      <form
        className="space-y-5"
        onSubmit={pw.handleSubmit(async (d) => {
          setPerr('');
          setPmsg('');
          try {
            await api('/auth/change-password', {
              method: 'POST',
              role: 'customer',
              body: d,
            });
            setPmsg('Password updated.');
            pw.reset();
          } catch (e: any) {
            setPerr(
              e.status === 400 && e.details
                ? 'Check the password fields (min 8 characters).'
                : e.message,
            );
          }
        })}
      >
        <h2 className="text-3xl">Change password</h2>

        <FormField label="Current password">
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            {...pw.register('currentPassword')}
          />
        </FormField>

        <FormField label="New password (8+ characters)">
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            {...pw.register('newPassword')}
          />
        </FormField>

        <button className="btn btn-dark">Update password</button>

        {pmsg && <p role="status" className="text-sm text-roast">{pmsg}</p>}
        {perr && <p role="alert" className="text-sm text-red-800">{perr}</p>}
      </form>
    </div>
  );
}

export function Orders() {
  const { data, loading, error, reload } = useApi<{ items: any[] }>('/orders/mine', 'customer');

  if (loading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!data?.items.length) {
    return (
      <Empty
        title="No orders yet"
        action={<Link to="/coffee" className="btn btn-dark">Explore coffee</Link>}
      />
    );
  }

  return (
    <ul>
      {data.items.map((o) => (
        <li key={o._id}>
          <Link
            to={`/account/orders/${o._id}`}
            className="flex justify-between border-t border-espresso/20 py-5 hover:bg-champagne/20"
          >
            <span>
              <span className="font-serif text-2xl">{o.orderNumber}</span>
              <span className="block text-sm text-roast">
                {date(o.createdAt)} · {o.status}
              </span>
            </span>
            <span>{money(o.total, o.currency)}</span>
          </Link>
        </li>
      ))}
      <li className="border-t border-espresso/20" />
    </ul>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi<{ order: any }>(
    `/orders/mine/${id}`,
    'customer',
  );

  if (loading) return <Skeleton className="h-48" />;
  if (error || !data) {
    return <ErrorState message={error ?? ''} onRetry={reload} />;
  }

  const o = data.order;

  return (
    <div>
      <Link to="/account/orders" className="text-sm underline">All orders</Link>
      <h2 className="display mt-3 text-5xl">{o.orderNumber}</h2>
      <p className="mt-2 text-roast">
        {date(o.createdAt)} · {o.status} · Payment: {o.paymentStatus} (
        {o.paymentMethod === 'cod' ? 'cash on delivery' : 'simulated'})
      </p>

      <ul className="mt-6 divide-y divide-espresso/15 border-y border-espresso/20">
        {o.items.map((i: any, k: number) => (
          <li key={k} className="flex justify-between py-3 text-sm">
            <span>{i.name} · {grams(i.weight)} × {i.quantity}</span>
            <span>{money(i.unitPrice * i.quantity, o.currency)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-right">
        Shipping {o.shipping === 0 ? 'free' : money(o.shipping, o.currency)} · Total{' '}
        <strong>{money(o.total, o.currency)}</strong>
      </p>

      <p className="mt-4 text-sm text-roast">
        {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.country}
      </p>
    </div>
  );
}

export function Saved() {
  const { data, loading, error, reload } = useApi<{
    coffees: any[];
    articles: any[];
  }>('/me/favorites', 'customer');

  if (loading) return <Skeleton className="h-48" />;
  if (error || !data) {
    return <ErrorState message={error ?? ''} onRetry={reload} />;
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-3xl">Coffees</h2>
        {data.coffees.length ? (
          <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {data.coffees.map((c) => (
              <CoffeeTile
                key={c._id}
                c={{
                  ...c,
                  fromPrice: Math.min(...c.variants.map((v: any) => v.price)),
                  inStock: c.variants.some((v: any) => v.stock > 0),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4"><Empty title="No saved coffees" /></div>
        )}
      </section>

      <section>
        <h2 className="text-3xl">Articles</h2>
        {data.articles.length ? (
          <ul className="mt-4">
            {data.articles.map((a) => (
              <li key={a._id}>
                <Link
                  className="block border-t border-espresso/20 py-4 font-serif text-2xl hover:text-roast"
                  to={`/journal/${a.slug}`}
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4"><Empty title="No saved articles" /></div>
        )}
      </section>
    </div>
  );
}

export function SavedRecipes() {
  const { data, loading, error, reload } = useApi<{ items: any[] }>('/recipes', 'customer');
  const [open, setOpen] = useState<string | null>(null);

  if (loading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!data?.items.length) {
    return (
      <Empty
        title="No saved recipes"
        text="Generate one with the AI Barista and save it."
        action={<Link to="/barista" className="btn btn-dark">Meet your barista</Link>}
      />
    );
  }

  const del = async (id: string) => {
    await api(`/recipes/${id}`, { method: 'DELETE', role: 'customer' });
    reload();
  };

  return (
    <ul>
      {data.items.map((r) => (
        <li key={r._id} className="border-t border-espresso/20 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-serif text-2xl">{r.title}</p>
              <p className="text-sm text-roast">
                {r.coffeeName} · {r.method} · {date(r.createdAt)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-line"
                onClick={() => setOpen(open === r._id ? null : r._id)}
              >
                {open === r._id ? 'Hide' : 'Open'}
              </button>
              <button className="btn btn-line" onClick={() => del(r._id)}>
                Delete
              </button>
            </div>
          </div>

          {open === r._id && (
            <div className="mt-5">
              <RecipeCard r={r} />
              <button
                className="btn btn-line no-print mt-3"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}