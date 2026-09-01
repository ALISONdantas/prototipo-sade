import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronDown, Check } from 'lucide-react-native';

import { colors, spacing, typography, radius, shadows } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useExamStore } from '../../store/examStore';
import { getLastExamForPatient } from '../../services/examService';
import { ExamStackParamList } from '../../navigation/ExamStack';

type GuardianInfoRouteProp = RouteProp<ExamStackParamList, 'GuardianInfo'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

const RELATIONSHIP_OPTIONS = ['Pai', 'Mãe', 'Avó', 'Avô', 'Outro'] as const;
type Relationship = (typeof RELATIONSHIP_OPTIONS)[number];

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
}

function calculateAge(brDate: string): number {
  const [day, month, year] = brDate.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

// Etapa exclusiva do fluxo de Profissional/Instituição (exame em um
// paciente) — coleta os dados do responsável legal antes do Teste de Adams,
// exigindo que ele seja maior de idade.
export default function GuardianInfoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GuardianInfoRouteProp>();
  const { patientName } = route.params ?? {};

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationship, setRelationship] = useState<Relationship | ''>('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const { currentExam, updateGuardianInfo, isSubmitting: loading } = useExamStore();
  const patientId = currentExam?.id_patient;

  // Paciente que já fez exame antes já tem um responsável cadastrado — traz
  // pré-preenchido para agilizar, mas continua editável (pode ter vindo com
  // outro responsável dessa vez, ex: da mãe em vez do pai).
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    (async () => {
      const lastExam = await getLastExamForPatient(patientId, currentExam?.id);
      if (cancelled || !lastExam || !lastExam.guardian_name) return;

      setFullName(lastExam.guardian_name);
      setCpf(lastExam.guardian_cpf || '');
      setBirthDate(lastExam.guardian_birth_date || '');
      const fixedOptions = RELATIONSHIP_OPTIONS.filter((option) => option !== 'Outro');
      if (lastExam.guardian_relationship) {
        if ((fixedOptions as readonly string[]).includes(lastExam.guardian_relationship)) {
          setRelationship(lastExam.guardian_relationship as Relationship);
        } else {
          // Parentesco registrado não é uma das opções fixas — veio de um
          // "Outro" com texto livre da vez anterior.
          setRelationship('Outro');
          setCustomRelationship(lastExam.guardian_relationship);
        }
      }
      setPrefilled(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const isValidBirthDate = birthDate.length === 10;
  const age = isValidBirthDate ? calculateAge(birthDate) : null;
  const isMinor = age !== null && age < 18;
  const isFormValid =
    fullName.trim().length > 0 &&
    cpf.replace(/\D/g, '').length === 11 &&
    isValidBirthDate &&
    !isMinor &&
    relationship !== '';

  const handleNext = async () => {
    if (!isFormValid) return;
    try {
      await updateGuardianInfo({ name: fullName.trim(), cpf, birthDate, relationship });
      navigation.navigate('AdamsTutorial');
    } catch (error) {
      // erro tratado na store
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Responsável</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Responsável {patientName ? `por ${patientName}` : 'pelo paciente'}
            </Text>
            <Text style={styles.subtitleText}>
              Antes de iniciar o Teste de Adams, informe os dados do responsável legal pelo
              paciente.
            </Text>
            {prefilled && (
              <View style={styles.prefillBanner}>
                <Text style={styles.prefillText}>
                  Preenchemos com o responsável do último exame. Revise ou troque se hoje for outra
                  pessoa (ex: veio a mãe em vez do pai).
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Input
              label="Nome completo"
              placeholder="Ex: Maria Silva"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={(text: string) => setCpf(formatCpf(text))}
              keyboardType="numeric"
            />

            <Input
              label="Data de nascimento"
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChangeText={(text: string) => setBirthDate(formatBirthDate(text))}
              keyboardType="numeric"
              error={isMinor}
              helperText={isMinor ? 'O responsável deve ser maior de idade.' : undefined}
            />

            <View style={styles.relationshipSection}>
              <Text style={styles.relationshipLabel}>Grau de parentesco</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={relationship ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {relationship || 'Selecione'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          />
          <View style={styles.dropdownMenu}>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setRelationship(option);
                  setDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    relationship === option && styles.dropdownItemTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {relationship === option && <Check size={18} color={colors.primaryDark} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : 'Próximo'}
          onPress={handleNext}
          disabled={!isFormValid || loading}
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
  relationshipSection: { gap: spacing.md },
  relationshipLabel: { ...typography.bodyBold, color: colors.textPrimary },
  dropdownTrigger: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: { ...typography.body, color: colors.textPrimary },
  dropdownPlaceholder: { ...typography.body, color: colors.textSecondary },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.xl,
  },
  dropdownMenu: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownItemText: { ...typography.body, color: colors.textPrimary },
  dropdownItemTextSelected: { ...typography.bodyBold, color: colors.primaryDark },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
