// Luotettavuustarkistus: kokoaa julkisten lähteiden tiedoista tarkistuslistan.
// Tämä on suuntaa antava apuväline, ei luottoluokitus.

import type { Company } from './prh';
import type { Statement } from './financials';
import type { LeiRecord, VatCheck } from './sources';
import { isValidYtunnus } from './ytunnus';
import { date } from './format';

export type Level = 'ok' | 'warn' | 'bad' | 'info';

export interface Check { level: Level; title: string; detail?: string }

export interface Verdict { level: 'ok' | 'warn' | 'bad'; title: string; summary: string }

export interface RiskInput {
  ytunnus: string;
  company: Company | null;
  statements?: Statement[] | null;
  vat?: VatCheck | null;
  lei?: LeiRecord | null;
  today?: Date;
}

const yearsBetween = (from: string, to: Date) =>
  (to.getTime() - new Date(from).getTime()) / (365.25 * 24 * 3600 * 1000);

export function assessRisk(input: RiskInput): { checks: Check[]; verdict: Verdict } {
  const { ytunnus, company: c, statements, vat, lei } = input;
  const today = input.today ?? new Date();
  const checks: Check[] = [];

  checks.push(
    isValidYtunnus(ytunnus)
      ? { level: 'ok', title: 'Y-tunnus on muodoltaan oikein' }
      : { level: 'bad', title: 'Y-tunnuksen tarkistusnumero ei täsmää', detail: 'Tunnus voi olla keksitty tai kirjoitettu väärin.' },
  );

  if (!c) {
    checks.push({
      level: 'bad',
      title: 'Ei löydy kaupparekisteristä (YTJ)',
      detail: 'Toiminimet eivät näy avoimessa rajapinnassa – tarkista ytj.fi-palvelusta.',
    });
    return { checks, verdict: verdictOf(checks) };
  }

  if (c.endDate) {
    checks.push({ level: 'bad', title: 'Toiminta on päättynyt', detail: `Päättymispäivä ${date(c.endDate)}` });
  }
  for (const s of c.situations) {
    checks.push({ level: 'bad', title: s.label, detail: s.since ? `Merkitty ${date(s.since)}` : undefined });
  }
  if (!c.endDate && c.situations.length === 0) {
    checks.push({ level: 'ok', title: 'Ei konkurssia, saneerausta tai selvitystilaa' });
  }

  checks.push(
    c.inTradeRegister
      ? { level: 'ok', title: 'Merkitty kaupparekisteriin' }
      : { level: 'warn', title: 'Ei kaupparekisterissä' },
  );

  const reg = (code: string) => c.registers.find((r) => r.register === code);
  const prepay = reg('5');
  checks.push(
    prepay?.active
      ? { level: 'ok', title: 'Ennakkoperintärekisterissä', detail: prepay.since ? `Alkaen ${date(prepay.since)}` : undefined }
      : {
          level: 'warn',
          title: 'Ei ennakkoperintärekisterissä',
          detail: 'Laskun maksajan on tehtävä ennakonpidätys. Tavallista vain pienille tai uusille yrityksille.',
        },
  );

  const alv = reg('6');
  if (alv?.active) checks.push({ level: 'ok', title: 'Arvonlisäverorekisterissä' });
  else checks.push({ level: 'info', title: 'Ei arvonlisäverorekisterissä', detail: 'Laskulla ei saa periä ALV:ta.' });

  if (vat) {
    checks.push(
      vat.valid
        ? { level: 'ok', title: 'EU:n ALV-numero voimassa (VIES)', detail: vat.name }
        : { level: alv?.active ? 'warn' : 'info', title: 'ALV-numero ei voimassa EU:n VIES-järjestelmässä' },
    );
  }

  const employer = reg('7');
  checks.push(
    employer?.active
      ? { level: 'info', title: 'Työnantajarekisterissä', detail: 'Maksaa säännöllisesti palkkoja.' }
      : { level: 'info', title: 'Ei työnantajarekisterissä' },
  );

  if (c.registrationDate) {
    const age = yearsBetween(c.registrationDate, today);
    if (age < 1) checks.push({ level: 'warn', title: 'Alle vuoden vanha yritys', detail: `Rekisteröity ${date(c.registrationDate)}` });
    else checks.push({ level: 'ok', title: `Toiminut ${Math.floor(age)} vuotta`, detail: `Rekisteröity ${date(c.registrationDate)}` });
  }

  if (c.formerNames.length >= 3) {
    checks.push({ level: 'warn', title: `Nimi vaihdettu ${c.formerNames.length} kertaa`, detail: 'Toistuvat nimenmuutokset voivat olla varoitusmerkki.' });
  }

  const latest = statements?.[0];
  if (statements && !latest) {
    checks.push({ level: 'info', title: 'Ei digitaalista tilinpäätöstä', detail: 'Tilinpäätöksen voi tilata PRH:n Virre-palvelusta.' });
  }
  if (latest) {
    const { totalEquity, netProfit } = latest.figures;
    if (totalEquity !== null && totalEquity < 0) {
      checks.push({ level: 'bad', title: 'Oma pääoma negatiivinen', detail: `Tilikausi ${date(latest.periodEnd)}` });
    } else if (totalEquity !== null) {
      checks.push({ level: 'ok', title: 'Oma pääoma positiivinen', detail: `Tilikausi ${date(latest.periodEnd)}` });
    }
    if (netProfit !== null) {
      checks.push(
        netProfit < 0
          ? { level: 'warn', title: 'Viimeisin tilikausi tappiollinen', detail: `Tilikausi ${date(latest.periodEnd)}` }
          : { level: 'ok', title: 'Viimeisin tilikausi voitollinen', detail: `Tilikausi ${date(latest.periodEnd)}` },
      );
    }
    if (latest.equityRatio !== null && latest.equityRatio >= 0 && latest.equityRatio < 20) {
      checks.push({ level: 'warn', title: `Heikko omavaraisuusaste (${latest.equityRatio.toFixed(0)} %)`, detail: 'Alle 20 % katsotaan yleensä heikoksi.' });
    }
  }

  if (lei) {
    const lapsed = lei.registrationStatus && lei.registrationStatus !== 'ISSUED';
    checks.push({
      level: lapsed ? 'warn' : 'ok',
      title: lapsed ? `LEI-tunnus ei voimassa (${lei.registrationStatus})` : 'LEI-tunnus voimassa',
      detail: lei.lei,
    });
  }

  if (!c.website) checks.push({ level: 'info', title: 'Kotisivua ei ilmoitettu rekisteriin' });

  return { checks, verdict: verdictOf(checks) };
}

function verdictOf(checks: Check[]): Verdict {
  const bad = checks.filter((c) => c.level === 'bad').length;
  const warn = checks.filter((c) => c.level === 'warn').length;
  if (bad > 0) {
    return { level: 'bad', title: 'Korkea riski', summary: `${bad} vakavaa ja ${warn} muuta huomiota julkisissa tiedoissa.` };
  }
  if (warn >= 2) {
    return { level: 'warn', title: 'Tarkista huolella', summary: `${warn} huomiota julkisissa tiedoissa.` };
  }
  return {
    level: 'ok',
    title: 'Ei merkittäviä riskejä',
    summary: warn ? '1 huomio julkisissa tiedoissa.' : 'Julkisista lähteistä ei löytynyt varoitusmerkkejä.',
  };
}
