import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
  const { signUp, session, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const border = colorScheme === 'dark' ? '#333' : '#e0e0e0';
  const textColor = Colors[colorScheme].text;
  const tint = Colors[colorScheme].tint;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (authLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const onSubmit = async () => {
    if (password.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        Alert.alert('Could not register', error.message);
      } else {
        Alert.alert(
          'Check your inbox',
          'If email confirmation is enabled in Supabase, confirm your address then sign in.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          New account
        </ThemedText>

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#888"
          style={[styles.input, { borderColor: border, color: textColor }]}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Password
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor="#888"
          secureTextEntry
          style={[styles.input, { borderColor: border, color: textColor }]}
        />

        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={[styles.primary, { backgroundColor: tint, opacity: busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Register</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkWrap}>
            <ThemedText type="link">Already have an account?</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 6 },
  heading: { marginBottom: 20 },
  label: { marginTop: 12, marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primary: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  linkWrap: { marginTop: 20, alignItems: 'center', padding: 8 },
});
