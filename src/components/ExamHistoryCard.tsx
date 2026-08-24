import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, RotateCw } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';

export interface ExamHistoryCardProps {
  status: string;
  createdAt: string;
  dependentName?: string;
  onPress?: () => void;
  onRetry?: () => void;
  retrying?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { letter: string; color: string; bgColor: string; summary: string }
> = {
  POSITIVE: {
    letter: 'P',
    color: colors.positive,
    bgColor: colors.positiveLight,
    summary: 'Indícios Detectados',
  },
  NEGATIVE: {
    letter: 'N',
    color: colors.negative,
    bgColor: colors.negativeLight,
    summary: 'Nenhum Indício Detectado',
  },
  INCONCLUSIVE: {
    letter: 'I',
    color: colors.warning,
    bgColor: colors.warningLight,
    summary: 'Resultado Inconclusivo',
  },
  FAILED: {
    letter: '!',
    color: colors.textSecondary,
    bgColor: colors.border,
    summary: 'Falha na Análise',
  },
};

export function ExamHistoryCard({
  status,
  createdAt,
  dependentName,
  onPress,
  onRetry,
  retrying = false,
}: ExamHistoryCardProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FAILED;
  const isFailed = status === 'FAILED';

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.letter}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.date} numberOfLines={1}>
          {formattedDate}
          {dependentName ? ` · ${dependentName}` : ''}
        </Text>
        <Text style={[styles.summary, { color: config.color }]} numberOfLines={1}>
          {config.summary}
        </Text>
      </View>

      {isFailed ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} disabled={retrying}>
          <RotateCw size={14} color={colors.primary} />
          <Text style={styles.retryText}>{retrying ? 'Enviando...' : 'Reenviar'}</Text>
        </TouchableOpacity>
      ) : (
        <ChevronRight color={colors.textSecondary} size={20} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  date: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  summary: {
    ...typography.small,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
    marginLeft: 4,
  },
});
