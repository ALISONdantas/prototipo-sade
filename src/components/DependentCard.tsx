import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Pencil, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '../theme';

export interface DependentCardProps {
  id: string;
  name: string;
  age: number;
  sex: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DependentCard({ name, age, sex, onEdit, onDelete }: DependentCardProps) {
  // Format the sex to a more readable label if needed, or just use it directly
  const displaySex = sex === 'M' ? 'Masc' : sex === 'F' ? 'Fem' : sex;

  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        <User color={colors.primary} size={24} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.age}>
            {age} {age === 1 ? 'ano' : 'anos'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displaySex}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            accessibilityLabel="Editar dependente"
          >
            <Pencil color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            accessibilityLabel="Excluir dependente"
          >
            <Trash2 color={colors.positive} size={18} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyBold,
    marginBottom: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  age: {
    ...typography.small,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
