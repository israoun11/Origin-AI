import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Skeleton } from './components/ui';

const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const Product = lazy(() => import('./pages/Product'));
const Barista = lazy(() => import('./pages/Barista'));

function named<T extends Record<string, any>>(loader: () => Promise<T>, name: keyof T) {
  return lazy(async () => ({ default: (await loader())[name] }));
}
const JournalList = named(() => import('./pages/Journal'), 'JournalList');
const ArticlePage = named(() => import('./pages/Journal'), 'ArticlePage');
const Bag = named(() => import('./pages/Shop'), 'Bag');
const Checkout = named(() => import('./pages/Shop'), 'Checkout');
const Confirmation = named(() => import('./pages/Shop'), 'Confirmation');
const Login = named(() => import('./pages/Account'), 'Login');
const Register = named(() => import('./pages/Account'), 'Register');
const AccountLayout = named(() => import('./pages/Account'), 'AccountLayout');
const Profile = named(() => import('./pages/Account'), 'Profile');
const Orders = named(() => import('./pages/Account'), 'Orders');
const OrderDetail = named(() => import('./pages/Account'), 'OrderDetail');
const Saved = named(() => import('./pages/Account'), 'Saved');
const SavedRecipes = named(() => import('./pages/Account'), 'SavedRecipes');
const Story = named(() => import('./pages/Misc'), 'Story');
const NotFound = named(() => import('./pages/Misc'), 'NotFound');
const Privacy = lazy(async () => { const m = await import('./pages/Misc'); return { default: () => <m.Legal kind="privacy" /> }; });
const Terms = lazy(async () => { const m = await import('./pages/Misc'); return { default: () => <m.Legal kind="terms" /> }; });
const AdminLogin = named(() => import('./admin/Core'), 'AdminLogin');
const AdminLayout = named(() => import('./admin/Core'), 'AdminLayout');
const Dashboard = named(() => import('./admin/Core'), 'Dashboard');
const AdminOrders = named(() => import('./admin/Core'), 'AdminOrders');
const AdminOrderDetail = named(() => import('./admin/Core'), 'AdminOrderDetail');
const AdminCustomers = named(() => import('./admin/Core'), 'AdminCustomers');
const AdminCustomer = named(() => import('./admin/Core'), 'AdminCustomer');
const AdminNewsletter = named(() => import('./admin/Core'), 'AdminNewsletter');
const AdminProducts = named(() => import('./admin/Content'), 'AdminProducts');
const ProductForm = named(() => import('./admin/Content'), 'ProductForm');
const AdminOrigins = named(() => import('./admin/Content'), 'AdminOrigins');
const AdminArticles = named(() => import('./admin/Content'), 'AdminArticles');
const ArticleForm = named(() => import('./admin/Content'), 'ArticleForm');
const AdminMedia = named(() => import('./admin/Site'), 'AdminMedia');
const AdminHomepage = named(() => import('./admin/Site'), 'AdminHomepage');
const AdminSettings = named(() => import('./admin/Site'), 'AdminSettings');

export default function App() {
  return (
    <Suspense fallback={<div className="container-x py-24"><Skeleton className="h-64" /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="coffee" element={<Discover />} />
          <Route path="coffee/:slug" element={<Product />} />
          <Route path="barista" element={<Barista />} />
          <Route path="journal" element={<JournalList />} />
          <Route path="journal/:slug" element={<ArticlePage />} />
          <Route path="story" element={<Story />} />
          <Route path="bag" element={<Bag />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/confirmation" element={<Confirmation />} />
          <Route path="account/login" element={<Login />} />
          <Route path="account/register" element={<Register />} />
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Profile />} /><Route path="orders" element={<Orders />} /><Route path="orders/:id" element={<OrderDetail />} />
            <Route path="saved" element={<Saved />} /><Route path="recipes" element={<SavedRecipes />} />
          </Route>
          <Route path="privacy" element={<Privacy />} /><Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="products" element={<AdminProducts />} /><Route path="products/:id" element={<ProductForm />} />
          <Route path="origins" element={<AdminOrigins />} />
          <Route path="articles" element={<AdminArticles />} /><Route path="articles/:id" element={<ArticleForm />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="orders" element={<AdminOrders />} /><Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="customers" element={<AdminCustomers />} /><Route path="customers/:id" element={<AdminCustomer />} />
          <Route path="newsletter" element={<AdminNewsletter />} /><Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
