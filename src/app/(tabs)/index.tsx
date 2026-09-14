import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
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
import { LIST_KINDS, type ListKind, type ListRow } from '@/types';

export default function ListsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lists, createList, deleteList } = useLists();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ListKind>('travel');

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createList(title.trim(), kind);
    setTitle('');
    setKind('travel');
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    const meta = LIST_KINDS.find((k) => k.value === item.kind) ?? LIST_KINDS[2];
    return (
      <Pressable
        onPress={() => router.push(`/list/${item.id}`)}
        onLongPress={() => deleteList(item.id)}
        style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.accent }]}>
          <Ionicons name={meta.icon as never} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{item.title}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {meta.label}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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
        <View style={styles.modalOverlay}>
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
        </View>
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
