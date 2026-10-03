// PRH:n avoin YTJ-rajapinta v3 (kaupparekisteri, verohallinnon rekisterit).
// https://avoindata.prh.fi/opendata-ytj-api/v3  –  lisenssi CC BY 4.0, ei avainta.
// Huom: rajapinta sisältää kaupparekisterin yritykset; yksityisiä elinkeinonharjoittajia
// (toiminimiä) ei ole mukana, eikä henkilötietoja (hallitus, omistajat).

import { getJson } from './http';

const BASE = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

interface Desc { languageCode: string; description?: string | null }
interface Coded { type?: string; descriptions?: Desc[]; registrationDate?: string | null; endDate?: string | null }

export interface RawCompany {
  businessId?: { value: string; registrationDate?: string | null };
  euId?: { value: string };
  names?: { name: string; type?: string; registrationDate?: string | null; endDate?: string | null }[];
  mainBusinessLine?: Coded;
  website?: { url: string };
  companyForms?: Coded[];
  companySituations?: Coded[];
  registeredEntries?: (Coded & { register?: string; authority?: string })[];
  addresses?: {
    type: number;
    street?: string | null;
    buildingNumber?: string | null;
    entrance?: string | null;
    apartmentNumber?: string | null;
    postCode?: string | null;
    postOfficeBox?: string | null;
    co?: string | null;
    freeAddressLine?: string | null;
    postOffices?: { city: string; languageCode: string }[];
    endDate?: string | null;
  }[];
  tradeRegisterStatus?: string;
  status?: string;
  registrationDate?: string | null;
  endDate?: string | null;
  lastModified?: string | null;
}

interface SearchResponse { totalResults: number; companies: RawCompany[] }

/** PRH:n rekisterikoodit (REK-koodilista). */
export const REGISTERS: Record<string, string> = {
  '1': 'Kaupparekisteri',
  '2': 'Säätiörekisteri',
  '3': 'Yhdistysrekisteri',
  '4': 'Verohallinnon perustiedot',
  '5': 'Ennakkoperintärekisteri',
  '6': 'Arvonlisäverorekisteri',
  '7': 'Työnantajarekisteri',
  '8': 'Vakuutusmaksuverorekisteri',
};

/** Yrityksen tilanne -koodit (companySituations). */
export const SITUATIONS: Record<string, string> = {
  KONK: 'Konkurssissa',
  SANE: 'Yrityssaneerauksessa',
  SELTILA: 'Selvitystilassa',
};

export interface RegisterEntry { register: string; name: string; status: string; since?: string; active: boolean }
export interface Address { kind: 'Käyntiosoite' | 'Postiosoite' | 'Osoite'; text: string; city?: string }

export interface Company {
  businessId: string;
  businessIdDate?: string;
  name: string;
  otherNames: string[];
  formerNames: { name: string; until?: string }[];
  companyForm?: string;
  businessLine?: { code?: string; description?: string };
  website?: string;
  registrationDate?: string;
  endDate?: string;
  inTradeRegister: boolean;
  situations: { code: string; label: string; since?: string }[];
  registers: RegisterEntry[];
  addresses: Address[];
  lastModified?: string;
}

const fi = (d?: Desc[]) =>
  d?.find((x) => x.languageCode === '1')?.description ??
  d?.find((x) => x.languageCode === '3')?.description ??
  d?.[0]?.description ??
  undefined;

const current = <T extends { endDate?: string | null }>(arr?: T[]) => (arr ?? []).filter((x) => !x.endDate);

const title = (s: string) => s.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());

/** Päätteleekö merkinnän kuvaus, että yritys EI ole rekisterissä (esim. "Ei rekisterissä"). */
function entryIsNegative(desc?: string) {
  return !!desc && /^(ei\b|poist|lopet|päätt)/i.test(desc.trim());
}

