// Suomalaiset numero- ja päivämäärämuodot.

const nbsp = ' ';

/** 1234567 -> "1,2 M€", 45300 -> "45 300 €" */
export function euro(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1).replace('.', ',')}${nbsp}M€`;
  const grouped = Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, nbsp);
  return `${sign}${grouped}${nbsp}€`;
}

export function percent(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  return `${n.toFixed(1).replace('.', ',')}${nbsp}%`;
}

/** "2024-12-31" -> "31.12.2024" */
export function date(iso: string | null | undefined): string {
  if (!iso) return '–';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])}.${Number(m[2])}.${m[1]}` : iso;
}
