// Muut avoimet lähteet: kaupparekisteri-ilmoitukset (PRH), EU:n VIES-ALV-tarkistus
// ja GLEIF LEI -rekisteri. Kaikki ilmaisia ja ilman API-avainta.

import { getJson } from './http';
import { toVatNumber } from './ytunnus';

// ---------- PRH: kaupparekisteriin rekisteröidyt ilmoitukset (vuodesta 2014) ----------

const NOTICES_BASE = 'https://avoindata.prh.fi/opendata-registerednotices-api/v3';

export interface Notice { date: string; recordNumber: string; codes: string[] }

/** Tunnetut ilmoituskoodit. Tuntemattomat näytetään koodina. */
export const ENTRY_CODES: Record<string, string> = {
  TASE: 'Tilinpäätös',
};

export async function getNotices(ytunnus: string): Promise<Notice[]> {
  type Raw = { publicNotices?: { registrationDate?: string; recordNumber?: string; entryCodes?: string[] }[] };
  const data = await getJson<Raw | { companies?: Raw[] }>(`${NOTICES_BASE}/${encodeURIComponent(ytunnus)}`);
  if (!data) return [];
  const company: Raw | undefined = 'companies' in data ? data.companies?.[0] : (data as Raw);
  return (company?.publicNotices ?? [])
    .map((n) => ({ date: n.registrationDate ?? '', recordNumber: n.recordNumber ?? '', codes: n.entryCodes ?? [] }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- EU VIES: onko ALV-numero voimassa ----------

export interface VatCheck { valid: boolean; name?: string; address?: string; checkedAt?: string }

export async function checkVat(ytunnus: string): Promise<VatCheck | null> {
  const vat = toVatNumber(ytunnus).slice(2);
  const data = await getJson<{ isValid?: boolean; valid?: boolean; name?: string; address?: string; requestDate?: string }>(
    `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/FI/vat/${vat}`,
  );
  if (!data) return null;
  const clean = (s?: string) => (s && s !== '---' ? s.trim() : undefined);
  return {
    valid: Boolean(data.isValid ?? data.valid),
    name: clean(data.name),
    address: clean(data.address),
    checkedAt: data.requestDate,
  };
}

// ---------- GLEIF: LEI-tunnus (pakollinen mm. arvopaperikaupassa ja rahoitusalalla) ----------

export interface LeiRecord {
  lei: string;
  legalName: string;
  entityStatus?: string;
  registrationStatus?: string;
  nextRenewal?: string;
}

export async function getLei(ytunnus: string): Promise<LeiRecord | null> {
  type Rec = {
    attributes?: {
      lei?: string;
      entity?: { legalName?: { name?: string }; status?: string };
      registration?: { status?: string; nextRenewalDate?: string };
    };
  };
  const url =
    'https://api.gleif.org/api/v1/lei-records?filter[entity.registeredAs]=' +
    encodeURIComponent(ytunnus) +
    '&filter[entity.legalAddress.country]=FI&page[size]=1';
  const data = await getJson<{ data?: Rec[] }>(url);
  const a = data?.data?.[0]?.attributes;
  if (!a?.lei) return null;
  return {
    lei: a.lei,
    legalName: a.entity?.legalName?.name ?? '',
    entityStatus: a.entity?.status,
    registrationStatus: a.registration?.status,
    nextRenewal: a.registration?.nextRenewalDate?.slice(0, 10),
  };
}
