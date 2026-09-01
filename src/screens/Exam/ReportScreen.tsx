import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileText, ImageIcon, CheckCircle2, AlertTriangle, Stethoscope } from 'lucide-react-native';

import { colors, spacing, typography, radius, shadows } from '../../theme';
import { Button } from '../../components/Button';
import { RequestRetakeModal } from '../../components/RequestRetakeModal';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';
import { useAuthStore } from '../../store/authStore';
import { getLogicalRole } from '../../utils/role';
import { generateAndSharePdfMock } from '../../services/pdfService';
import { resolveProfessionalAlertByExam } from '../../services/alertsService';

type ReportScreenRouteProp = RouteProp<ExamStackParamList, 'Report'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

export default function ReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReportScreenRouteProp>();
  const { examId } = route.params;

  const {
    currentExam,
    examHistory,
    isLoadingHistory,
    fetchExamHistory,
    clearCurrentExam,
    evaluateExam,
    requestRetake,
    isSubmitting,
  } = useExamStore();
  const { user } = useAuthStore();
  const isProfessional = getLogicalRole(user) === 'PROFESSIONAL';
  const { toast, showToast } = useToast();

  const exam = useMemo(
    () => (currentExam?.id === examId ? currentExam : examHistory.find((e) => e.id === examId)),
    [examId, currentExam, examHistory],
  );

  const [opinion, setOpinion] = useState('');
  const [agreesWithAi, setAgreesWithAi] = useState<boolean | null>(null);
  const [retakeModalVisible, setRetakeModalVisible] = useState(false);

  // Ao chegar aqui direto (ex.: a partir de "Resolver" na tela de Alertas),
  // o histórico de exames pode ainda não ter sido carregado — busca sob
  // demanda (uma única vez) para não deixar o laudo preso no spinner.
  const [triedFetch, setTriedFetch] = useState(false);
  useEffect(() => {
    if (!exam && !isLoadingHistory && !triedFetch) {
      setTriedFetch(true);
      fetchExamHistory();
    }
  }, [exam, isLoadingHistory, triedFetch, fetchExamHistory]);

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

  const handleSendEvaluation = async () => {
    if (agreesWithAi === null) return;
    try {
      await evaluateExam(examId, opinion, agreesWithAi);
      // Resolve o alerta correspondente (se houver) agora que o parecer foi
      // registrado. Falha aqui não deve bloquear o fluxo do laudo.
      resolveProfessionalAlertByExam(examId).catch(() => {});
    } catch (error) {
      console.error('Erro ao enviar parecer do profissional:', error);
    }
  };

  const handleConfirmRetake = async (reason: string) => {
    try {
      await requestRetake(examId, reason);
      // Repetição solicitada conta como o profissional ter tratado o alerta,
      // mesmo sem emitir um parecer sobre o resultado atual.
      resolveProfessionalAlertByExam(examId).catch(() => {});
      setRetakeModalVisible(false);
      showToast('Repetição solicitada. O paciente verá o pedido no histórico dele.');
    } catch (error) {
      console.error('Erro ao solicitar repetição do exame:', error);
      showToast('Não foi possível registrar o pedido. Tente novamente.', 'error');
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
            {exam.weight_kg != null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Peso:</Text>
                <Text style={styles.infoValue}>{exam.weight_kg} kg</Text>
              </View>
            )}
            {exam.height_cm != null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Altura:</Text>
                <Text style={styles.infoValue}>{exam.height_cm} cm</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Histórico Familiar:</Text>
              <Text style={styles.infoValue}>{exam.family_history ? 'Sim' : 'Não'}</Text>
            </View>
            {!!exam.pre_existing_conditions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doenças pré-existentes:</Text>
                <Text style={styles.infoValue}>{exam.pre_existing_conditions}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sente dores:</Text>
              <Text style={styles.infoValue}>{exam.has_pain ? 'Sim' : 'Não'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cirurgia prévia:</Text>
              <Text style={styles.infoValue}>
                {exam.had_surgery ? exam.surgery_detail || 'Sim' : 'Não'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Resultado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conclusão da Inteligência Artificial</Text>
            <View
              style={[styles.resultBadge, isPositive ? styles.badgePositive : styles.badgeNegative]}
            >
              {isPositive ? (
                <AlertTriangle size={20} color={colors.positive} />
              ) : (
                <CheckCircle2 size={20} color={colors.negative} />
              )}
              <Text
                style={[styles.resultText, isPositive ? styles.textPositive : styles.textNegative]}
              >
                {isPositive ? 'Indícios Detectados' : 'Nenhum Indício Detectado'}
              </Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              Este documento apresenta o resultado de uma triagem digital. Ele NÃO possui validade
              de diagnóstico médico. Em caso de dúvidas ou persistência de dores, consulte um
              ortopedista ou especialista especializado.
            </Text>
          </View>

          {/* Parecer do Profissional — visível apenas para o perfil Profissional */}
          {isProfessional && (
            <View style={styles.evaluationSection}>
              <View style={styles.evaluationHeader}>
                <Stethoscope size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Parecer do Profissional</Text>
              </View>

              {exam.retake ? (
                <View style={styles.retakeDoneBox}>
                  <Text style={styles.retakeDoneLabel}>Repetição do exame solicitada</Text>
                  <Text style={styles.retakeDoneText}>{exam.retake.reason}</Text>
                </View>
              ) : exam.evaluation ? (
                <View style={styles.evaluationDoneBox}>
                  <Text style={styles.evaluationDoneLabel}>
                    {exam.evaluation.agreesWithAi
                      ? 'Diagnóstico da IA confirmado'
                      : 'Divergência registrada'}
                  </Text>
                  {!!exam.evaluation.opinion && (
                    <Text style={styles.evaluationDoneText}>{exam.evaluation.opinion}</Text>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.evaluationToggles}>
                    <TouchableOpacity
                      style={[
                        styles.evaluationTogglePill,
                        agreesWithAi === true && styles.evaluationTogglePillActive,
                      ]}
                      onPress={() => setAgreesWithAi(true)}
                    >
                      <Text
                        style={[
                          styles.evaluationToggleText,
                          agreesWithAi === true && styles.evaluationToggleTextActive,
                        ]}
                      >
                        Confirmar diagnóstico da IA
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.evaluationTogglePill,
                        agreesWithAi === false && styles.evaluationTogglePillActive,
                      ]}
                      onPress={() => setAgreesWithAi(false)}
                    >
                      <Text
                        style={[
                          styles.evaluationToggleText,
                          agreesWithAi === false && styles.evaluationToggleTextActive,
                        ]}
                      >
                        Divergir e justificar
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.evaluationInput}
                    placeholder="Escreva seu parecer clínico (opcional)"
                    placeholderTextColor={colors.textDisabled}
                    value={opinion}
                    onChangeText={setOpinion}
                    multiline
                    numberOfLines={4}
                  />

                  <Button
                    title={isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                    onPress={handleSendEvaluation}
                    disabled={agreesWithAi === null || isSubmitting}
                    style={styles.evaluationSubmitButton}
                  />

                  <Button
                    title="Refazer Exame"
                    variant="danger"
                    onPress={() => setRetakeModalVisible(true)}
                    disabled={isSubmitting}
                    style={styles.retakeButton}
                  />
                </>
              )}
            </View>
          )}
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

      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <RequestRetakeModal
        visible={retakeModalVisible}
        onClose={() => setRetakeModalVisible(false)}
        onConfirm={handleConfirmRetake}
        loading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
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
  evaluationSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  evaluationToggles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  evaluationTogglePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  evaluationTogglePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  evaluationToggleText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  evaluationToggleTextActive: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  evaluationInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  evaluationSubmitButton: {
    marginTop: spacing.xs,
  },
  retakeButton: {
    marginTop: spacing.sm,
  },
  evaluationDoneBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  evaluationDoneLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  evaluationDoneText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  retakeDoneBox: {
    backgroundColor: colors.positiveLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  retakeDoneLabel: {
    ...typography.bodyBold,
    color: colors.positive,
    marginBottom: spacing.xs,
  },
  retakeDoneText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
