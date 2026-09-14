import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLists } from '@/hooks/use-lists';
import { useTheme } from '@/hooks/use-theme';
import { getListBackgroundImageUrl } from '@/lib/list-backgrounds';
import { CUSTOM_LIST_ICONS, DEFAULT_CUSTOM_ICON, LIST_KINDS, type ListKind, type ListRow } from '@/types';

const DARK_TEXT = '#1f1f1f';
const DARK_TEXT_MUTED = '#5b5b5b';

export default function ListsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lists, createList, deleteList } = useLists();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ListKind>('travel');
  const [customIcon, setCustomIcon] = useState(DEFAULT_CUSTOM_ICON);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createList(title.trim(), kind, kind === 'custom' ? customIcon : null);
    setTitle('');
    setKind('travel');
    setCustomIcon(DEFAULT_CUSTOM_ICON);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    const meta = LIST_KINDS.find((k) => k.value === item.kind) ?? LIST_KINDS[2];
    const iconName = item.kind === 'custom' && item.icon ? item.icon : meta.icon;
    const hasImage = !!item.background_image_path;
    const textColor = hasImage ? '#fff' : item.background_color ? DARK_TEXT : theme.text;
    const mutedColor = hasImage
      ? 'rgba(255,255,255,0.8)'
      : item.background_color
        ? DARK_TEXT_MUTED
        : theme.textSecondary;
    const iconBg = hasImage || item.background_color ? 'rgba(0,0,0,0.25)' : theme.accent;

    const cardInner = (
      <View style={[styles.card, !hasImage && { backgroundColor: item.background_color ?? theme.backgroundElement }]}>
        {hasImage && <View style={styles.cardScrim} />}
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName as never} size={20} color={hasImage ? '#fff' : item.background_color ? DARK_TEXT : '#fff'} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ color: textColor }}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: mutedColor }}>
            {meta.label}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={mutedColor} />
      </View>
    );

    return (
      <Pressable onPress={() => router.push(`/list/${item.id}`)} onLongPress={() => deleteList(item.id)}>
        {hasImage ? (
          <ImageBackground
            source={{ uri: getListBackgroundImageUrl(item.background_image_path!) }}
            style={styles.cardImageBackground}
            imageStyle={styles.cardImage}
          >
            {cardInner}
          </ImageBackground>
        ) : (
          cardInner
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: 34, lineHeight: 40 }}>
          Lists
        </ThemedText>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            <ThemedText themeColor="textSecondary">
              No lists yet. Tap + to create a travel checklist or grocery list.
            </ThemedText>
          </ThemedView>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedView style={styles.modalCard} type="background">
            <ThemedText type="subtitle" style={{ fontSize: 20, marginBottom: Spacing.three }}>
              New list
            </ThemedText>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Japan Trip, Weekly Groceries"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
              autoFocus
            />

            <View style={styles.kindRow}>
              {LIST_KINDS.map((k) => (
                <Pressable
                  key={k.value}
                  onPress={() => setKind(k.value)}
                  style={[
                    styles.kindChip,
                    {
                      backgroundColor: kind === k.value ? theme.accent : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={k.icon as never}
                    size={16}
                    color={kind === k.value ? '#fff' : theme.text}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: kind === k.value ? '#fff' : theme.text, marginLeft: 6 }}
                  >
                    {k.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {kind === 'custom' && (
              <View style={styles.iconRow}>
                {CUSTOM_LIST_ICONS.map((iconName) => (
                  <Pressable
                    key={iconName}
                    onPress={() => setCustomIcon(iconName)}
                    style={[
                      styles.iconChoice,
                      {
                        backgroundColor:
                          customIcon === iconName ? theme.accent : theme.backgroundElement,
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName as never}
                      size={18}
                      color={customIcon === iconName ? '#fff' : theme.text}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalButton}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                style={[styles.modalButton, styles.createButton, { backgroundColor: theme.accent }]}
              >
                <ThemedText style={{ color: '#fff' }} type="smallBold">
                  Create
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.three,
  },
  cardImageBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 16,
  },
  cardScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  kindRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    flexWrap: 'wrap',
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  modalButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  createButton: {
    alignItems: 'center',
  },
});
