export const money = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const grams = (g: number) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);
export const date = (d: string | Date) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
