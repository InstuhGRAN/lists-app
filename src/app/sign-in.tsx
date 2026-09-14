import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter an email and password.');
      return;
    }
    setSubmitting(true);
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    setSubmitting(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }
    if (mode === 'sign-up') {
      Alert.alert('Check your email', 'Confirm your address to finish creating your account.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Lists
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {mode === 'sign-in' ? 'Sign in to sync your lists' : 'Create an account to get started'}
        </ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={[
            styles.input,
            { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
          ]}
        />
        <View
          style={[
            styles.passwordRow,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.passwordInput, { color: theme.text }]}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={submit}
          disabled={submitting}
          style={[styles.primaryButton, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText style={{ color: '#fff' }} type="smallBold">
            {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} style={styles.switchMode}>
          <ThemedText themeColor="accent" type="link">
            {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  switchMode: {
    marginTop: Spacing.four,
    alignItems: 'center',
  },
});
