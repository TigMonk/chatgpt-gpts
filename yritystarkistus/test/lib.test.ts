/// <reference types="node" />
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { getStatements, parseStatement } from '../src/lib/financials';
import { date, euro, percent } from '../src/lib/format';
import { setFetch } from '../src/lib/http';
import { getCompany, normalizeCompany, searchCompanies } from '../src/lib/prh';
import { assessRisk } from '../src/lib/risk';
import { checkVat, getLei, getNotices } from '../src/lib/sources';
import { checkDigit, isValidYtunnus, normalizeYtunnus, toVatNumber } from '../src/lib/ytunnus';
import { activeCompany, bankruptCompany, xbrl } from './fixtures';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('Y-tunnus', () => {
  it('validates real business IDs', () => {
    assert.equal(isValidYtunnus('0112038-9'), true); // Nokia
    assert.equal(isValidYtunnus('0109862-8'), true); // Kesko
    assert.equal(isValidYtunnus('0112038-8'), false);
  });
  it('normalizes common input forms', () => {
    assert.equal(normalizeYtunnus(' FI01120389 '), '0112038-9');
    assert.equal(normalizeYtunnus('112038-9'), '0112038-9');
    assert.equal(normalizeYtunnus('01120389'), '0112038-9');
    assert.equal(normalizeYtunnus('Nokia'), null);
  });
  it('rejects bodies with remainder 1', () => {
    assert.equal(checkDigit('0000030'), null); // 3*4 = 12 -> 12 % 11 = 1
  });
  it('builds VAT number', () => assert.equal(toVatNumber('0112038-9'), 'FI01120389'));
});

describe('PRH normalize', () => {
  it('picks current Finnish data', () => {
    const c = normalizeCompany(activeCompany);
    assert.equal(c.name, 'Nokia Oyj');
    assert.deepEqual(c.otherNames, ['Nokia Aktiebolag']);
    assert.deepEqual(c.formerNames, [{ name: 'Oy Nokia Ab', until: '1997-08-31' }]);
    assert.equal(c.companyForm, 'Julkinen osakeyhtiö');
    assert.equal(c.businessLine?.description, 'Pääkonttorien toiminta');
    assert.equal(c.website, 'https://www.nokia.com');
    assert.equal(c.inTradeRegister, true);
    assert.equal(c.addresses[0].text, 'Karakaari 7, 02610 Espoo');
    assert.equal(c.addresses[1].text, 'PL 226, 00045 Nokia Group');
    assert.deepEqual(c.registers.map((r) => r.name), [
      'Kaupparekisteri',
      'Ennakkoperintärekisteri',
      'Arvonlisäverorekisteri',
      'Työnantajarekisteri',
    ]);
  });
  it('maps bankruptcy and drops ended register entries', () => {
    const c = normalizeCompany(bankruptCompany);
    assert.deepEqual(c.situations.map((s) => s.label), ['Konkurssissa']);
    assert.equal(c.registers.find((r) => r.register === '5'), undefined);
  });
});

describe('Financial statements (XBRL)', () => {
  it('extracts current-period key figures and ratios', () => {
    const s = parseStatement(xbrl);
    assert.equal(s.periodEnd, '2024-12-31');
    assert.equal(s.figures.revenue, 1250000); // not the 2023 comparative 900000
    assert.equal(s.figures.operatingProfit, 125000);
    assert.equal(s.figures.netProfit, -15000);
    assert.equal(s.figures.totalLiabilities, 680000); // derived = assets - equity
    assert.equal(s.equityRatio, 15);
    assert.equal(s.operatingMargin, 10);
  });
});

describe('Risk assessment', () => {
  const today = new Date('2026-10-03');
  it('healthy company passes', () => {
    const r = assessRisk({ ytunnus: '0112038-9', company: normalizeCompany(activeCompany), statements: [], vat: { valid: true }, today });
    assert.equal(r.verdict.level, 'ok');
    assert.ok(r.checks.some((c) => c.title === 'Ennakkoperintärekisterissä'));
  });
  it('bankrupt, young company with weak finances is high risk', () => {
    const r = assessRisk({
      ytunnus: '1234567-1',
      company: normalizeCompany(bankruptCompany),
      statements: [parseStatement(xbrl)],
      today,
    });
    assert.equal(r.verdict.level, 'bad');
    const titles = r.checks.map((c) => c.title);
    assert.ok(titles.includes('Konkurssissa'));
    assert.ok(titles.includes('Ei ennakkoperintärekisterissä'));
    assert.ok(titles.includes('Alle vuoden vanha yritys'));
    assert.ok(titles.includes('Viimeisin tilikausi tappiollinen'));
    assert.ok(titles.some((t) => t.startsWith('Heikko omavaraisuusaste')));
  });
  it('unknown business ID is high risk', () => {
    const r = assessRisk({ ytunnus: '0112038-8', company: null });
    assert.equal(r.verdict.level, 'bad');
    assert.equal(r.checks.length, 2);
  });
});

