import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, typography, radius } from '../../theme';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';
import { isAiMockEnabled, mockAnalyzeExam, AiMockResult } from '../../mocks/aiMock';

type AILoadingScreenRouteProp = RouteProp<ExamStackParamList, 'AILoading'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

// Vocabulário de status já usado por ResultScreen/ExamHistoryCard; NETWORK_ERROR do
// mock (issue #43) cai no mesmo bucket de falha que timeout e erro real de servidor.
const AI_MOCK_RESULT_TO_STATUS: Record<AiMockResult, string> = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
  INCONCLUSIVE: 'INCONCLUSIVE',
  INVALID_IMAGE: 'INVALID_IMAGE',
  NETWORK_ERROR: 'FAILED',
};

const TIMEOUT_MS = 30000;
const MESSAGE_INTERVAL_MS = 2500;
const PHOTO_HEIGHT = 340;

const LOADING_MESSAGES = [
  'Analisando simetria da coluna...',
  'Verificando alinhamento das escápulas...',
  'Calculando indicadores posturais...',
  'Gerando resultado...',
];

export default function AILoadingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AILoadingScreenRouteProp>();
  const { examId, imageUri } = route.params;

  const [messageIndex, setMessageIndex] = useState(0);
  const messageFade = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  const useNativeDriver = Platform.OS !== 'web';

  // Timeout de 30s: se a IA não responder a tempo, encerra em estado de erro (Result → FAILED).
  useEffect(() => {
    let cancelled = false;

    const processExam = async (): Promise<string> => {
      if (!isAiMockEnabled()) {
        // Sem microsserviço de IA real disponível ainda (issue #43 cobre só o
        // mock). Não resolve — o timeoutPromise abaixo encerra o fluxo como
        // falha depois de TIMEOUT_MS, mesmo comportamento de uma IA real fora
        // do ar.
        return new Promise(() => {});
      }

      const result = await mockAnalyzeExam();
      return AI_MOCK_RESULT_TO_STATUS[result];
    };

    const timeoutPromise = new Promise<'TIMEOUT'>((resolve) => {
      setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS);
    });

    Promise.race([processExam(), timeoutPromise]).then((result) => {
      if (cancelled) return;
      const status = result === 'TIMEOUT' ? 'FAILED' : result;

      useExamStore.setState((state) => ({
        currentExam: state.currentExam ? { ...state.currentExam, status } : state.currentExam,
      }));

      navigation.reset({
        index: 0,
        routes: [{ name: 'Result', params: { examId } }],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [navigation, examId]);

  // Linha de scan em loop de cima para baixo sobre a foto.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim, useNativeDriver]);

  // Texto rotativo com fade a cada 2.5s.
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(messageFade, { toValue: 0, duration: 250, useNativeDriver }).start(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(messageFade, { toValue: 1, duration: 250, useNativeDriver }).start();
      });
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [messageFade, useNativeDriver]);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PHOTO_HEIGHT],
  });

  return (
    <View style={styles.container}>
      {imageUri && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.photo}
            resizeMode="cover"
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel="Foto das costas do paciente para análise"
          />
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]}
          />
        </View>
      )}

      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />

      <Animated.Text style={[styles.message, { opacity: messageFade }]}>
        {LOADING_MESSAGES[messageIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  photoContainer: {
    width: '100%',
    height: PHOTO_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.xl,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
