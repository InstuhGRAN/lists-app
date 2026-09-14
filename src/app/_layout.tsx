import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="list/[id]"
          options={{ headerShown: true, presentation: 'card', title: '' }}
        />
        <Stack.Screen
          name="archive"
          options={{ headerShown: true, presentation: 'card', title: 'Archive' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
