// Pieni fetch-apuri: aikakatkaisu, selkeät suomenkieliset virheet ja välimuisti.

export class HttpError extends Error {
  constructor(message: string, public status?: number, public url?: string) {
    super(message);
    this.name = 'HttpError';
  }
}

const cache = new Map<string, { expires: number; value: unknown }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchImpl: FetchFn = (url, init) => fetch(url, init);

/** Testejä varten: korvaa verkkokutsut. */
export function setFetch(fn: FetchFn) {
  fetchImpl = fn;
  cache.clear();
}

async function request(url: string, accept: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { headers: { Accept: accept }, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError('Palvelu ei vastannut ajoissa', undefined, url);
    }
    throw new HttpError('Verkkovirhe – tarkista yhteys', undefined, url);
  } finally {
    clearTimeout(timer);
  }
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

/** Hakee JSONin. 404 palauttaa null (ei löytynyt), muut virheet heitetään. */
export function getJson<T>(url: string, timeoutMs = 20_000): Promise<T | null> {
  return cached(url, async () => {
    const res = await request(url, 'application/json', timeoutMs);
    if (res.status === 404) return null;
    if (!res.ok) throw new HttpError(`Palvelu palautti virheen ${res.status}`, res.status, url);
    return (await res.json()) as T;
  });
}

/** Hakee tekstin (esim. XBRL-XML). 400/404 palauttaa null. */
export function getText(url: string, accept: string, timeoutMs = 30_000): Promise<string | null> {
  return cached(url, async () => {
    const res = await request(url, accept, timeoutMs);
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new HttpError(`Palvelu palautti virheen ${res.status}`, res.status, url);
    return res.text();
  });
}
