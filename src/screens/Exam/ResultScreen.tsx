import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';

type ResultScreenRouteProp = RouteProp<ExamStackParamList, 'Result'>;
type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const { examId } = route.params;

  const { currentExam, examHistory, retryExam, isSubmitting, clearCurrentExam } = useExamStore();

  const exam = useMemo(
    () => (currentExam?.id === examId ? currentExam : examHistory.find((e) => e.id === examId)),
    [examId, currentExam, examHistory]
  );

  const status = exam?.status || 'FAILED';

  const handleFinish = () => {
    clearCurrentExam();
    navigation.navigate('MainTabs' as never);
  };

  const handleViewReport = () => {
    navigation.navigate('Report', { examId });
  };

  const handleRetry = async () => {
    if (status === 'INCONCLUSIVE' || status === 'INVALID_IMAGE') {
      // Refazer exame volta para a câmera
      navigation.navigate('Camera');
    } else if (status === 'FAILED') {
      // Tentar novamente (erro de servidor) chama API de retry
      try {
        await retryExam(examId);
        navigation.navigate('AILoading', { examId });
      } catch (err) {
        // erro tratado na store, a tela pode mostrar um Toast futuramente
      }
    }
  };

  const config = useMemo(() => {
    switch (status) {
      case 'POSITIVE':
        return {
          icon: AlertTriangle,
          iconColor: colors.positive,
          bgColor: colors.positiveLight,
          title: 'Atenção: Indícios Detectados',
          subtitle:
            'A inteligência artificial identificou possíveis indícios de escoliose na imagem analisada. Recomendamos a avaliação de um profissional de saúde.',
          primaryButton: {
            title: 'Ver Laudo',
            onPress: handleViewReport,
            variant: 'danger' as const,
          },
          secondaryButton: { title: 'Voltar ao Início', onPress: handleFinish },
        };
      case 'NEGATIVE':
        return {
          icon: CheckCircle2,
          iconColor: colors.negative,
          bgColor: colors.negativeLight,
          title: 'Nenhum Indício Detectado',
          subtitle:
            'A inteligência artificial não encontrou indícios de escoliose na imagem analisada. Este resultado não substitui uma avaliação médica.',
          primaryButton: {
            title: 'Ver Laudo',
            onPress: handleViewReport,
            variant: 'primary' as const,
          },
          secondaryButton: { title: 'Voltar ao Início', onPress: handleFinish },
        };
      case 'INCONCLUSIVE':
        return {
          icon: HelpCircle,
          iconColor: colors.warning,
          bgColor: colors.warningLight,
          title: 'Resultado Inconclusivo',
          subtitle:
            'Não foi possível analisar a imagem com clareza. Certifique-se de que a pessoa está na posição correta e a iluminação está adequada.',
          primaryButton: {
            title: 'Tentar Novamente',
            onPress: handleRetry,
            variant: 'primary' as const,
          },
          secondaryButton: { title: 'Voltar ao Início', onPress: handleFinish },
        };
      case 'INVALID_IMAGE':
        return {
          icon: AlertTriangle,
          iconColor: colors.warning,
          bgColor: colors.warningLight,
          title: 'Imagem Inválida',
          subtitle:
            'A inteligência artificial não conseguiu reconhecer a região das costas. Por favor, certifique-se de que a foto está nítida e segue as instruções.',
          primaryButton: {
            title: 'Tirar Nova Foto',
            onPress: handleRetry,
            variant: 'primary' as const,
          },
          secondaryButton: { title: 'Voltar ao Início', onPress: handleFinish },
        };
      default: // FAILED ou status desconhecido
        return {
          icon: XCircle,
          iconColor: colors.positive,
          bgColor: colors.positiveLight,
          title: 'Falha na Análise',
          subtitle:
            'Ocorreu um erro ao processar seu exame nos servidores. Por favor, tente novamente.',
          primaryButton: {
            title: 'Tentar Novamente',
            onPress: handleRetry,
            variant: 'danger' as const,
          },
          secondaryButton: { title: 'Voltar ao Início', onPress: handleFinish },
        };
    }
  }, [status]);

  const Icon = config.icon;

  if (!exam) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
        <Icon size={48} color={config.iconColor} />
      </View>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <View style={styles.footer}>
        <Button
          title={config.primaryButton.title}
          onPress={config.primaryButton.onPress}
          variant={config.primaryButton.variant}
          loading={isSubmitting}
          style={styles.primaryBtn}
        />
        <Button
          title={config.secondaryButton.title}
          onPress={config.secondaryButton.onPress}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    marginTop: spacing.xxl,
  },
  primaryBtn: {
    marginBottom: spacing.md,
  },
});
