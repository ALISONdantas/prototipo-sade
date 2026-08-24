import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

export interface ProgressBarProps {
  progress: number; // Values from 0 to 1
  color?: string;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color, style }: ProgressBarProps) {
  const [widthAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Clamping the value to ensure it's between 0 and 1
    const safeProgress = Math.max(0, Math.min(1, progress));

    Animated.timing(widthAnim, {
      toValue: safeProgress,
      duration: 300,
      useNativeDriver: false, // width animation doesn't support native driver in basic Animated
    }).start();
  }, [progress, widthAnim]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.fill,
          { width: widthInterpolated, backgroundColor: color ?? colors.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
