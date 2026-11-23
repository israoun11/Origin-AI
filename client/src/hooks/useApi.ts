import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useApi<T = any>(path: string | null, role?: 'customer' | 'admin' | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) { setLoading(false); return; }
    let live = true;
    setLoading(true); setError(null);
    api<T>(path, { role }).then((d) => live && setData(d)).catch((e) => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [path, tick, role]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload, setData };
}
