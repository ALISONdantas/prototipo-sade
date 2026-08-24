import { colors } from './colors';

// Fonte: System Font (San Francisco no iOS, Roboto no Android)
// Pesos bem definidos criam hierarquia clara
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: colors.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22, color: colors.textPrimary },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
};
