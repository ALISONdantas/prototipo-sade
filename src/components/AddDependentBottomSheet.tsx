import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './Button';
import { Input } from './Input';
import { dependentsService } from '../services/dependents';
import { Dependent } from '../services/dependentsService';

const RELATIONSHIP_OPTIONS = [
  'Filho(a)',
  'Cônjuge/Companheiro(a)',
  'Pai/Mãe',
  'Irmão(ã)',
  'Outro',
] as const;

type Relationship = (typeof RELATIONSHIP_OPTIONS)[number];

export interface AddDependentBottomSheetProps {
  visible: boolean;
  dependent?: Dependent | null;
  /** Incrementado a cada vez que o sheet é aberto, para forçar o formulário a
   *  remontar com estado limpo mesmo ao reabrir para "novo dependente" duas
   *  vezes seguidas (ex: usuário cancela e clica em adicionar de novo). */
  openKey?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDependentBottomSheet({
  visible,
  dependent,
  openKey = 0,
  onClose,
  onSuccess,
}: AddDependentBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* A key troca a cada abertura (novo dependente ou dependente diferente),
          remontando o formulário com o estado inicial já correto — sem sincronizar
          props para state via useEffect. */}
      <DependentForm
        key={`${openKey}-${dependent?.id ?? 'new'}`}
        dependent={dependent}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

interface DependentFormProps {
  dependent?: Dependent | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DependentForm({ dependent, onClose, onSuccess }: DependentFormProps) {
  const isEditing = !!dependent;

  const [name, setName] = useState(dependent?.name ?? '');
  const [birthDate, setBirthDate] = useState(dependent?.birthDate ?? '');
  const [relationship, setRelationship] = useState<Relationship | ''>(() => {
    if (!dependent) return '';
    return RELATIONSHIP_OPTIONS.includes(dependent.relationship as Relationship)
      ? (dependent.relationship as Relationship)
      : '';
  });
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro'>(
    dependent?.genderLabel ?? 'Feminino',
  );
  const [loading, setLoading] = useState(false);

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const isValidBirthDate = birthDate.length === 10;
  const isFormValid = name.trim().length > 0 && isValidBirthDate && relationship !== '';

  const handleSave = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const payload = { name: name.trim(), birthDate, gender, relationship };
      if (dependent) {
        await dependentsService.updateDependent(dependent.id, payload);
      } else {
        await dependentsService.createDependent(payload);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Erro',
        `Ocorreu um erro ao ${dependent ? 'atualizar' : 'criar'} o dependente. Tente novamente.`,
      );
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar dependente' : 'Novo dependente'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={24} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome do dependente"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Data de nascimento"
            placeholder="DD/MM/AAAA"
            value={birthDate}
            onChangeText={(text: string) => setBirthDate(formatBirthDate(text))}
            keyboardType="numeric"
          />

          <View style={styles.genderSection}>
            <Text style={styles.genderLabel}>Grau de parentesco</Text>
            <View style={styles.genderOptions}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.genderOption,
                    relationship === option && styles.genderOptionSelected,
                  ]}
                  onPress={() => setRelationship(option)}
                >
                  {relationship === option && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color={colors.primaryDark} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.genderOptionText,
                      relationship === option && styles.genderOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.genderSection}>
            <Text style={styles.genderLabel}>Sexo</Text>
            <View style={styles.genderOptions}>
              {(['Masculino', 'Feminino', 'Outro'] as const).map((g) => (
                <Pressable
                  key={g}
                  style={[styles.genderOption, gender === g && styles.genderOptionSelected]}
                  onPress={() => setGender(g)}
                >
                  {gender === g && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color={colors.primaryDark} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === g && styles.genderOptionTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            title={isEditing ? 'Salvar alterações' : 'Salvar dependente'}
            onPress={handleSave}
            disabled={!isFormValid || loading}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    ...shadows.card,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  genderSection: {
    gap: spacing.md,
  },
  genderLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genderOptionSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryLight,
  },
  checkIcon: {
    marginRight: spacing.sm,
  },
  genderOptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  genderOptionTextSelected: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
