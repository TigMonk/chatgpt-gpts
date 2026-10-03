import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, colors } from '../components/ui';
import { isValidYtunnus, looksLikeYtunnus, normalizeYtunnus } from '../lib/ytunnus';

type Mode = 'yritys' | 'henkilo';

const EXAMPLES = [
  { label: 'Nokia Oyj', query: '0112038-9' },
  { label: 'Kesko Oyj', query: '0109862-8' },
  { label: 'Hae nimellä: Reaktor', query: 'Reaktor' },
];

export default function SearchScreen() {
  const [mode, setMode] = useState<Mode>('yritys');
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const isId = mode === 'yritys' && looksLikeYtunnus(trimmed);
  const idWarning = isId && !isValidYtunnus(trimmed);

  const submit = (value = trimmed, m = mode) => {
    const v = value.trim();
    if (v.length < 2) return;
    if (m === 'henkilo') {
      router.push({ pathname: '/henkilo', params: { nimi: v } });
    } else if (looksLikeYtunnus(v)) {
      router.push({ pathname: '/yritys/[id]', params: { id: normalizeYtunnus(v)! } });
    } else {
      router.push({ pathname: '/haku', params: { q: v } });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>Tarkista yritys tai henkilö</Text>
        <Text style={s.lead}>
          Hae Y-tunnuksella tai nimellä. Sovellus kokoaa tiedot PRH:n, Verohallinnon, EU:n ja GLEIFin
          avoimista rekistereistä ja arvioi, onko yritys luotettava.
        </Text>

        <View style={s.segment}>
          {(['yritys', 'henkilo'] as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[s.segBtn, mode === m && s.segBtnActive]}>
              <Text style={[s.segText, mode === m && s.segTextActive]}>{m === 'yritys' ? 'Yritys' : 'Henkilö'}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => submit()}
          placeholder={mode === 'yritys' ? 'Y-tunnus (1234567-8) tai yrityksen nimi' : 'Etunimi Sukunimi'}
          placeholderTextColor="#8A97AD"
          style={s.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize={mode === 'henkilo' ? 'words' : 'none'}
        />
        {isId ? (
          <Text style={[s.hint, idWarning && { color: colors.bad }]}>
            {idWarning ? '⚠ Y-tunnuksen tarkistusnumero ei täsmää' : `✓ Y-tunnus ${normalizeYtunnus(trimmed)}`}
          </Text>
        ) : null}

        <Pressable
          onPress={() => submit()}
          disabled={trimmed.length < 2}
          style={({ pressed }) => [s.button, (pressed || trimmed.length < 2) && { opacity: 0.6 }]}
        >
          <Text style={s.buttonText}>Hae</Text>
        </Pressable>

        {mode === 'yritys' ? (
          <Card title="Kokeile">
            {EXAMPLES.map((e) => (
              <Pressable key={e.query} onPress={() => submit(e.query, 'yritys')} style={s.example}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>{e.label}</Text>
                <Text style={{ color: colors.muted }}>{e.query}</Text>
              </Pressable>
            ))}
          </Card>
        ) : (
          <Card title="Mitä henkilöstä voi hakea?">
            <Text style={s.body}>
              Sovellus näyttää henkilön nimellä rekisteröidyt yritykset sekä pikalinkit yritysrooleihin,
              pakote- ja PEP-listoihin ja uutisiin. Yksityishenkilöiden osoite-, puhelin- ja ajoneuvotietoja ei
              kerätä (tietosuoja, GDPR).
            </Text>
          </Card>
        )}

        <Card title="Tietolähteet">
          <Text style={s.body}>
            • PRH / YTJ: kaupparekisteri, ennakkoperintä-, ALV- ja työnantajarekisteri{'\n'}
            • PRH: digitaaliset tilinpäätökset ja kaupparekisteri-ilmoitukset{'\n'}
            • EU VIES: ALV-numeron voimassaolo{'\n'}
            • GLEIF: LEI-tunnus (rahoitusala){'\n'}
            • Pikalinkit: YTJ-verovelkarekisteri, Finder, Finanssivalvonta, OpenSanctions
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8 },
  lead: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 16, lineHeight: 21 },
  segment: { flexDirection: 'row', backgroundColor: '#E2E7F0', borderRadius: 10, padding: 3, marginBottom: 12 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#fff' },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextActive: { color: colors.text },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  hint: { marginTop: 6, color: colors.ok, fontWeight: '600' },
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginVertical: 16 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  example: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
});
