import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock, ClipboardCheck, ChevronLeft } from 'lucide-react-native';

import { colors, spacing, typography, radius } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ExamHistoryCard } from '../../components/ExamHistoryCard';
import { useExamStore } from '../../store/examStore';
import { useAuthStore } from '../../store/authStore';
import { getLogicalRole } from '../../utils/role';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> &
  NativeStackNavigationProp<AppStackParamList>;

type ExamsSection = 'history' | 'toEvaluate';

export default function ExamHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { examHistory, isLoadingHistory, fetchExamHistory, retryExam, error } = useExamStore();
  const { user } = useAuthStore();
  const isProfessional = getLogicalRole(user) === 'PROFESSIONAL';
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [section, setSection] = useState<ExamsSection>('history');

  useFocusEffect(
    useCallback(() => {
      fetchExamHistory();
    }, []),
  );

  // O Profissional só recebe exames com resultado definitivo (Positivo ou
  // Negativo) — inconclusivos e falhas na análise ficam só com o próprio
  // paciente/usuário, que precisa refazer o teste, e nunca chegam ao médico.
  const professionalExams = useMemo(
    () => examHistory.filter((exam) => exam.status === 'POSITIVE' || exam.status === 'NEGATIVE'),
    [examHistory],
  );
  const baseExams = isProfessional ? professionalExams : examHistory;

  // "Exames para avaliar" (só Profissional): dentro desse subconjunto, os que
  // ainda não receberam o parecer do profissional (ver Report).
  const toEvaluate = useMemo(
    () => professionalExams.filter((exam) => !exam.evaluation),
    [professionalExams],
  );
  const visibleExams = isProfessional && section === 'toEvaluate' ? toEvaluate : baseExams;

  const handleOpenExam = (examId: string) => {
    const screen = isProfessional && section === 'toEvaluate' ? 'Report' : 'Result';
    navigation.navigate('ExamFlow', { screen, params: { examId } });
  };

  const handleRetry = async (examId: string) => {
    setRetryingId(examId);
    try {
      await retryExam(examId);
      navigation.navigate('ExamFlow', { screen: 'AILoading', params: { examId } });
    } catch (error) {
      // erro tratado na store
    } finally {
      setRetryingId(null);
    }
  };

  const renderEmptyState = () =>
    section === 'toEvaluate' ? (
      <EmptyState
        title="Nenhum exame pendente"
        subtitle="Exames de pacientes prontos para o seu parecer aparecerão aqui."
        icon={<ClipboardCheck color={colors.primary} size={64} />}
      />
    ) : (
      <EmptyState
        title="Nenhum exame realizado"
        subtitle="Seus exames aparecerão aqui assim que forem realizados."
        icon={<Clock color={colors.primary} size={64} />}
      />
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {!isProfessional && (
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.navigate('HomeTab')}
            accessibilityLabel="Voltar para o Início"
          >
            <ChevronLeft color={colors.textPrimary} size={26} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Histórico de Exames</Text>
      </View>

      {isProfessional && (
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tab, section === 'history' && styles.tabActive]}
            onPress={() => setSection('history')}
          >
            <Text style={[styles.tabText, section === 'history' && styles.tabTextActive]}>
              Histórico de exames
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, section === 'toEvaluate' && styles.tabActive]}
            onPress={() => setSection('toEvaluate')}
          >
            <Text style={[styles.tabText, section === 'toEvaluate' && styles.tabTextActive]}>
              Exames para avaliar
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.container}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExamHistory} />
        ) : visibleExams.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={visibleExams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ExamHistoryCard
                status={item.status}
                createdAt={item.created_at}
                dependentName={item.dependent_name}
                retrying={retryingId === item.id}
                onPress={item.status === 'FAILED' ? undefined : () => handleOpenExam(item.id)}
                onRetry={item.status === 'FAILED' ? () => handleRetry(item.id) : undefined}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
