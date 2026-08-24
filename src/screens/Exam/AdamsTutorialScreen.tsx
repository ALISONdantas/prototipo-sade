import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, User, ArrowDown, Camera } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirmExitOnBack } from '../../hooks/useConfirmExitOnBack';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';

type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

const { width: windowWidth } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    title: 'Fique de pé, com os pés juntos',
    description: 'O paciente deve ficar de costas para quem vai tirar a foto, com as pernas retas e os braços relaxados ao lado do corpo.',
    Icon: User,
  },
  {
    title: 'Incline-se para frente',
    description: 'Dobre o corpo para frente a partir da cintura, mantendo as pernas retas e os braços soltos apontando para o chão.',
    Icon: ArrowDown,
  },
  {
    title: 'Posicione a câmera',
    description: 'Fique exatamente atrás do paciente e tire a foto alinhando a coluna no centro da tela para capturar a assimetria.',
    Icon: Camera,
  },
];

export default function AdamsTutorialScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Após o upload (status PENDING_AI) o exame já foi enviado; sair não perde mais progresso,
  // e o guard precisa desarmar aqui para não bloquear o reset() feito pela AILoadingScreen.
  const examStatus = useExamStore((state) => state.currentExam?.status);
  const { isConfirmVisible, confirmExit, cancelExit } = useConfirmExitOnBack(
    examStatus !== 'PENDING_AI'
  );

  useEffect(() => {
    // Fade in the primary button when on the last step
    Animated.timing(fadeAnim, {
      toValue: activeIndex === TUTORIAL_STEPS.length - 1 ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activeIndex, fadeAnim]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < TUTORIAL_STEPS.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    // Navigate to Camera Screen
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfirmDialog
        visible={isConfirmVisible}
        title="Sair do exame?"
        message="Você tem um exame em andamento. Deseja realmente sair e perder o progresso?"
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tutorial do Teste</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Passo 2 de 3: Tutorial</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '66.66%' }]} />
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {TUTORIAL_STEPS.map((step, index) => {
            const Icon = step.Icon;
            return (
              <View key={index} style={styles.slide}>
                <View style={styles.iconCircle}>
                  <Icon color={colors.primary} size={64} />
                </View>
                <Text style={styles.slideTitle}>{step.title}</Text>
                <Text style={styles.slideDescription}>{step.description}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.paginationContainer}>
        {TUTORIAL_STEPS.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setActiveIndex(index);
              scrollViewRef.current?.scrollTo({
                x: index * windowWidth,
                animated: true,
              });
            }}
          >
            <Animated.View
              style={[
                styles.dot,
                activeIndex === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Animated.View style={{ opacity: fadeAnim, marginBottom: spacing.md }}>
          <Button 
            title="Entendi, vamos lá" 
            onPress={handleNext} 
            disabled={activeIndex !== TUTORIAL_STEPS.length - 1}
          />
        </Animated.View>
        
        <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Pular tutorial</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...typography.h3 },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  carouselContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: windowWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  slideTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});
