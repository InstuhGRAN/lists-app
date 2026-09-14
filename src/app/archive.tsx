import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLists } from '@/hooks/use-lists';
import { useTheme } from '@/hooks/use-theme';
import { LIST_KINDS, type ListRow } from '@/types';

export default function ArchiveScreen() {
  const theme = useTheme();
  const { lists, restoreList, deleteList } = useLists('archived');

  const confirmDelete = (item: ListRow) => {
    Alert.alert(
      'Delete permanently?',
      `"${item.title}" and all its items will be deleted for good. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteList(item.id) },
      ],
    );
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    const meta = LIST_KINDS.find((k) => k.value === item.kind) ?? LIST_KINDS[2];
    const iconName = item.kind === 'custom' && item.icon ? item.icon : meta.icon;

    return (
      <Swipeable
        renderRightActions={() => (
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={() => restoreList(item.id)}
              style={[styles.action, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
              <ThemedText type="small" style={{ color: '#fff', marginTop: 2 }}>
                Restore
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} style={[styles.action, { backgroundColor: '#E5484D' }]}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <ThemedText type="small" style={{ color: '#fff', marginTop: 2 }}>
                Delete
              </ThemedText>
            </Pressable>
          </View>
        )}
        overshootRight={false}
      >
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.textSecondary }]}>
            <Ionicons name={iconName as never} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">{item.title}</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {meta.label}
            </ThemedText>
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            <ThemedText themeColor="textSecondary">
              No archived lists. Swipe a list left on the Lists screen to archive it.
            </ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: Spacing.four,
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
  action: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
    borderRadius: 16,
  },
  empty: {
    paddingTop: Spacing.six,
    alignItems: 'center',
  },
});
