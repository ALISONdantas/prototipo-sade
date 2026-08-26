import React, { useEffect, useRef, useState } from 'react';
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
import { Input } from '../../components/Input';
import { Toast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useExamStore } from '../../store/examStore';
import { getLastExamForDependent } from '../../services/examService';
import { useConfirmExitOnBack } from '../../hooks/useConfirmExitOnBack';
import { useToast } from '../../hooks/useToast';
import { ExamStackParamList } from '../../navigation/ExamStack';

type HealthHistoryRouteProp = RouteProp<ExamStackParamList, 'HealthHistory'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

const SEX_LABEL: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };

// RF04 — Formulário de Anamnese: idade, sexo, histórico familiar, doenças
// pré-existentes, peso, altura, dor e cirurgias anteriores. Preenchido em TODO
// exame, pois essas informações mudam com o tempo — em especial peso e
// altura de crianças em crescimento. Para agilizar o fluxo, quando o
// dependente já tem exame anterior, o formulário vem pré-preenchido com os
// dados do exame mais recente dele, mas continua editável e precisa ser
// revisado/confirmado a cada exame.
export default function HealthHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HealthHistoryRouteProp>();
  const { dependentId, patientId, dependentName, age, sex } = route.params;

  // Idade e sexo vêm pré-preenchidos do cadastro do dependente/paciente (não
  // precisam ser digitados de novo a cada exame), mas continuam visíveis no
  // formulário de anamnese, como pede o RF04.
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [familyHistory, setFamilyHistory] = useState<boolean | null>(null);
  const [preExistingConditions, setPreExistingConditions] = useState('');
  const [hasPain, setHasPain] = useState<boolean | null>(null);
  const [hadSurgery, setHadSurgery] = useState<boolean | null>(null);
  const [surgeryDetail, setSurgeryDetail] = useState('');
  const [lastExamDate, setLastExamDate] = useState<string | null>(null);

  const { createExam, isSubmitting: loading } = useExamStore();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!dependentId) return;
    let cancelled = false;

    (async () => {
      const lastExam = await getLastExamForDependent(dependentId);
      if (cancelled || !lastExam) return;

      if (lastExam.weight_kg != null) setWeight(String(lastExam.weight_kg));
      if (lastExam.height_cm != null) setHeight(String(lastExam.height_cm));
      setFamilyHistory(lastExam.family_history);
      setPreExistingConditions(lastExam.pre_existing_conditions || '');
      setHasPain(lastExam.has_pain);
      setHadSurgery(lastExam.had_surgery);
      setSurgeryDetail(lastExam.surgery_detail || '');
      setLastExamDate(new Date(lastExam.created_at).toLocaleDateString('pt-BR'));
    })();

    return () => {
      cancelled = true;
    };
  }, [dependentId]);

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
    if (hasPain === null || familyHistory === null || hadSurgery === null || !weight || !height) {
      triggerShake();
      showToast('Preencha peso, altura e as perguntas de saúde.', 'error');
      return;
    }

    try {
      const payload = {
        age,
        sex,
        weight_kg: Number(weight.replace(',', '.')),
        height_cm: Number(height.replace(',', '.')),
        family_history: familyHistory,
        pre_existing_conditions: preExistingConditions.trim() || undefined,
        has_pain: hasPain,
        had_surgery: hadSurgery,
        surgery_detail: hadSurgery ? surgeryDetail.trim() || undefined : undefined,
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
        <Text style={styles.progressText}>Passo 2 de 3: Anamnese</Text>
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
              <Text style={styles.sectionTitle}>Sobre {dependentName}</Text>
              <Text style={styles.subtitleText}>
                Este formulário é refeito a cada exame, já que peso, altura e outras respostas podem
                mudar com o tempo — especialmente em crianças em crescimento.
              </Text>
              {lastExamDate && (
                <View style={styles.prefillBanner}>
                  <Text style={styles.prefillText}>
                    Preenchemos com os dados do último exame ({lastExamDate}). Revise antes de
                    continuar.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.readOnlyRow}>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Idade</Text>
                  <Text style={styles.readOnlyValue}>{age} anos</Text>
                </View>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Sexo</Text>
                  <Text style={styles.readOnlyValue}>{SEX_LABEL[sex] || sex}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label="Peso (kg)"
                    placeholder="Ex: 42.5"
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input
                    label="Altura (cm)"
                    placeholder="Ex: 150"
                    keyboardType="decimal-pad"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
              </View>

              <Input
                label="Doenças pré-existentes (opcional)"
                placeholder="Ex: asma, diabetes..."
                value={preExistingConditions}
                onChangeText={setPreExistingConditions}
              />
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

              {hadSurgery === true && (
                <Input
                  label="Qual cirurgia? (opcional)"
                  placeholder="Descreva brevemente"
                  value={surgeryDetail}
                  onChangeText={setSurgeryDetail}
                />
              )}
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
  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitleText: { ...typography.small, color: colors.textSecondary },
  prefillBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  prefillText: { ...typography.small, color: colors.primaryDark },
  readOnlyRow: { flexDirection: 'row', gap: spacing.md },
  readOnlyField: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: spacing.sm,
  },
  readOnlyLabel: { ...typography.small, color: colors.primaryDark },
  readOnlyValue: { ...typography.bodyBold, color: colors.primaryDark },
  row: { flexDirection: 'row', gap: spacing.md },
  halfWidth: { flex: 1 },
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
