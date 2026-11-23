import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEYS } from '../lib/api';

export interface User { id: string; name: string; email: string; phone?: string }
interface Ctx {
  user: User | null; ready: boolean; admin: { name: string; email: string } | null;
  login(email: string, password: string): Promise<void>;
  register(d: { name: string; email: string; password: string; phone?: string }): Promise<void>;
  logout(): void;
  adminLogin(email: string, password: string): Promise<void>; adminLogout(): void;
  setUser(u: User): void;
  favorites: { coffees: string[]; articles: string[] };
  toggleFavorite(kind: 'coffee' | 'article', id: string): Promise<void>;
}
const AuthCtx = createContext<Ctx>(null as never);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Ctx['admin']>(() => { try { return JSON.parse(localStorage.getItem('origin.admin') || 'null'); } catch { return null; } });
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState({ coffees: [] as string[], articles: [] as string[] });

  const loadFavs = useCallback(() => api('/me/favorites/ids', { role: 'customer' }).then(setFavorites).catch(() => undefined), []);
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEYS.customer)) { setReady(true); return; }
    api<{ user: User }>('/auth/me', { role: 'customer' }).then((r) => { setUser(r.user); loadFavs(); })
      .catch(() => localStorage.removeItem(TOKEN_KEYS.customer)).finally(() => setReady(true));
  }, [loadFavs]);

  const login: Ctx['login'] = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem(TOKEN_KEYS.customer, r.token); setUser(r.user); loadFavs();
  };
  const register: Ctx['register'] = async (d) => {
    const r = await api('/auth/register', { method: 'POST', body: d });
    localStorage.setItem(TOKEN_KEYS.customer, r.token); setUser(r.user);
  };
  const logout = () => { localStorage.removeItem(TOKEN_KEYS.customer); setUser(null); setFavorites({ coffees: [], articles: [] }); };
  const adminLogin: Ctx['adminLogin'] = async (email, password) => {
    const r = await api('/auth/admin/login', { method: 'POST', body: { email, password } });
    localStorage.setItem(TOKEN_KEYS.admin, r.token); localStorage.setItem('origin.admin', JSON.stringify(r.admin)); setAdmin(r.admin);
  };
  const adminLogout = () => { localStorage.removeItem(TOKEN_KEYS.admin); localStorage.removeItem('origin.admin'); setAdmin(null); };
  const toggleFavorite: Ctx['toggleFavorite'] = async (kind, id) => {
    const key = kind === 'coffee' ? 'coffees' : 'articles';
    const has = favorites[key].includes(id);
    setFavorites((f) => ({ ...f, [key]: has ? f[key].filter((x) => x !== id) : [...f[key], id] }));
    try { await api(`/me/favorites/${kind}/${id}`, { method: has ? 'DELETE' : 'POST', role: 'customer' }); }
    catch { loadFavs(); }
  };
  return <AuthCtx.Provider value={{ user, ready, admin, login, register, logout, adminLogin, adminLogout, setUser, favorites, toggleFavorite }}>{children}</AuthCtx.Provider>;
}
