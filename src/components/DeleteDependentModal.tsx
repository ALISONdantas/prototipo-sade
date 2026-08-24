import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './Button';

export interface DeleteDependentModalProps {
  visible: boolean;
  dependentName?: string;
  hasExamsLinked?: boolean;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
  loading?: boolean;
}

export function DeleteDependentModal({
  visible,
  dependentName = 'este dependente',
  hasExamsLinked = false,
  onClose,
  onConfirm,
  loading = false,
}: DeleteDependentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <AlertTriangle color={colors.warning} size={32} />
          </View>

          <Text style={styles.title}>Excluir Dependente?</Text>

          <Text style={styles.description}>
            Tem certeza de que deseja excluir <Text style={styles.boldText}>{dependentName}</Text>?
            {hasExamsLinked
              ? '\n\nEste dependente possui exames vinculados. Excluir o dependente também excluirá ou desvinculará todos os exames associados a ele.'
              : ' Esta ação não poderá ser desfeita.'}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onClose}
              disabled={loading}
              style={styles.button}
            />
            <View style={styles.spacer} />
            <Button
              title="Excluir mesmo assim"
              variant="danger"
              onPress={() => onConfirm(hasExamsLinked)}
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
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.card,
  },
  iconContainer: {
    backgroundColor: colors.warningLight,
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
    marginBottom: spacing.xl,
  },
  boldText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
  },
  spacer: {
    width: spacing.md,
  },
});
