import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useExamStore } from '../../store/examStore';
import { useConfirmExitOnBack } from '../../hooks/useConfirmExitOnBack';
import { useToast } from '../../hooks/useToast';
import { ExamStackParamList } from '../../navigation/ExamStack';

type HealthHistoryRouteProp = RouteProp<ExamStackParamList, 'HealthHistory'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

export default function HealthHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HealthHistoryRouteProp>();
  const { dependentId, patientId, dependentName, age, sex } = route.params;

  // Form State — idade e sexo já vêm resolvidos da tela anterior
  // (SelectTesteeScreen/PatientPickerScreen), não são mais digitados aqui.
  const [familyHistory, setFamilyHistory] = useState(false);
  const [hasPain, setHasPain] = useState<boolean | null>(null);
  const [hadSurgery, setHadSurgery] = useState(false);

  const { createExam, isSubmitting: loading } = useExamStore();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const { toast, showToast } = useToast();

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const { isConfirmVisible, confirmExit, cancelExit } = useConfirmExitOnBack(hasUnsavedChanges);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();
  };

  const handleNext = async () => {
    if (hasPain === null) {
      triggerShake();
      showToast('Responda se a pessoa sente dor.', 'error');
      return;
    }

    try {
      const payload = {
        age,
        sex,
        family_history: familyHistory,
        has_pain: hasPain,
        had_surgery: hadSurgery,
        dependent_id: dependentId,
        patient_id: patientId,
      };

      await createExam(payload);

      setHasUnsavedChanges(false);
      navigation.navigate('AdamsTutorial');
    } catch (error) {
      showToast('Não foi possível salvar o rascunho do exame. Tente novamente.', 'error');
    }
  };

  const renderToggle = (label: string, value: boolean, onToggle: () => void) => (
    <TouchableOpacity
      style={[styles.togglePill, value && styles.togglePillActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && <Toast message={toast.message} variant={toast.variant} />}
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
        <Text style={styles.headerTitle}>Novo Exame</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Passo 2 de 3: Histórico de saúde</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '66.66%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {dependentName ? `Sobre ${dependentName}` : 'Sobre você'}
              </Text>
              <Text style={styles.subtitleText}>
                Idade e sexo já foram obtidos do cadastro — só precisamos confirmar o histórico
                de saúde abaixo.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Sente dor na coluna?</Text>
                <View style={styles.togglesRow}>
                  {renderToggle('Sim', hasPain === true, () => setHasPain(true))}
                  {renderToggle('Não', hasPain === false, () => setHasPain(false))}
                </View>
              </View>

              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Histórico familiar de escoliose?</Text>
                <View style={styles.togglesRow}>
                  {renderToggle('Sim', familyHistory === true, () => setFamilyHistory(true))}
                  {renderToggle('Não', familyHistory === false, () => setFamilyHistory(false))}
                </View>
              </View>

              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Já fez cirurgia na coluna?</Text>
                <View style={styles.togglesRow}>
                  {renderToggle('Sim', hadSurgery === true, () => setHadSurgery(true))}
                  {renderToggle('Não', hadSurgery === false, () => setHadSurgery(false))}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : 'Próximo'}
          onPress={handleNext}
          disabled={loading}
        />
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
  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitleText: { ...typography.small, color: colors.textSecondary },
  questionContainer: { marginBottom: spacing.lg },
  questionText: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  togglesRow: { flexDirection: 'row', gap: spacing.md },
  togglePill: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  togglePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleText: { ...typography.body, color: colors.textSecondary },
  toggleTextActive: { color: colors.primary, fontWeight: 'bold' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
