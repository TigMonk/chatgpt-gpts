import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../components/ui';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: 'Takaisin',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Yritystarkistus' }} />
        <Stack.Screen name="haku" options={{ title: 'Hakutulokset' }} />
        <Stack.Screen name="yritys/[id]" options={{ title: 'Yritys' }} />
        <Stack.Screen name="henkilo" options={{ title: 'Henkilö' }} />
      </Stack>
    </>
  );
}
