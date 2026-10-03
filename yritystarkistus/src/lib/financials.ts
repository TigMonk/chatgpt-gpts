// PRH:n digitaaliset tilinpäätökset (XBRL-rajapinta v3).
// https://avoindata.prh.fi/opendata-xbrl-api/v3  –  lisenssi CC BY 4.0, ei avainta.
// Huom: vain iXBRL-muodossa jätetyt tilinpäätökset (n. 5 % kaikista) ovat saatavilla.
//
// Taksonomia (SBR/OYTP): rahamääräiset arvot ovat käsitteissä fi_met:md103
// (tuloslaskelma) ja fi_met:mi53 (tase). Kunkin arvon konteksti kertoo
// dimensiolla fi_dim:MCY jäsenkoodin (esim. x673 = Liikevaihto).

import { XMLParser } from 'fast-xml-parser';
import { getJson, getText } from './http';

const BASE = 'https://avoindata.prh.fi/opendata-xbrl-api/v3';

export const KEY_CODES = {
  revenue: 'x673', // Liikevaihto
  operatingProfit: 'x689', // Liikevoitto (-tappio)
  financialItems: 'x12', // Rahoitustuotot ja -kulut
  profitBeforeTax: 'x738', // Voitto ennen tilinpäätössiirtoja ja veroja
  incomeTaxes: 'x541', // Tuloverot
  netProfit: 'x740', // Tilikauden voitto (tappio)
  personnelExpenses: 'x5', // Henkilöstökulut
  totalAssets: 'x360', // Vastaavaa yhteensä
  totalEquity: 'x376', // Oma pääoma yhteensä
  totalLiabilities: 'x424', // Vieras pääoma yhteensä
} as const;

export type KeyFigure = keyof typeof KEY_CODES;

export const KEY_LABELS: Record<KeyFigure, string> = {
  revenue: 'Liikevaihto',
  operatingProfit: 'Liikevoitto',
  financialItems: 'Rahoitustuotot ja -kulut',
  profitBeforeTax: 'Tulos ennen veroja',
  incomeTaxes: 'Tuloverot',
  netProfit: 'Tilikauden tulos',
  personnelExpenses: 'Henkilöstökulut',
  totalAssets: 'Taseen loppusumma',
  totalEquity: 'Oma pääoma',
  totalLiabilities: 'Vieras pääoma',
};

export interface Statement {
  periodStart: string | null;
  periodEnd: string | null;
  figures: Record<KeyFigure, number | null>;
  /** Omavaraisuusaste % (oma pääoma / taseen loppusumma). */
  equityRatio: number | null;
  /** Liikevoitto-% (liikevoitto / liikevaihto). */
  operatingMargin: number | null;
}

export interface FinancialPeriod { financialDate: string; registrationDate?: string }

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
});

type Node = Record<string, unknown>;
const arr = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v: unknown): string | undefined => {
  const t = typeof v === 'object' && v !== null ? (v as Node)['#text'] : v;
  return t == null ? undefined : String(t).trim();
};

function memberOf(ctx: Node): string | undefined {
  for (const box of ['xbrli:scenario', 'xbrli:segment']) {
    const b = ctx[box] as Node | undefined;
    if (!b) continue;
    for (const m of arr(b['xbrldi:explicitMember'])) {
      if (typeof m === 'object' && m !== null && (m as Node)['@_dimension'] === 'fi_dim:MCY') {
        return text(m)?.replace(/^fi_MC:/, '');
      }
    }
  }
  return undefined;
}

function periodEndOf(ctx: Node): string | undefined {
  const p = ctx['xbrli:period'] as Node | undefined;
  if (!p) return undefined;
  return text(p['xbrli:instant']) ?? text(p['xbrli:endDate']);
}

/** Jäsentää yhden XBRL-tilinpäätöksen avainluvuiksi. */
export function parseStatement(xml: string): Statement {
  const doc = parser.parse(xml) as Node;
  const root = (doc['xbrli:xbrl'] ?? doc['xbrl']) as Node | undefined;
  if (!root) throw new Error('Tuntematon tilinpäätösmuoto');

  const contexts = new Map<string, { member?: string; end?: string }>();
  for (const c of arr(root['xbrli:context'])) {
    const ctx = c as Node;
    const id = ctx['@_id'];
    if (typeof id === 'string') contexts.set(id, { member: memberOf(ctx), end: periodEndOf(ctx) });
  }

  const periodStart = text(arr(root['fi_met:di120'])[0]) ?? null;
  const periodEnd = text(arr(root['fi_met:di121'])[0]) ?? null;

  // Kerätään vain kuluvan tilikauden arvot (vertailuvuoden luvut pudotetaan pois).
  const values = new Map<string, number>();
  for (const concept of ['fi_met:md103', 'fi_met:mi53']) {
    for (const f of arr(root[concept])) {
      if (typeof f !== 'object' || f === null) continue;
      const ref = (f as Node)['@_contextRef'];
      const raw = text(f);
      if (typeof ref !== 'string' || !raw) continue;
      const ctx = contexts.get(ref);
      if (!ctx?.member) continue;
      if (periodEnd && ctx.end && ctx.end !== periodEnd) continue;
      const n = Number(raw);
      if (Number.isFinite(n) && !values.has(ctx.member)) values.set(ctx.member, n);
    }
  }

  const figures = Object.fromEntries(
    (Object.keys(KEY_CODES) as KeyFigure[]).map((k) => [k, values.get(KEY_CODES[k]) ?? null]),
  ) as Record<KeyFigure, number | null>;

  const { totalAssets, totalEquity, revenue, operatingProfit } = figures;
  if (figures.totalLiabilities === null && totalAssets !== null && totalEquity !== null) {
    figures.totalLiabilities = totalAssets - totalEquity;
  }

  return {
    periodStart,
    periodEnd,
    figures,
    equityRatio: totalAssets && totalEquity !== null ? (totalEquity / totalAssets) * 100 : null,
    operatingMargin: revenue && operatingProfit !== null ? (operatingProfit / revenue) * 100 : null,
  };
}

/** Listaa tilikaudet, joilta yritys on jättänyt digitaalisen tilinpäätöksen (uusin ensin). */
export async function listPeriods(ytunnus: string): Promise<FinancialPeriod[]> {
  const data = await getJson<{ financials?: FinancialPeriod[] }>(
    `${BASE}/financials?businessId=${encodeURIComponent(ytunnus)}`,
  );
  return [...(data?.financials ?? [])].sort((a, b) => b.financialDate.localeCompare(a.financialDate));
}

/** Hakee ja jäsentää enintään `max` uusinta tilinpäätöstä. */
export async function getStatements(ytunnus: string, max = 3): Promise<Statement[]> {
  const periods = (await listPeriods(ytunnus)).slice(0, max);
  const out: Statement[] = [];
  for (const p of periods) {
    const xml = await getText(
      `${BASE}/financial?businessId=${encodeURIComponent(ytunnus)}&financialDate=${encodeURIComponent(p.financialDate)}`,
      'text/xml, application/xml, application/json',
    );
    if (!xml) continue;
    try {
      const s = parseStatement(xml);
      out.push({ ...s, periodEnd: s.periodEnd ?? p.financialDate });
    } catch {
      // Yksittäinen viallinen tilinpäätös ei kaada koko hakua.
    }
  }
  return out;
}
