import { Box, Text, Pressable } from '@gluestack-ui/themed';
import { colors } from '../theme';

export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accentColor?: string;
  accentBg?: string;
  onPress?: () => void;
}

export function MetricCard({
  label,
  value,
  icon: MetricIcon,
  accentColor = colors.primary,
  accentBg = colors.primaryLight,
  onPress,
}: MetricCardProps) {
  const content = (
    <Box
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      p="$4"
      bg={colors.surface}
      minWidth={160}
    >
      <Box bg={accentBg} p="$3" borderRadius="$lg" alignSelf="flex-start" mb="$3">
        <MetricIcon size={20} color={accentColor} />
      </Box>
      <Text color={colors.textPrimary} fontSize="$2xl" fontWeight="$bold">
        {value}
      </Text>
      <Text color={colors.textSecondary} fontSize="$sm">
        {label}
      </Text>
    </Box>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Métrica: ${label}. Valor atual: ${value}`}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
