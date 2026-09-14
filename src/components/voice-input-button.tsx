import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  onResult: (transcript: string) => void;
};

export function VoiceInputButton({ onResult }: Props) {
  const theme = useTheme();
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (event.isFinal && transcript) {
      onResult(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      Alert.alert('Speech recognition error', event.message ?? event.error);
    }
  });

  const startListening = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Microphone access needed',
        'Enable microphone and speech recognition permissions in Settings to add items by voice.',
      );
      return;
    }

    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  return (
    <Pressable
      onPress={listening ? stopListening : startListening}
      style={[
        styles.button,
        { backgroundColor: listening ? theme.danger : theme.accent },
      ]}
    >
      {listening ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Ionicons name="mic" size={22} color="#fff" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
