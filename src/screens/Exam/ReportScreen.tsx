import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileText, ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react-native';

import { colors, spacing, typography, radius, shadows } from '../../theme';
import { Button } from '../../components/Button';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';
import { generateAndSharePdfMock } from '../../services/pdfService';

type ReportScreenRouteProp = RouteProp<ExamStackParamList, 'Report'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

export default function ReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReportScreenRouteProp>();
  const { examId } = route.params;

  const { currentExam, examHistory, clearCurrentExam } = useExamStore();

  const exam = useMemo(
    () => (currentExam?.id === examId ? currentExam : examHistory.find((e) => e.id === examId)),
    [examId, currentExam, examHistory]
  );

  if (!exam) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isPositive = exam.status === 'POSITIVE';

  const handleFinish = () => {
    clearCurrentExam();
    navigation.navigate('MainTabs' as never);
  };

  const handleShare = async () => {
    try {
      await generateAndSharePdfMock(exam);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Document Card */}
        <View style={styles.card}>
          {/* Header do Documento */}
          <View style={styles.docHeader}>
            <View style={styles.docTitleRow}>
              <FileText size={24} color={colors.primary} />
              <Text style={styles.docTitle}>Laudo de Triagem Digital</Text>
            </View>
            <Text style={styles.docDate}>
              Data do Exame: {new Date(exam.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          
          <View style={styles.divider} />

          {/* Imagem Placeholder */}
          <View style={styles.imagePlaceholder}>
            <ImageIcon size={32} color={colors.textDisabled} />
            <Text style={styles.imageText}>Foto Analisada em Breve</Text>
          </View>

          {/* Anamnese */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados da Anamnese</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idade:</Text>
              <Text style={styles.infoValue}>{exam.age} anos</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sexo Biológico:</Text>
              <Text style={styles.infoValue}>
                {exam.sex === 'M' ? 'Masculino' : exam.sex === 'F' ? 'Feminino' : 'Outro'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Histórico Familiar:</Text>
              <Text style={styles.infoValue}>{exam.family_history ? 'Sim' : 'Não'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sente dores:</Text>
              <Text style={styles.infoValue}>{exam.has_pain ? 'Sim' : 'Não'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cirurgia prévia:</Text>
              <Text style={styles.infoValue}>{exam.had_surgery ? 'Sim' : 'Não'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Resultado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conclusão da Inteligência Artificial</Text>
            <View style={[styles.resultBadge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
              {isPositive ? (
                <AlertTriangle size={20} color={colors.positive} />
              ) : (
                <CheckCircle2 size={20} color={colors.negative} />
              )}
              <Text style={[styles.resultText, isPositive ? styles.textPositive : styles.textNegative]}>
                {isPositive ? 'Indícios Detectados' : 'Nenhum Indício Detectado'}
              </Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              Este documento apresenta o resultado de uma triagem digital. Ele NÃO possui validade de diagnóstico médico. Em caso de dúvidas ou persistência de dores, consulte um ortopedista ou especialista especializado.
            </Text>
          </View>
        </View>

        {/* Botões */}
        <View style={styles.footer}>
          <Button
            title="Gerar Laudo Oficial em PDF"
            onPress={handleShare}
            variant="primary"
            style={styles.shareButton}
          />
          <Button title="Voltar ao Início" onPress={handleFinish} variant="ghost" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card, // Fallback se shadows não exportar card (corrigido abaixo se necessário)
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: spacing.xl,
  },
  docHeader: {
    marginBottom: spacing.lg,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  docTitle: {
    ...typography.h3,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  docDate: {
    ...typography.label,
    color: colors.textSecondary,
    marginLeft: 32, // alinha com o texto (24 icon + 8 margin)
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  imageText: {
    ...typography.label,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  badgePositive: {
    backgroundColor: colors.positiveLight,
  },
  badgeNegative: {
    backgroundColor: colors.negativeLight,
  },
  resultText: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  textPositive: {
    color: colors.positive,
  },
  textNegative: {
    color: colors.negative,
  },
  disclaimerBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'justify',
  },
  footer: {
    width: '100%',
    paddingBottom: spacing.xxl,
  },
  shareButton: {
    marginBottom: spacing.md,
  },
});
