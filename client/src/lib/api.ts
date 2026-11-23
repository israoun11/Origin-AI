const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';
export const TOKEN_KEYS = { customer: 'origin.token', admin: 'origin.admin.token' } as const;

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}

type Opts = { method?: string; body?: unknown; role?: 'customer' | 'admin' | null; form?: FormData };

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const role = opts.role ?? (
  path.split('/').includes('admin') || path.startsWith('/media')
    ? 'admin'
    : null
);
  const token = role ? localStorage.getItem(TOKEN_KEYS[role]) : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
  let res: Response;
  try {
    res = await fetch(BASE + path, { method: opts.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  const data = type.includes('json') ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    if (res.status === 401 && role === 'admin') { localStorage.removeItem(TOKEN_KEYS.admin); localStorage.removeItem('origin.admin'); if (!location.pathname.startsWith('/admin/login')) location.assign('/admin/login'); }
    const msg = typeof data === 'object' && data && 'message' in data ? String((data as any).message) : 'Something went wrong';
    throw new ApiError(res.status, msg, (data as any)?.details);
  }
  return data as T;
}

/** Download a protected file (CSV export). */
export async function download(path: string, filename: string) {
  const token = localStorage.getItem(TOKEN_KEYS.admin);
  const res = await fetch(BASE + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError(res.status, 'Download failed');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export const errText = (e: any): string => {
  const d = e?.details;
  if (Array.isArray(d) && d.length && typeof d[0] === 'object') return `${e.message}: ${d.map((x: any) => `${x.path || 'field'} ${x.message}`).join('; ')}`;
  return e?.message ?? 'Something went wrong';
};