export function normalizeCompany(raw: RawCompany): Company {
  const names = raw.names ?? [];
  const live = current(names);
  const pool = live.length ? live : names;
  const primary = pool.find((n) => n.type === '1') ?? pool[0];

  const registers: RegisterEntry[] = [];
  const seen = new Set<string>();
  for (const e of current(raw.registeredEntries)) {
    const reg = e.register ?? '?';
    const status = fi(e.descriptions) ?? 'Rekisterissä';
    const key = `${reg}:${status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    registers.push({
      register: reg,
      name: REGISTERS[reg] ?? `Rekisteri ${reg}`,
      status,
      since: e.registrationDate ?? undefined,
      active: !entryIsNegative(status),
    });
  }

  const addresses: Address[] = current(raw.addresses).map((a) => {
    const street = [a.street, a.buildingNumber, a.entrance, a.apartmentNumber].filter(Boolean).join(' ');
    const city = a.postOffices?.find((p) => p.languageCode === '1')?.city ?? a.postOffices?.[0]?.city;
    const parts = [
      a.co ? `c/o ${a.co}` : '',
      street || (a.postOfficeBox ? `PL ${a.postOfficeBox}` : ''),
      [a.postCode, city ? title(city) : ''].filter(Boolean).join(' '),
      a.freeAddressLine ?? '',
    ].filter(Boolean);
    return {
      kind: a.type === 1 ? 'Käyntiosoite' : a.type === 2 ? 'Postiosoite' : 'Osoite',
      text: parts.join(', '),
      city: city ? title(city) : undefined,
    };
  });

  const website = raw.website?.url?.trim();

  return {
    businessId: raw.businessId?.value ?? '',
    businessIdDate: raw.businessId?.registrationDate ?? undefined,
    name: primary?.name ?? '(nimi ei tiedossa)',
    otherNames: pool.filter((n) => n !== primary).map((n) => n.name),
    formerNames: names
      .filter((n) => n.endDate && n.name !== primary?.name)
      .map((n) => ({ name: n.name, until: n.endDate ?? undefined })),
    companyForm: fi((current(raw.companyForms)[0] ?? raw.companyForms?.[raw.companyForms.length - 1])?.descriptions),
    businessLine: raw.mainBusinessLine
      ? { code: raw.mainBusinessLine.type, description: fi(raw.mainBusinessLine.descriptions) }
      : undefined,
    website: website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : undefined,
    registrationDate: raw.registrationDate ?? raw.businessId?.registrationDate ?? undefined,
    endDate: raw.endDate ?? undefined,
    inTradeRegister:
      raw.tradeRegisterStatus === '1' || registers.some((r) => r.register === '1' && r.active),
    situations: current(raw.companySituations).map((s) => ({
      code: s.type ?? '?',
      label: SITUATIONS[s.type ?? ''] ?? fi(s.descriptions) ?? s.type ?? 'Tuntematon tilanne',
      since: s.registrationDate ?? undefined,
    })),
    registers,
    addresses,
    lastModified: raw.lastModified ?? undefined,
  };
}

/** Hakee yrityksen Y-tunnuksella. Palauttaa null, jos ei löydy. */
export async function getCompany(ytunnus: string): Promise<Company | null> {
  const data = await getJson<SearchResponse>(`${BASE}/companies?businessId=${encodeURIComponent(ytunnus)}`);
  const raw = data?.companies?.[0];
  return raw ? normalizeCompany(raw) : null;
}

export interface SearchHit { businessId: string; name: string; companyForm?: string; city?: string; ended: boolean }

/** Nimihaku. Palauttaa osumat ja kokonaismäärän. */
export async function searchCompanies(name: string, page = 1): Promise<{ total: number; hits: SearchHit[] }> {
  const url = `${BASE}/companies?name=${encodeURIComponent(name.trim())}&page=${page}`;
  const data = await getJson<SearchResponse>(url);
  const hits = (data?.companies ?? []).map((raw) => {
    const c = normalizeCompany(raw);
    return {
      businessId: c.businessId,
      name: c.name,
      companyForm: c.companyForm,
      city: c.addresses.find((a) => a.city)?.city,
      ended: !!c.endDate || c.situations.length > 0,
    };
  });
  return { total: data?.totalResults ?? hits.length, hits };
}
