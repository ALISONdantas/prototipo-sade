import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useExamStore } from '../../store/examStore';
import { useConfirmExitOnBack } from '../../hooks/useConfirmExitOnBack';
import { useToast } from '../../hooks/useToast';
import { ExamStackParamList } from '../../navigation/ExamStack';

type AnamnesisScreenRouteProp = RouteProp<ExamStackParamList, 'Anamnesis'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

export default function AnamnesisScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AnamnesisScreenRouteProp>();
  const dependentId = route.params?.dependentId;

  // Form State
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [familyHistory, setFamilyHistory] = useState(false);
  const [hasPain, setHasPain] = useState<boolean | null>(null);
  const [hadSurgery, setHadSurgery] = useState(false);

  const { createExam, isSubmitting: loading } = useExamStore();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const { toast, showToast } = useToast();

  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const { isConfirmVisible, confirmExit, cancelExit } = useConfirmExitOnBack(hasUnsavedChanges);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: false })
    ]).start();
  };

  const handleNext = async () => {
    if (!age || !sex || hasPain === null) {
      triggerShake();
      showToast('Preencha idade, sexo e se sente dor.', 'error');
      return;
    }

    try {
      const payload = {
        age: parseInt(age, 10),
        sex,
        family_history: familyHistory,
        has_pain: hasPain,
        had_surgery: hadSurgery,
        dependent_id: dependentId
      };

      await createExam(payload);

      // Allow navigation without prompt
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
        <Text style={styles.progressText}>Passo 1 de 3: Anamnese</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '33.33%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações básicas</Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label="Idade"
                    placeholder="Anos"
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
                
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Sexo Biol.</Text>
                  <View style={styles.sexContainer}>
                    <TouchableOpacity
                      style={[styles.sexButton, sex === 'M' && styles.sexButtonActive]}
                      onPress={() => setSex('M')}
                    >
                      <Text style={[styles.sexButtonText, sex === 'M' && styles.toggleTextActive]}>M</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sexButton, sex === 'F' && styles.sexButtonActive]}
                      onPress={() => setSex('F')}
                    >
                      <Text style={[styles.sexButtonText, sex === 'F' && styles.toggleTextActive]}>F</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Histórico de saúde</Text>
              
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
          title={loading ? "Salvando..." : "Próximo"} 
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
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  label: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: 'bold' },
  sexContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 48,
  },
  sexButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  sexButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  sexButtonText: { ...typography.body, color: colors.textSecondary },
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
