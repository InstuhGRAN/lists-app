import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LIST_BACKGROUND_COLORS } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentColor: string | null;
  hasImage: boolean;
  onSelectColor: (color: string) => void;
  onSelectImageUri: (uri: string) => void;
  onClear: () => void;
};

export function ThemePickerSheet({
  visible,
  onClose,
  currentColor,
  hasImage,
  onSelectColor,
  onSelectImageUri,
  onClear,
}: Props) {
  const theme = useTheme();

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos access needed', 'Enable photo library access in Settings to set a list background.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onSelectImageUri(result.assets[0].uri);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView style={styles.sheet}>
            <ThemedText type="smallBold" style={{ marginBottom: Spacing.three }}>
              List theme
            </ThemedText>

            <View style={styles.swatchRow}>
              <Pressable
                onPress={onClear}
                style={[
                  styles.swatch,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
                ]}
              >
                <Ionicons name="close" size={16} color={theme.text} />
              </Pressable>
              {LIST_BACKGROUND_COLORS.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => onSelectColor(c.value)}
                  style={[styles.swatch, { backgroundColor: c.value }]}
                >
                  {!hasImage && currentColor === c.value && (
                    <Ionicons name="checkmark" size={16} color="#1f1f1f" />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable onPress={pickPhoto} style={[styles.photoButton, { borderColor: theme.border }]}>
              <Ionicons name="image-outline" size={18} color={theme.text} />
              <ThemedText style={{ marginLeft: Spacing.two }}>Choose a photo</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
});
