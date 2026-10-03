import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExternalLink } from '../lib/links';
import type { Level } from '../lib/risk';

export const colors = {
  bg: '#F3F5F9',
  card: '#FFFFFF',
  text: '#14213D',
  muted: '#5C6B84',
  border: '#E1E6EF',
  primary: '#0B4F9C',
  ok: '#1E8E4E',
  okBg: '#E5F5EC',
  warn: '#B86E00',
  warnBg: '#FFF3DC',
  bad: '#C62828',
  badBg: '#FDE7E7',
  info: '#46618A',
  infoBg: '#E9EFF8',
};

export const levelColor: Record<Level, { fg: string; bg: string; icon: string }> = {
  ok: { fg: colors.ok, bg: colors.okBg, icon: '✓' },
  warn: { fg: colors.warn, bg: colors.warnBg, icon: '!' },
  bad: { fg: colors.bad, bg: colors.badBg, icon: '✕' },
  info: { fg: colors.info, bg: colors.infoBg, icon: 'i' },
};

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Row({ label, value, last }: { label: string; value?: ReactNode; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {typeof value === 'string' || value === undefined ? (
        <Text style={styles.rowValue} selectable>
          {value ?? '–'}
        </Text>
      ) : (
        <View style={{ flex: 1.4, alignItems: 'flex-end' }}>{value}</View>
      )}
    </View>
  );
}

export function CheckItem({ level, title, detail }: { level: Level; title: string; detail?: string }) {
  const c = levelColor[level];
  return (
    <View style={styles.check}>
      <View style={[styles.checkIcon, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.fg, fontWeight: '800' }}>{c.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.checkTitle}>{title}</Text>
        {detail ? <Text style={styles.muted}>{detail}</Text> : null}
      </View>
    </View>
  );
}

export function Badge({ level, text }: { level: Level; text: string }) {
  const c = levelColor[level];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export function Loading({ text = 'Haetaan…' }: { text?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <View style={[styles.loading, { alignItems: 'flex-start' }]}>
      <Text style={{ color: colors.bad, flex: 1 }}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={styles.link}>Yritä uudelleen</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LinkList({ links }: { links: ExternalLink[] }) {
  const groups = [...new Set(links.map((l) => l.group))];
  return (
    <>
      {groups.map((g) => (
        <View key={g} style={{ marginBottom: 6 }}>
          <Text style={styles.groupTitle}>{g}</Text>
          {links
            .filter((l) => l.group === g)
            .map((l) => (
              <Pressable
                key={l.label}
                onPress={() => WebBrowser.openBrowserAsync(l.url)}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
                accessibilityRole="link"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>{l.label}</Text>
                  <Text style={styles.muted}>{l.hint}</Text>
                </View>
                <Text style={styles.chevron}>↗</Text>
              </Pressable>
            ))}
        </View>
      ))}
    </>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <Text style={styles.source}>{children}</Text>;
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  rowValue: { flex: 1.4, color: colors.text, fontSize: 14, textAlign: 'right', fontWeight: '500' },
  check: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'flex-start' },
  checkIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  link: { color: colors.primary, fontWeight: '600' },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 6, marginBottom: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkLabel: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.muted, fontSize: 18, marginLeft: 8 },
  source: { color: colors.muted, fontSize: 12, textAlign: 'center', marginVertical: 16, lineHeight: 18 },
});
