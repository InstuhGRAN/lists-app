import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemePickerSheet } from '@/components/theme-picker-sheet';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useListItems } from '@/hooks/use-list-items';
import { useLists } from '@/hooks/use-lists';
import { useTheme } from '@/hooks/use-theme';
import { getListBackgroundImageUrl, uploadListBackgroundImage } from '@/lib/list-backgrounds';
import { CUSTOM_LIST_ICONS, DEFAULT_CUSTOM_ICON, type ListItemRow } from '@/types';

const DARK_TEXT = '#1f1f1f';
const DARK_TEXT_MUTED = '#5b5b5b';

type RowLayout = { y: number; height: number };

// Given a row's rank among its siblings (after removing itself), find the Y
// position it should sit at. originalIds is the group's natural (pre-drag)
// order, so slot `rank` in that order is exactly where an item now ranked
// `rank` should visually land -- using whichever item originally sat there's
// measured Y, regardless of which item that was.
function targetYForRank(
  itemId: string,
  originalIds: string[],
  layout: Record<string, RowLayout>,
  rank: number,
) {
  'worklet';
  const targetId = originalIds[rank];
  const targetLayout = targetId ? layout[targetId] : undefined;
  if (targetLayout) return targetLayout.y;
  return layout[itemId]?.y ?? 0;
}

function ChecklistRow({
  item,
  index,
  originalIds,
  positions,
  layout,
  isNested,
  canNest,
  pillStyle,
  onToggle,
  onDelete,
  onCommitLabel,
  onNestAction,
  onReorderCommit,
  textColor,
  mutedColor,
  accentColor,
}: {
  item: ListItemRow;
  index: number;
  originalIds: string[];
  positions: SharedValue<Record<string, number>>;
  layout: SharedValue<Record<string, RowLayout>>;
  isNested: boolean;
  canNest: boolean;
  pillStyle: object | null;
  onToggle: () => void;
  onDelete: () => void;
  onCommitLabel: (label: string) => void;
  onNestAction: () => void;
  onReorderCommit: (orderedIds: string[]) => void;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const itemId = item.id;

  const commitOrder = (orderMap: Record<string, number>) => {
    const ordered = Object.entries(orderMap)
      .sort((a, b) => a[1] - b[1])
      .map(([entryId]) => entryId);
    onReorderCommit(ordered);
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
      const myLayout = layout.value[itemId];
      if (!myLayout) return;

      const currentCenter = myLayout.y + myLayout.height / 2 + event.translationY;
      let targetIndex = 0;
      for (const otherId of originalIds) {
        if (otherId === itemId) continue;
        const otherLayout = layout.value[otherId];
        if (!otherLayout) continue;
        if (otherLayout.y + otherLayout.height / 2 < currentCenter) targetIndex++;
      }

      const newOrder = originalIds.filter((x) => x !== itemId);
      newOrder.splice(targetIndex, 0, itemId);
      const next: Record<string, number> = {};
      newOrder.forEach((orderedId, i) => {
        next[orderedId] = i;
      });
      positions.value = next;
    })
    .onEnd(() => {
      const order = positions.value;
      const rank = order[itemId] ?? index;
      const myLayout = layout.value[itemId];
      const myOriginalY = myLayout?.y ?? 0;
      const targetY = targetYForRank(itemId, originalIds, layout.value, rank);
      translateY.value = withSpring(targetY - myOriginalY, { damping: 20 }, (finished) => {
        if (finished) isActive.value = false;
      });
      runOnJS(commitOrder)(order);
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onToggle)();
  });

  const checkboxGesture = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => {
    if (isActive.value) {
      return {
        transform: [{ translateY: translateY.value }, { scale: withTiming(1.03) }],
        zIndex: 10,
        backgroundColor: 'rgba(120,120,128,0.12)',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
        borderRadius: 12,
      };
    }

    const rank = positions.value[itemId] ?? index;
    const myOriginalY = layout.value[itemId]?.y ?? 0;
    const targetY = targetYForRank(itemId, originalIds, layout.value, rank);

    return {
      transform: [{ translateY: withTiming(targetY - myOriginalY, { duration: 150 }) }, { scale: withTiming(1) }],
      zIndex: 0,
      shadowOpacity: withTiming(0),
      elevation: 0,
      borderRadius: 12,
    };
  });

  return (
    <Animated.View
      style={[pillStyle, styles.row, isNested && styles.nestedRow, animatedStyle]}
      onLayout={(e) => {
        layout.value = {
          ...layout.value,
          [itemId]: { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height },
        };
      }}
    >
      <GestureDetector gesture={checkboxGesture}>
        <Animated.View hitSlop={12}>
          <Ionicons
            name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.is_checked ? accentColor : mutedColor}
          />
        </Animated.View>
      </GestureDetector>
      <TextInput
        key={`${item.id}:${item.label}`}
        defaultValue={item.label}
        onEndEditing={(e) => onCommitLabel(e.nativeEvent.text)}
        style={[styles.rowInput, { color: textColor }]}
      />
      {canNest && (
        <Pressable onPress={onNestAction} hitSlop={8}>
          <Ionicons
            name={isNested ? 'return-up-back-outline' : 'arrow-forward-outline'}
            size={16}
            color={mutedColor}
          />
        </Pressable>
      )}
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={20} color={mutedColor} />
      </Pressable>
    </Animated.View>
  );
}

