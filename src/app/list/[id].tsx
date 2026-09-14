import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemePickerSheet } from '@/components/theme-picker-sheet';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useListItems } from '@/hooks/use-list-items';
import { useLists } from '@/hooks/use-lists';
import { useTheme } from '@/hooks/use-theme';
import { getListBackgroundImageUrl, uploadListBackgroundImage } from '@/lib/list-backgrounds';
import type { ListItemRow } from '@/types';

const DARK_TEXT = '#1f1f1f';
const DARK_TEXT_MUTED = '#5b5b5b';

function ChecklistRow({
  item,
  onToggle,
  onDelete,
  onCommitLabel,
  textColor,
  mutedColor,
  accentColor,
}: {
  item: ListItemRow;
  onToggle: () => void;
  onDelete: () => void;
  onCommitLabel: (label: string) => void;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.is_checked ? accentColor : mutedColor}
        />
      </Pressable>
      <TextInput
        key={`${item.id}:${item.label}`}
        defaultValue={item.label}
        onEndEditing={(e) => onCommitLabel(e.nativeEvent.text)}
        style={[
          styles.rowInput,
          { color: textColor },
          item.is_checked && { textDecorationLine: 'line-through', color: mutedColor },
        ]}
        multiline
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={20} color={mutedColor} />
      </Pressable>
    </View>
  );
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const { items, addItem, updateLabel, toggleItem, deleteItem } = useListItems(id);
  const { lists, updateListBackground } = useLists();
  const list = useMemo(() => lists.find((l) => l.id === id) ?? null, [lists, id]);

  const [draft, setDraft] = useState('');
  const draftInputRef = useRef<TextInput>(null);
  const [showChecked, setShowChecked] = useState(true);
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const hasImage = !!list?.background_image_path;
  const imageUrl = list?.background_image_path
    ? getListBackgroundImageUrl(list.background_image_path)
    : null;

  const textColor = hasImage ? '#ffffff' : list?.background_color ? DARK_TEXT : theme.text;
  const mutedColor = hasImage ? 'rgba(255,255,255,0.75)' : list?.background_color ? DARK_TEXT_MUTED : theme.textSecondary;
  const accentColor = hasImage ? '#ffffff' : list?.background_color ? DARK_TEXT : theme.accent;
  const rowPillStyle = hasImage ? { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, paddingHorizontal: Spacing.two } : null;

  const submitDraft = async () => {
    if (!draft.trim()) return;
    await addItem(draft);
    setDraft('');
    draftInputRef.current?.focus();
  };

  const handleSelectImage = async (uri: string) => {
    if (!session || !list) return;
    setThemePickerVisible(false);
    const path = await uploadListBackgroundImage(session.user.id, list.id, uri);
    await updateListBackground(list.id, { color: null, imagePath: path });
  };

  const unchecked = items.filter((item) => !item.is_checked);
  const checked = items.filter((item) => item.is_checked);

  const content = (
    <>
      <Stack.Screen
        options={{
          title: list?.title ?? '',
          headerRight: () => (
            <Pressable onPress={() => setThemePickerVisible(true)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="color-palette-outline" size={22} color={theme.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        {unchecked.map((item) => (
          <View key={item.id} style={rowPillStyle}>
            <ChecklistRow
              item={item}
              onToggle={() => toggleItem(item.id, true)}
              onDelete={() => deleteItem(item.id)}
              onCommitLabel={(label) => updateLabel(item.id, label)}
              textColor={textColor}
              mutedColor={mutedColor}
              accentColor={accentColor}
            />
          </View>
        ))}

        <View style={[styles.row, rowPillStyle]}>
          <Ionicons name="ellipse-outline" size={24} color={mutedColor} style={{ opacity: 0.6 }} />
          <TextInput
            ref={draftInputRef}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            blurOnSubmit={false}
            placeholder="List item"
            placeholderTextColor={mutedColor}
            returnKeyType="next"
            style={[styles.rowInput, { color: textColor }]}
          />
        </View>

        {checked.length > 0 && (
          <>
            <Pressable onPress={() => setShowChecked((v) => !v)} style={styles.checkedHeader}>
              <Ionicons
                name={showChecked ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={mutedColor}
              />
              <ThemedText style={{ color: mutedColor }} type="small">
                {checked.length} checked item{checked.length === 1 ? '' : 's'}
              </ThemedText>
            </Pressable>

            {showChecked &&
              checked.map((item) => (
                <View key={item.id} style={rowPillStyle}>
                  <ChecklistRow
                    item={item}
                    onToggle={() => toggleItem(item.id, false)}
                    onDelete={() => deleteItem(item.id)}
                    onCommitLabel={(label) => updateLabel(item.id, label)}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    accentColor={accentColor}
                  />
                </View>
              ))}
          </>
        )}
      </ScrollView>

      <ThemePickerSheet
        visible={themePickerVisible}
        onClose={() => setThemePickerVisible(false)}
        currentColor={list?.background_color ?? null}
        hasImage={hasImage}
        onSelectColor={(color) => {
          setThemePickerVisible(false);
          if (list) updateListBackground(list.id, { color, imagePath: null });
        }}
        onSelectImageUri={handleSelectImage}
        onClear={() => {
          setThemePickerVisible(false);
          if (list) updateListBackground(list.id, { color: null, imagePath: null });
        }}
      />
    </>
  );

  if (imageUrl) {
    return (
      <ImageBackground source={{ uri: imageUrl }} style={styles.container} resizeMode="cover">
        <View style={styles.scrim} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {content}
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: list?.background_color ?? theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
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
});
