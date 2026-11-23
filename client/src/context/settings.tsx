import { createContext, ReactNode, useContext } from 'react';
import { useApi } from '../hooks/useApi';

export interface Settings {
  brandName: string; tagline?: string; contactEmail?: string; phone?: string; currency: string; shippingFee: number; freeShippingThreshold: number;
  social?: { instagram?: string; facebook?: string; x?: string }; seo?: { title?: string; description?: string };
  announcement?: { enabled: boolean; text?: string }; storeOpen: boolean; logo?: { url?: string; alt?: string };
  footer?: { description?: string; privacyUrl?: string; termsUrl?: string };
}
const fallback: Settings = { brandName: 'ORIGIN', currency: 'USD', shippingFee: 8, freeShippingThreshold: 60, storeOpen: true };
const Ctx = createContext<Settings>(fallback);
export const useSettings = () => useContext(Ctx);
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useApi<{ settings: Settings }>('/settings');
  return <Ctx.Provider value={data?.settings ?? fallback}>{children}</Ctx.Provider>;
}
