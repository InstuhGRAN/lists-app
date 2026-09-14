import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ThemedText type="title" style={{ fontSize: 34, lineHeight: 40, paddingHorizontal: Spacing.four }}>
        Settings
      </ThemedText>

      <View style={styles.section}>
        <ThemedText themeColor="textSecondary" type="small">
          Signed in as
        </ThemedText>
        <ThemedText type="default">{session?.user.email}</ThemedText>
      </View>

      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={[styles.signOutButton, { backgroundColor: theme.danger }]}
      >
        <ThemedText style={{ color: '#fff' }} type="smallBold">
          Sign out
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.two },
  section: {
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: 4,
  },
  signOutButton: {
    marginTop: Spacing.five,
    marginHorizontal: Spacing.four,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
