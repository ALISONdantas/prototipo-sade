import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './Button';
import { Input } from './Input';
import { createPatient } from '../services/patientsService';
import { getAttendedUnits, AttendedUnit } from '../services/professionalService';

export interface AddPatientBottomSheetProps {
  visible: boolean;
  /** Incrementado a cada abertura, para remontar o formulário com estado limpo. */
  openKey?: number;
  onClose: () => void;
  onSuccess: (patientId: string) => void;
}

export function AddPatientBottomSheet({
  visible,
  openKey = 0,
  onClose,
  onSuccess,
}: AddPatientBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <PatientForm key={openKey} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}

interface PatientFormProps {
  onClose: () => void;
  onSuccess: (patientId: string) => void;
}

function PatientForm({ onClose, onSuccess }: PatientFormProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | 'O' | ''>('');
  const [units, setUnits] = useState<AttendedUnit[]>([]);
  const [unitId, setUnitId] = useState('');
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAttendedUnits()
      .then((data) => {
        setUnits(data);
        if (data.length === 1) setUnitId(data[0].id);
      })
      .finally(() => setLoadingUnits(false));
  }, []);

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const isValidBirthDate = birthDate.length === 10;
  const isFormValid = name.trim().length > 0 && isValidBirthDate && sex !== '' && unitId !== '';

  const handleSave = async () => {
    if (!isFormValid || sex === '') return;

    setSaving(true);
    try {
      const unit = units.find((u) => u.id === unitId);
      const patient = await createPatient({
        name: name.trim(),
        birthDate,
        sex,
        unitId,
        unitName: unit?.name ?? '',
      });
      onSuccess(patient.id);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o paciente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheetContainer}>
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo paciente</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={24} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <Input label="Nome do paciente" value={name} onChangeText={setName} autoCapitalize="words" />

          <Input
            label="Data de nascimento"
            placeholder="DD/MM/AAAA"
            value={birthDate}
            onChangeText={(text: string) => setBirthDate(formatBirthDate(text))}
            keyboardType="numeric"
          />

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>Sexo</Text>
            <View style={styles.optionsRow}>
              {(
                [
                  { key: 'M', label: 'Masculino' },
                  { key: 'F', label: 'Feminino' },
                  { key: 'O', label: 'Outro' },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.key}
                  style={[styles.option, sex === option.key && styles.optionSelected]}
                  onPress={() => setSex(option.key)}
                >
                  {sex === option.key && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color={colors.primaryDark} />
                    </View>
                  )}
                  <Text style={[styles.optionText, sex === option.key && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>Unidade de atendimento</Text>
            {loadingUnits ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.optionsRow}>
                {units.map((unit) => (
                  <Pressable
                    key={unit.id}
                    style={[styles.option, unitId === unit.id && styles.optionSelected]}
                    onPress={() => setUnitId(unit.id)}
                  >
                    {unitId === unit.id && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color={colors.primaryDark} />
                      </View>
                    )}
                    <Text style={[styles.optionText, unitId === unit.id && styles.optionTextSelected]}>
                      {unit.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Button
            title="Salvar paciente"
            onPress={handleSave}
            disabled={!isFormValid || saving}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...(StyleSheet.absoluteFill as object), backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    ...shadows.card,
  },
  dragHandleContainer: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  dragHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: radius.full },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerTitle: { ...typography.h2 },
  closeButton: { padding: spacing.xs },
  form: { gap: spacing.lg },
  sectionGroup: { gap: spacing.md },
  sectionLabel: { ...typography.bodyBold, color: colors.textPrimary },
  optionsRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryLight,
  },
  checkIcon: { marginRight: spacing.sm },
  optionText: { ...typography.body, color: colors.textSecondary },
  optionTextSelected: { ...typography.bodyBold, color: colors.primaryDark },
  saveButton: { marginTop: spacing.md },
});
