import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, colors, ErrorBox, Loading, SourceNote } from '../components/ui';
import { searchCompanies, type SearchHit } from '../lib/prh';

export default function ResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchCompanies(q ?? '', p);
        setTotal(res.total);
        setHits((prev) => (p === 1 ? res.hits : [...prev, ...res.hits]));
        setPage(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Haku epäonnistui');
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: `”${q}”` }} />
      <FlatList
        data={hits}
        keyExtractor={(h) => h.businessId}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          hits.length ? <Text style={s.count}>{total} yritystä</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/yritys/[id]', params: { id: item.businessId } })}
            style={({ pressed }) => [s.item, pressed && { opacity: 0.6 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                {item.businessId}
                {item.companyForm ? ` · ${item.companyForm}` : ''}
                {item.city ? ` · ${item.city}` : ''}
              </Text>
            </View>
            {item.ended ? <Badge level="bad" text="Ei aktiivinen" /> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : error ? null : (
            <Text style={s.empty}>
              Ei osumia. Huom: toiminimet (yksityiset elinkeinonharjoittajat) eivät näy PRH:n avoimessa
              rajapinnassa – hae niitä Y-tunnuksella tai ytj.fi-palvelusta.
            </Text>
          )
        }
        ListFooterComponent={
          <>
            {loading ? <Loading /> : null}
            {error ? <ErrorBox text={error} onRetry={() => load(page)} /> : null}
            {!loading && !error && hits.length < total ? (
              <Pressable onPress={() => load(page + 1)} style={s.more}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Näytä lisää</Text>
              </Pressable>
            ) : null}
            <SourceNote>Lähde: PRH / avoindata.prh.fi, CC BY 4.0</SourceNote>
          </>
        }
      />
    </>
  );
}

const s = StyleSheet.create({
  count: { color: colors.muted, marginBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, marginTop: 3, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  more: { alignItems: 'center', padding: 14 },
});
