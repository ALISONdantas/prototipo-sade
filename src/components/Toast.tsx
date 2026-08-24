import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

export type ToastVariant = 'success' | 'error';

interface ToastProps {
  message: string;
  variant: ToastVariant;
}

export function Toast({ message, variant }: ToastProps) {
  return (
    <View style={[styles.container, variant === 'error' ? styles.error : styles.success]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 100,
  },
  success: { backgroundColor: colors.primary },
  error: { backgroundColor: '#D32F2F' },
  text: { ...typography.bodyBold, color: colors.white, textAlign: 'center' },
});
