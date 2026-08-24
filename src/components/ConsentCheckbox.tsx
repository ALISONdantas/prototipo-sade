import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';

export interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  onReadTerms: () => void;
  error?: string;
}

export function ConsentCheckbox({ checked, onToggle, onReadTerms, error }: ConsentCheckboxProps) {
  return (
    <View>
      <Pressable
        style={styles.row}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Check size={14} color={colors.white} />}
        </View>
        <Text style={styles.text}>
          Li e aceito o{' '}
          <Text style={styles.link} onPress={onReadTerms}>
            Termo de Consentimento Informado
          </Text>{' '}
          para processamento de imagens médicas e, quando aplicável, dados de menores de idade.
        </Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  error: {
    ...typography.small,
    color: colors.positive,
    marginTop: spacing.xs,
    marginLeft: 30,
  },
});
