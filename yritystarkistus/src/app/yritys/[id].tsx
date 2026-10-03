import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, CheckItem, colors, ErrorBox, levelColor, LinkList, Loading, Row, SourceNote } from '../../components/ui';
import { getStatements, KEY_LABELS, type KeyFigure, type Statement } from '../../lib/financials';
import { date, euro, percent } from '../../lib/format';
import { companyLinks } from '../../lib/links';
import { getCompany, type Company } from '../../lib/prh';
import { assessRisk } from '../../lib/risk';
import { checkVat, ENTRY_CODES, getLei, getNotices, type LeiRecord, type Notice, type VatCheck } from '../../lib/sources';
import { isValidYtunnus, toVatNumber } from '../../lib/ytunnus';

/** Tila yhdelle tietolähteelle: undefined = latautuu, null = ei tietoa, Error = virhe. */
type Slot<T> = T | null | undefined | Error;
const ready = <T,>(s: Slot<T>): T | null | undefined => (s instanceof Error ? null : s);

const FIGURE_ROWS: KeyFigure[] = ['revenue', 'operatingProfit', 'netProfit', 'personnelExpenses', 'totalAssets', 'totalEquity', 'totalLiabilities'];

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ytunnus = id ?? '';
  const [company, setCompany] = useState<Slot<Company>>(undefined);
  const [statements, setStatements] = useState<Slot<Statement[]>>(undefined);
  const [notices, setNotices] = useState<Slot<Notice[]>>(undefined);
  const [vat, setVat] = useState<Slot<VatCheck>>(undefined);
  const [lei, setLei] = useState<Slot<LeiRecord>>(undefined);
  const [showAllNotices, setShowAllNotices] = useState(false);

  const load = useCallback(() => {
    setCompany(undefined);
    setStatements(undefined);
    setNotices(undefined);
    setVat(undefined);
    setLei(undefined);
    const settle = <T,>(p: Promise<T | null>, set: (v: Slot<T>) => void) =>
      p.then(
        (v) => set(v),
        (e) => set(e instanceof Error ? e : new Error(String(e))),
      );
    // Kaikki lähteet haetaan rinnakkain; kukin osio piirtyy heti kun sen data saapuu.
    settle(getCompany(ytunnus), setCompany);
    settle(getStatements(ytunnus), setStatements);
    settle(getNotices(ytunnus), setNotices);
    settle(checkVat(ytunnus), setVat);
    settle(getLei(ytunnus), setLei);
  }, [ytunnus]);

  useEffect(load, [load]);

  const c = ready(company);
  const risk = useMemo(() => {
    if (company === undefined || company instanceof Error) return null;
    return assessRisk({
      ytunnus,
      company: c ?? null,
      statements: ready(statements),
      vat: ready(vat),
      lei: ready(lei),
    });
  }, [ytunnus, company, c, statements, vat, lei]);

  const stillLoading = [statements, vat, lei].some((x) => x === undefined);
  const name = c?.name ?? ytunnus;

  return (
    <>
      <Stack.Screen options={{ title: c?.name ?? ytunnus }} />
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        {company === undefined ? <Loading text="Haetaan kaupparekisteristä…" /> : null}
        {company instanceof Error ? <ErrorBox text={`YTJ-haku epäonnistui: ${company.message}`} onRetry={load} /> : null}

        {risk ? (
          <View style={[s.verdict, { backgroundColor: levelColor[risk.verdict.level].bg, borderColor: levelColor[risk.verdict.level].fg }]}>
            <Text style={[s.verdictTitle, { color: levelColor[risk.verdict.level].fg }]}>
              {levelColor[risk.verdict.level].icon}  {risk.verdict.title}
            </Text>
            <Text style={s.verdictText}>{risk.verdict.summary}</Text>
            {stillLoading ? <Text style={s.verdictSmall}>Lisätietoja haetaan vielä…</Text> : null}
          </View>
        ) : null}

        {c ? (
          <Card title="Perustiedot">
            <Text style={s.companyName} selectable>{c.name}</Text>
            <Row label="Y-tunnus" value={c.businessId} />
            <Row label="ALV-numero" value={toVatNumber(c.businessId)} />
            <Row label="Yhtiömuoto" value={c.companyForm} />
            <Row label="Toimiala" value={c.businessLine ? `${c.businessLine.description ?? ''}${c.businessLine.code ? ` (${c.businessLine.code})` : ''}` : undefined} />
            <Row label="Rekisteröity" value={date(c.registrationDate)} />
            {c.endDate ? <Row label="Lopetettu" value={date(c.endDate)} /> : null}
            {c.addresses.map((a, i) => (
              <Row key={i} label={a.kind} value={a.text} />
            ))}
            {c.website ? (
              <Row
                label="Kotisivu"
                value={
                  <Pressable onPress={() => WebBrowser.openBrowserAsync(c.website!)}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>{c.website.replace(/^https?:\/\//, '')}</Text>
                  </Pressable>
                }
              />
            ) : null}
            {c.otherNames.length ? <Row label="Aputoiminimet" value={c.otherNames.join(', ')} /> : null}
            {c.formerNames.length ? (
              <Row label="Aiemmat nimet" value={c.formerNames.map((n) => `${n.name}${n.until ? ` (–${date(n.until)})` : ''}`).join('\n')} />
            ) : null}
            <Row label="Päivitetty" value={date(c.lastModified)} last />
          </Card>
        ) : null}

        {risk ? (
          <Card title="Luotettavuustarkistus">
            {risk.checks.map((ch, i) => (
              <CheckItem key={i} {...ch} />
            ))}
            <Text style={s.disclaimer}>
              Arvio perustuu julkisiin rekistereihin eikä ole luottoluokitus. Tarkista verovelka YTJ:stä ja
              maksuhäiriöt luottotietopalvelusta ennen merkittäviä sopimuksia.
            </Text>
          </Card>
        ) : null}

        {company !== undefined ? (
          <Card title="Talous" right={<Text style={s.small}>Digitaaliset tilinpäätökset</Text>}>
            {statements === undefined ? <Loading text="Haetaan tilinpäätöksiä…" /> : null}
            {statements instanceof Error ? <ErrorBox text={statements.message} /> : null}
            {Array.isArray(statements) && statements.length === 0 ? (
              <Text style={s.muted}>
                Yritys ei ole jättänyt tilinpäätöstä digitaalisessa iXBRL-muodossa. Talousluvut löytyvät
                Finderistä tai PRH:n Virre-palvelusta (linkit alla).
              </Text>
            ) : null}
            {Array.isArray(statements) && statements.length > 0 ? <FinancialTable statements={statements} /> : null}
          </Card>
        ) : null}

        {c ? (
          <Card title="Rekisterit">
            {c.registers.length === 0 ? <Text style={s.muted}>Ei voimassa olevia rekisterimerkintöjä.</Text> : null}
            {c.registers.map((r, i) => (
              <Row
                key={`${r.register}-${i}`}
                label={r.name}
                last={i === c.registers.length - 1}
                value={
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Badge level={r.active ? 'ok' : 'warn'} text={r.status} />
                    {r.since ? <Text style={s.small}>{date(r.since)} alkaen</Text> : null}
                  </View>
                }
              />
            ))}
          </Card>
        ) : null}

        {company !== undefined ? (
          <Card title="EU ja rahoitusala">
            <Row
              label="ALV-numero (VIES)"
              value={
                vat === undefined ? '…' : vat instanceof Error ? 'Ei saatavilla' : vat === null ? 'Ei tietoa' : vat.valid ? 'Voimassa ✓' : 'Ei voimassa'
              }
            />
            <Row
              label="LEI-tunnus"
              value={lei === undefined ? '…' : lei instanceof Error ? 'Ei saatavilla' : lei === null ? 'Ei LEI-tunnusta' : lei.lei}
            />
            {lei && !(lei instanceof Error) ? (
              <>
                <Row label="LEI-tila" value={lei.registrationStatus === 'ISSUED' ? 'Voimassa' : lei.registrationStatus} />
                <Row label="Uusittava" value={date(lei.nextRenewal)} last />
              </>
            ) : null}
          </Card>
        ) : null}

        {company !== undefined ? (
          <Card title="Kaupparekisteri-ilmoitukset">
            {notices === undefined ? <Loading /> : null}
            {notices instanceof Error ? <ErrorBox text={notices.message} /> : null}
            {Array.isArray(notices) && notices.length === 0 ? <Text style={s.muted}>Ei ilmoituksia vuoden 2014 jälkeen.</Text> : null}
            {Array.isArray(notices)
              ? (showAllNotices ? notices : notices.slice(0, 8)).map((n, i) => (
                  <Row
                    key={`${n.recordNumber}-${i}`}
                    label={date(n.date)}
                    value={n.codes.map((code) => ENTRY_CODES[code] ?? code).join(', ') || n.recordNumber}
                  />
                ))
              : null}
            {Array.isArray(notices) && notices.length > 8 && !showAllNotices ? (
              <Pressable onPress={() => setShowAllNotices(true)} style={{ paddingTop: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Näytä kaikki {notices.length}</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        {company !== undefined && isValidYtunnus(ytunnus) ? (
          <Card title="Lisää tietoa">
            <LinkList links={companyLinks(ytunnus, name)} />
          </Card>
        ) : null}

        <SourceNote>
          Lähteet: PRH / avoindata.prh.fi (CC BY 4.0), Euroopan komissio VIES, GLEIF.{'\n'}
          Vedä alas päivittääksesi.
        </SourceNote>
      </ScrollView>
    </>
  );
}

function FinancialTable({ statements }: { statements: Statement[] }) {
  const cols = statements.slice(0, 3);
  return (
    <View>
      <View style={s.tRow}>
        <Text style={[s.tLabel, s.tHead]}>Tilikausi</Text>
        {cols.map((st) => (
          <Text key={st.periodEnd} style={[s.tCell, s.tHead]}>
            {st.periodEnd?.slice(0, 4) ?? '–'}
          </Text>
        ))}
      </View>
      {FIGURE_ROWS.map((k) => (
        <View key={k} style={s.tRow}>
          <Text style={s.tLabel}>{KEY_LABELS[k]}</Text>
          {cols.map((st) => {
            const v = st.figures[k];
            return (
              <Text key={st.periodEnd} style={[s.tCell, v !== null && v < 0 && { color: colors.bad }]}>
                {euro(v)}
              </Text>
            );
          })}
        </View>
      ))}
      <View style={s.tRow}>
        <Text style={s.tLabel}>Omavaraisuusaste</Text>
        {cols.map((st) => (
          <Text key={st.periodEnd} style={s.tCell}>{percent(st.equityRatio)}</Text>
        ))}
      </View>
      <View style={[s.tRow, { borderBottomWidth: 0 }]}>
        <Text style={s.tLabel}>Liikevoitto-%</Text>
        {cols.map((st) => (
          <Text key={st.periodEnd} style={s.tCell}>{percent(st.operatingMargin)}</Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  verdict: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  verdictTitle: { fontSize: 20, fontWeight: '800' },
  verdictText: { color: colors.text, marginTop: 4, fontSize: 15 },
  verdictSmall: { color: colors.muted, marginTop: 6, fontSize: 12 },
  companyName: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  muted: { color: colors.muted, lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12 },
  disclaimer: { color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 17 },
  tRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tHead: { fontWeight: '700', color: colors.text },
  tLabel: { flex: 1.3, color: colors.muted, fontSize: 13 },
  tCell: { flex: 1, textAlign: 'right', color: colors.text, fontSize: 13, fontVariant: ['tabular-nums'] },
});