function StaticChecklistRow({
  item,
  pillStyle,
  onToggle,
  onDelete,
  onCommitLabel,
  textColor,
  mutedColor,
  accentColor,
}: {
  item: ListItemRow;
  pillStyle: object | null;
  onToggle: () => void;
  onDelete: () => void;
  onCommitLabel: (label: string) => void;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) {
  return (
    <View style={[pillStyle, styles.row]}>
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
        style={[styles.rowInput, { color: textColor, textDecorationLine: 'line-through' }]}
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={20} color={mutedColor} />
      </Pressable>
    </View>
  );
}

function ChecklistGroup({
  items,
  isNested,
  pillStyle,
  computeCanNest,
  onToggle,
  onDelete,
  onCommitLabel,
  onNestAction,
  onReorder,
  textColor,
  mutedColor,
  accentColor,
  renderAfterItem,
}: {
  items: ListItemRow[];
  isNested: boolean;
  pillStyle: object | null;
  computeCanNest: (item: ListItemRow, index: number) => boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCommitLabel: (id: string, label: string) => void;
  onNestAction: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  renderAfterItem?: (item: ListItemRow) => ReactNode;
}) {
  const ids = items.map((i) => i.id);
  const idsKey = ids.join(',');
  const positions = useSharedValue<Record<string, number>>({});
  const layout = useSharedValue<Record<string, RowLayout>>({});
  const prevKeyRef = useRef('');
  if (prevKeyRef.current !== idsKey) {
    const next: Record<string, number> = {};
    ids.forEach((itemId, i) => {
      next[itemId] = i;
    });
    positions.value = next;
    prevKeyRef.current = idsKey;
  }

  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <ChecklistRow
            item={item}
            index={index}
            originalIds={ids}
            positions={positions}
            layout={layout}
            isNested={isNested}
            canNest={computeCanNest(item, index)}
            pillStyle={pillStyle}
            onToggle={() => onToggle(item.id)}
            onDelete={() => onDelete(item.id)}
            onCommitLabel={(label) => onCommitLabel(item.id, label)}
            onNestAction={() => onNestAction(item.id)}
            onReorderCommit={onReorder}
            textColor={textColor}
            mutedColor={mutedColor}
            accentColor={accentColor}
          />
          {renderAfterItem?.(item)}
        </Fragment>
      ))}
    </>
  );
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const { items, addItem, updateLabel, toggleItem, deleteItem, indentItem, outdentItem, reorderSiblings } =
    useListItems(id);
  const { lists, updateListTitle, updateListIcon, updateListBackground } = useLists();
  const list = useMemo(() => lists.find((l) => l.id === id) ?? null, [lists, id]);

  const [draft, setDraft] = useState('');
  const draftInputRef = useRef<TextInput>(null);
  const [showChecked, setShowChecked] = useState(true);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameIcon, setRenameIcon] = useState(DEFAULT_CUSTOM_ICON);

  const hasImage = !!list?.background_image_path;
  const imageUrl = list?.background_image_path
    ? getListBackgroundImageUrl(list.background_image_path)
    : null;

  const textColor = hasImage ? '#ffffff' : list?.background_color ? DARK_TEXT : theme.text;
  const mutedColor = hasImage ? 'rgba(255,255,255,0.75)' : list?.background_color ? DARK_TEXT_MUTED : theme.textSecondary;
  const accentColor = hasImage ? '#ffffff' : list?.background_color ? DARK_TEXT : theme.accent;
  const rowPillStyle = hasImage
    ? { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, paddingHorizontal: Spacing.two }
    : null;

  const submitDraft = async () => {
    if (!draft.trim()) return;
    await addItem(draft);
    setDraft('');
    draftInputRef.current?.focus();
  };

  const openRenameModal = () => {
    if (!list) return;
    setRenameDraft(list.title);
    setRenameIcon(list.icon ?? DEFAULT_CUSTOM_ICON);
    setRenameModalVisible(true);
  };

  const submitRename = async () => {
    if (!list || !renameDraft.trim()) return;
    await updateListTitle(list.id, renameDraft.trim());
    if (list.kind === 'custom' && renameIcon !== list.icon) {
      await updateListIcon(list.id, renameIcon);
    }
    setRenameModalVisible(false);
  };

  const handleSelectImage = async (uri: string) => {
    if (!session || !list) return;
    setThemePickerVisible(false);
    const path = await uploadListBackgroundImage(session.user.id, list.id, uri);
    await updateListBackground(list.id, { color: null, imagePath: path });
  };

  const topLevelUnchecked = items
    .filter((item) => !item.parent_item_id && !item.is_checked)
    .sort((a, b) => a.position - b.position);
  const childrenOf = (parentId: string) =>
    items
      .filter((item) => item.parent_item_id === parentId && !item.is_checked)
      .sort((a, b) => a.position - b.position);
  const checked = items.filter((item) => item.is_checked);

  const content = (
    <>
      <Stack.Screen
        options={{
          // title is still needed alongside headerTitle: react-native-screens
          // sizes the native header's title container from this string, and
          // without it a custom headerTitle can get measured at zero width
          // until a navigation transition forces a relayout.
          title: list?.title ?? '',
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Pressable
              onPress={openRenameModal}
              hitSlop={{ top: 16, bottom: 16, left: 24, right: 24 }}
              style={styles.headerTitleButton}
            >
              <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.text }}>
                {list?.title ?? ''}
              </ThemedText>
              <Ionicons name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 4 }} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => setThemePickerVisible(true)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="color-palette-outline" size={22} color={theme.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        <ChecklistGroup
          items={topLevelUnchecked}
          isNested={false}
          pillStyle={rowPillStyle}
          computeCanNest={(item, index) => index > 0 && childrenOf(item.id).length === 0}
          onToggle={(itemId) => toggleItem(itemId, true)}
          onDelete={(itemId) => deleteItem(itemId)}
          onCommitLabel={(itemId, label) => updateLabel(itemId, label)}
          onNestAction={(itemId) => indentItem(itemId)}
          onReorder={(orderedIds) => reorderSiblings(orderedIds)}
          textColor={textColor}
          mutedColor={mutedColor}
          accentColor={accentColor}
          renderAfterItem={(item) => {
            const children = childrenOf(item.id);
            if (children.length === 0) return null;
            return (
              <ChecklistGroup
                items={children}
                isNested
                pillStyle={rowPillStyle}
                computeCanNest={() => true}
                onToggle={(itemId) => toggleItem(itemId, true)}
                onDelete={(itemId) => deleteItem(itemId)}
                onCommitLabel={(itemId, label) => updateLabel(itemId, label)}
                onNestAction={(itemId) => outdentItem(itemId)}
                onReorder={(orderedIds) => reorderSiblings(orderedIds)}
                textColor={textColor}
                mutedColor={mutedColor}
                accentColor={accentColor}
              />
            );
          }}
        />

        <View style={[rowPillStyle, styles.row]}>
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
                <StaticChecklistRow
                  key={item.id}
                  item={item}
                  pillStyle={rowPillStyle}
                  onToggle={() => toggleItem(item.id, false)}
                  onDelete={() => deleteItem(item.id)}
                  onCommitLabel={(label) => updateLabel(item.id, label)}
                  textColor={mutedColor}
                  mutedColor={mutedColor}
                  accentColor={accentColor}
                />
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

      <Modal
        visible={renameModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.renameOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedView style={styles.renameCard}>
            <ThemedText type="smallBold" style={{ marginBottom: Spacing.three }}>
              Edit list
            </ThemedText>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
              onSubmitEditing={submitRename}
              autoFocus
              style={[
                styles.renameInput,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
            />

            {list?.kind === 'custom' && (
              <View style={styles.iconRow}>
                {CUSTOM_LIST_ICONS.map((iconName) => (
                  <Pressable
                    key={iconName}
                    onPress={() => setRenameIcon(iconName)}
                    style={[
                      styles.iconChoice,
                      {
                        backgroundColor:
                          renameIcon === iconName ? theme.accent : theme.backgroundElement,
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName as never}
                      size={18}
                      color={renameIcon === iconName ? '#fff' : theme.text}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.renameActions}>
              <Pressable onPress={() => setRenameModalVisible(false)} style={styles.renameButton}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={submitRename}
                style={[styles.renameButton, { backgroundColor: theme.accent, borderRadius: 10 }]}
              >
                <ThemedText style={{ color: '#fff' }} type="smallBold">
                  Save
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
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
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  nestedRow: {
    marginLeft: Spacing.five,
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
  renameOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: Spacing.five,
  },
  renameCard: {
    width: '100%',
    borderRadius: 16,
    padding: Spacing.four,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.four,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  renameButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
