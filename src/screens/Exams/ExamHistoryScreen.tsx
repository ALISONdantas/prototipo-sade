import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ExamHistoryCard } from '../../components/ExamHistoryCard';
import { useExamStore } from '../../store/examStore';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> &
  NativeStackNavigationProp<AppStackParamList>;

export default function ExamHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { examHistory, isLoadingHistory, fetchExamHistory, retryExam, error } = useExamStore();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchExamHistory();
    }, []),
  );

  const handleOpenExam = (examId: string) => {
    navigation.navigate('ExamFlow', { screen: 'Result', params: { examId } });
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

  const renderEmptyState = () => (
    <EmptyState
      title="Nenhum exame realizado"
      subtitle="Seus exames aparecerão aqui assim que forem realizados."
      icon={<Clock color={colors.primary} size={64} />}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico de Exames</Text>
      </View>

      <View style={styles.container}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExamHistory} />
        ) : examHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={examHistory}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
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
