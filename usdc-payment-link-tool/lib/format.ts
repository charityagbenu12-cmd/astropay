export const centsToUsd = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export const isoToLocal = (value: string | null | undefined) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(value));
};

export const amountToStellar = (cents: number) => (cents / 100).toFixed(2);
