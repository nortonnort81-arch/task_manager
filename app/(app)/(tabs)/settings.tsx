import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestReminderPermissions } from '@/lib/reminders';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const [permLabel, setPermLabel] = useState<string>('…');

  useEffect(() => {
    Notifications.getPermissionsAsync().then((s) => {
      setPermLabel(s.granted ? 'Granted' : 'Not granted');
    });
  }, []);

  const askNotifications = async () => {
    const ok = await requestReminderPermissions();
    setPermLabel(ok ? 'Granted' : 'Not granted');
    if (!ok) {
      Alert.alert(
        'Notifications',
        'Open system settings for this app and enable notifications to get due-time reminders.'
      );
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.block}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Signed in as
        </ThemedText>
        <ThemedText type="default">{user?.email ?? '—'}</ThemedText>
      </View>

      <View style={styles.block}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Reminders
        </ThemedText>
        <ThemedText type="default" style={styles.hint}>
          Local alerts fire at the due time you set on each task. Status: {permLabel}
        </ThemedText>
        <Pressable
          onPress={askNotifications}
          style={[styles.secondary, { borderColor: colorScheme === 'dark' ? '#444' : '#ddd' }]}>
          <ThemedText type="defaultSemiBold">Enable notifications</ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={onSignOut}
        style={[styles.primary, { backgroundColor: tint }]}
        accessibilityRole="button">
        <Text style={styles.primaryLabel}>Sign out</Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 28 },
  block: { gap: 8 },
  label: { fontSize: 13, opacity: 0.75 },
  hint: { opacity: 0.8, lineHeight: 22 },
  secondary: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primary: {
    marginTop: 'auto',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
