// Y-tunnuksen (Business ID) muototarkistus ja tarkistusmerkin laskenta.
// Muoto: 7 numeroa, väliviiva, tarkistusnumero (esim. 0112038-9).
// Vanhat 6-numeroiset tunnukset täydennetään etunollalla.

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2];

/** Siistii syötteen: poistaa välilyönnit, FI-etuliitteen ja lisää puuttuvan väliviivan. */
export function normalizeYtunnus(input: string): string | null {
  let s = input.trim().toUpperCase().replace(/\s+/g, '');
  if (s.startsWith('FI')) s = s.slice(2);
  const m = s.match(/^(\d{6,7})-(\d)$/) ?? s.match(/^(\d{6,7})(\d)$/);
  if (!m) return null;
  const body = m[1].padStart(7, '0');
  return `${body}-${m[2]}`;
}

/** Laskee tarkistusnumeron 7-numeroiselle runko-osalle. Palauttaa null, jos runko on mahdoton. */
export function checkDigit(body: string): number | null {
  if (!/^\d{7}$/.test(body)) return null;
  const sum = body.split('').reduce((acc, d, i) => acc + Number(d) * WEIGHTS[i], 0);
  const rem = sum % 11;
  if (rem === 0) return 0;
  if (rem === 1) return null;
  return 11 - rem;
}

/** Onko merkkijono kelvollinen Y-tunnus (muoto + tarkistusnumero)? */
export function isValidYtunnus(input: string): boolean {
  const n = normalizeYtunnus(input);
  if (!n) return false;
  const [body, check] = n.split('-');
  return checkDigit(body) === Number(check);
}

/** Näyttääkö syöte Y-tunnukselta (vaikka tarkiste olisi väärä)? */
export function looksLikeYtunnus(input: string): boolean {
  return normalizeYtunnus(input) !== null;
}

/** Y-tunnus ALV-numeroksi: 0112038-9 -> FI01120389 */
export function toVatNumber(ytunnus: string): string {
  return 'FI' + ytunnus.replace('-', '');
}
