import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './Button';

export interface RequestRetakeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export function RequestRetakeModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: RequestRetakeModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Explique o motivo para o paciente saber o que ajustar.');
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <RotateCcw color={colors.positive} size={32} />
          </View>

          <Text style={styles.title}>Pedir Repetição do Exame?</Text>

          <Text style={styles.description}>
            O paciente será notificado para refazer este exame do zero (nova foto e anamnese).
            Descreva o motivo para orientar a repetição:
          </Text>

          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            placeholder="Ex.: foto fora de foco, ângulo incorreto..."
            placeholderTextColor={colors.textDisabled}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (error) setError(null);
            }}
            multiline
            numberOfLines={3}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={handleClose}
              disabled={loading}
              style={styles.button}
            />
            <View style={styles.spacer} />
            <Button
              title="Pedir Repetição"
              variant="danger"
              onPress={handleConfirm}
              loading={loading}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    ...shadows.card,
  },
  iconContainer: {
    backgroundColor: colors.positiveLight,
    padding: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.positive,
  },
  errorText: {
    ...typography.label,
    color: colors.positive,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
  },
  spacer: {
    width: spacing.md,
  },
});
