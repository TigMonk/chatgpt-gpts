import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, colors, ErrorBox, LinkList, Loading, SourceNote } from '../components/ui';
import { personLinks } from '../lib/links';
import { searchCompanies, type SearchHit } from '../lib/prh';

export default function PersonScreen() {
  const { nimi } = useLocalSearchParams<{ nimi: string }>();
  const name = (nimi ?? '').trim();
  const [hits, setHits] = useState<SearchHit[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setHits(undefined);
    setError(null);
    searchCompanies(name).then(
      (r) => setHits(r.hits),
      (e) => setError(e instanceof Error ? e.message : 'Haku epäonnistui'),
    );
  }, [name]);

  useEffect(load, [load]);

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card title="Yritykset henkilön nimellä">
          <Text style={s.muted}>Kaupparekisterin yritykset, joiden nimessä esiintyy ”{name}”.</Text>
          {hits === undefined && !error ? <Loading /> : null}
          {error ? <ErrorBox text={error} onRetry={load} /> : null}
          {hits?.length === 0 ? <Text style={[s.muted, { marginTop: 8 }]}>Ei osumia.</Text> : null}
          {hits?.map((h) => (
            <Pressable
              key={h.businessId}
              onPress={() => router.push({ pathname: '/yritys/[id]', params: { id: h.businessId } })}
              style={({ pressed }) => [s.item, pressed && { opacity: 0.6 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{h.name}</Text>
                <Text style={s.muted}>
                  {h.businessId}
                  {h.companyForm ? ` · ${h.companyForm}` : ''}
                </Text>
              </View>
              {h.ended ? <Badge level="bad" text="Ei aktiivinen" /> : null}
            </Pressable>
          ))}
        </Card>

        <Card title="Tarkista lisää">
          <LinkList links={personLinks(name)} />
        </Card>

        <Card title="Miksi tietoja on rajallisesti?">
          <Text style={s.body}>
            PRH:n avoin rajapinta ei sisällä henkilötietoja (hallituksen jäsenet, omistajat). Henkilön yritysroolit
            näkyvät PRH:n Virre-palvelussa ja Finderissä. Yksityishenkilön osoite-, puhelin- ja ajoneuvotietojen
            kokoaminen ilman lakiperustetta on tietosuoja-asetuksen (GDPR) vastaista, joten sovellus ei kerää
            niitä.
          </Text>
        </Card>

        <SourceNote>Lähde: PRH / avoindata.prh.fi, CC BY 4.0</SourceNote>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
});
