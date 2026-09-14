import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VoiceInputButton } from '@/components/voice-input-button';
import { Spacing } from '@/constants/theme';
import { useListItems } from '@/hooks/use-list-items';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import type { ListItemRow, ListRow } from '@/types';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { items, addItem, toggleItem, deleteItem } = useListItems(id);
  const [list, setList] = useState<ListRow | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setList(data as ListRow | null));
  }, [id]);

  const submitDraft = async () => {
    if (!draft.trim()) return;
    await addItem(draft);
    setDraft('');
  };

  const renderItem = ({ item }: { item: ListItemRow }) => (
    <Pressable
      onPress={() => toggleItem(item.id, !item.is_checked)}
      onLongPress={() => deleteItem(item.id)}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
    >
      <Ionicons
        name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={item.is_checked ? theme.accent : theme.textSecondary}
      />
      <ThemedText
        style={[
          styles.rowLabel,
          item.is_checked && { textDecorationLine: 'line-through', opacity: 0.5 },
        ]}
      >
        {item.label}
      </ThemedText>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: list?.title ?? '' }} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            <ThemedText themeColor="textSecondary">
              No items yet. Type below or tap the mic to add one by voice.
            </ThemedText>
          </ThemedView>
        }
      />

      <View style={[styles.composer, { borderTopColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submitDraft}
          placeholder="Add an item…"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[
            styles.input,
            { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
          ]}
        />
        <VoiceInputButton onResult={(transcript) => addItem(transcript)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  rowLabel: {
    flex: 1,
  },
  empty: {
    paddingTop: Spacing.six,
    alignItems: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
});
