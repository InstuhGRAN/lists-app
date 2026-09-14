import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { VoiceInputButton } from '@/components/voice-input-button';
import { Spacing } from '@/constants/theme';
import { useListItems } from '@/hooks/use-list-items';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import type { ListItemRow, ListRow } from '@/types';

function ChecklistRow({
  item,
  onToggle,
  onDelete,
  onCommitLabel,
}: {
  item: ListItemRow;
  onToggle: () => void;
  onDelete: () => void;
  onCommitLabel: (label: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.is_checked ? theme.accent : theme.textSecondary}
        />
      </Pressable>
      <TextInput
        key={`${item.id}:${item.label}`}
        defaultValue={item.label}
        onEndEditing={(e) => onCommitLabel(e.nativeEvent.text)}
        style={[
          styles.rowInput,
          { color: theme.text },
          item.is_checked && { textDecorationLine: 'line-through', color: theme.textSecondary },
        ]}
        multiline
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { items, addItem, updateLabel, toggleItem, deleteItem } = useListItems(id);
  const [list, setList] = useState<ListRow | null>(null);
  const [draft, setDraft] = useState('');
  const draftInputRef = useRef<TextInput>(null);
  const [showChecked, setShowChecked] = useState(true);

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
    draftInputRef.current?.focus();
  };

  const unchecked = items.filter((item) => !item.is_checked);
  const checked = items.filter((item) => item.is_checked);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: list?.title ?? '' }} />

      <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        {unchecked.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggle={() => toggleItem(item.id, true)}
            onDelete={() => deleteItem(item.id)}
            onCommitLabel={(label) => updateLabel(item.id, label)}
          />
        ))}

        <View style={styles.row}>
          <Ionicons name="ellipse-outline" size={24} color={theme.textSecondary} style={{ opacity: 0.4 }} />
          <TextInput
            ref={draftInputRef}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            blurOnSubmit={false}
            placeholder="List item"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="next"
            style={[styles.rowInput, { color: theme.text }]}
          />
        </View>

        {checked.length > 0 && (
          <>
            <Pressable onPress={() => setShowChecked((v) => !v)} style={styles.checkedHeader}>
              <Ionicons
                name={showChecked ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={theme.textSecondary}
              />
              <ThemedText themeColor="textSecondary" type="small">
                {checked.length} checked item{checked.length === 1 ? '' : 's'}
              </ThemedText>
            </Pressable>

            {showChecked &&
              checked.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id, false)}
                  onDelete={() => deleteItem(item.id)}
                  onCommitLabel={(label) => updateLabel(item.id, label)}
                />
              ))}
          </>
        )}
      </ScrollView>

      <View style={styles.fabRow}>
        <VoiceInputButton onResult={(transcript) => addItem(transcript)} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  checkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  fabRow: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
  },
});