describe('API clients (mocked network)', () => {
  let calls: string[];
  beforeEach(() => {
    calls = [];
  });

  it('YTJ lookup and search build correct URLs', async () => {
    setFetch(async (url) => {
      calls.push(url);
      return json({ totalResults: 1, companies: [activeCompany] });
    });
    const c = await getCompany('0112038-9');
    assert.equal(c?.name, 'Nokia Oyj');
    const res = await searchCompanies('Nokia Oyj');
    assert.equal(res.hits[0].city, 'Espoo');
    assert.equal(calls[0], 'https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=0112038-9');
    assert.equal(calls[1], 'https://avoindata.prh.fi/opendata-ytj-api/v3/companies?name=Nokia%20Oyj&page=1');
  });

  it('YTJ returns null when not found', async () => {
    setFetch(async () => json({ totalResults: 0, companies: [] }));
    assert.equal(await getCompany('0112038-9'), null);
  });

  it('fetches newest statements first', async () => {
    setFetch(async (url) => {
      calls.push(url);
      if (url.includes('/financials?')) {
        return json({ financials: [{ businessId: 'x', financialDate: '2023-12-31' }, { businessId: 'x', financialDate: '2024-12-31' }] });
      }
      if (url.includes('2024-12-31')) return new Response(xbrl, { status: 200 });
      return new Response('', { status: 400 });
    });
    const s = await getStatements('2345678-0');
    assert.equal(s.length, 1);
    assert.equal(s[0].figures.revenue, 1250000);
    assert.match(calls[1], /financialDate=2024-12-31/);
  });

  it('parses notices, VIES and GLEIF', async () => {
    setFetch(async (url) => {
      if (url.includes('registerednotices')) {
        return json({ publicNotices: [
          { registrationDate: '2025-04-25', recordNumber: '2025/1T', entryCodes: ['TASE'] },
          { registrationDate: '2026-04-25', recordNumber: '2026/2T', entryCodes: ['TASE'] },
        ] });
      }
      if (url.includes('vies')) return json({ isValid: true, name: 'Nokia Oyj', address: '---', requestDate: '2026-10-03' });
      if (url.includes('gleif')) {
        return json({ data: [{ attributes: {
          lei: '549300A0JPRWG1KI7U06',
          entity: { legalName: { name: 'Nokia Oyj' }, status: 'ACTIVE' },
          registration: { status: 'ISSUED', nextRenewalDate: '2027-01-01T00:00:00Z' },
        } }] });
      }
      return json({}, 404);
    });
    const n = await getNotices('0112038-9');
    assert.equal(n[0].date, '2026-04-25');
    const v = await checkVat('0112038-9');
    assert.deepEqual(v, { valid: true, name: 'Nokia Oyj', address: undefined, checkedAt: '2026-10-03' });
    const l = await getLei('0112038-9');
    assert.equal(l?.registrationStatus, 'ISSUED');
    assert.equal(l?.nextRenewal, '2027-01-01');
  });

  it('turns network failures into Finnish errors', async () => {
    setFetch(async () => {
      throw new TypeError('fetch failed');
    });
    await assert.rejects(getCompany('0112038-9'), /Verkkovirhe/);
    setFetch(async () => json({}, 500));
    await assert.rejects(getCompany('0112038-9'), /virheen 500/);
  });
});

describe('Finnish formatting', () => {
  it('formats euros, percents and dates', () => {
    assert.equal(euro(45300), '45 300 €');
    assert.equal(euro(-1250000), '−1,3 M€');
    assert.equal(euro(null), '–');
    assert.equal(percent(15), '15,0 %');
    assert.equal(date('2024-03-05'), '5.3.2024');
  });
});
