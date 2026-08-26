import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: boolean;
  helperText?: string;
  style?: ViewStyle;
}

export function Input({
  label,
  error = false,
  helperText,
  style,
  value,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnim] = useState(() => new Animated.Value(value ? 1 : 0));
  const inputRef = useRef<TextInput>(null);

  const isFloating = isFocused || !!value;

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  // O label só reagia a focus/blur; quando `value` é setado programaticamente
  // (ex: pré-preenchimento do último exame), o label ficava sobreposto ao
  // texto por nunca ter sido "flutuado".
  useEffect(() => {
    animateLabel(isFloating ? 1 : 0);
  }, [value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateLabel(1);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) animateLabel(0);
    onBlur?.(e);
  };

  const borderColor = error ? colors.positive : isFocused ? colors.primary : colors.border;

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, -8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 12],
  });

  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colors.textSecondary,
      error ? colors.positive : isFocused ? colors.primary : colors.textSecondary,
    ],
  });

  return (
    <View style={style}>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View style={[styles.container, { borderColor }]}>
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
                backgroundColor: isFloating ? colors.surface : 'transparent',
              },
            ]}
          >
            {label}
          </Animated.Text>

          <View style={styles.row}>
            <TextInput
              ref={inputRef}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={styles.input}
              placeholderTextColor={isFocused ? colors.textSecondary : 'transparent'}
              {...rest}
            />
            {error && <Text style={styles.errorIcon}>⚠</Text>}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    left: spacing.md,
    fontWeight: '400',
    paddingHorizontal: 2,
    zIndex: 1,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  errorIcon: {
    fontSize: 16,
    color: colors.positive,
    marginLeft: spacing.sm,
  },
  helperText: {
    ...typography.small,
    color: colors.positive,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
