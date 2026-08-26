import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Plus } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { DependentCard } from '../../components/DependentCard';
import { AddDependentBottomSheet } from '../../components/AddDependentBottomSheet';
import { getDependents, Dependent } from '../../services/dependentsService';
import { ExamStackParamList } from '../../navigation/ExamStack';

type NavigationProp = NativeStackNavigationProp<ExamStackParamList, 'SelectTestee'>;

export default function SelectTesteeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetOpenKey, setSheetOpenKey] = useState(0);
  const [autoRedirected, setAutoRedirected] = useState(false);

  const fetchDependents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDependents();
      setDependents(data);
      // Requisito: se não há dependentes, redireciona direto para o cadastro
      // de um novo dependente, sem exigir ação extra do usuário.
      if (data.length === 0 && !autoRedirected) {
        setAutoRedirected(true);
        setSheetOpenKey((k) => k + 1);
        setSheetVisible(true);
      }
    } catch (err) {
      console.warn('Erro ao carregar dependentes para o exame:', err);
    } finally {
      setLoading(false);
    }
  }, [autoRedirected]);

  useFocusEffect(
    useCallback(() => {
      fetchDependents();
    }, [fetchDependents]),
  );

  const handleSelectDependent = (dependent: Dependent) => {
    navigation.navigate('HealthHistory', {
      dependentId: dependent.id,
      dependentName: dependent.name,
      age: dependent.age,
      sex: (dependent.sex as 'M' | 'F' | 'O') || 'O',
    });
  };

  const handleAddDependent = () => {
    setSheetOpenKey((k) => k + 1);
    setSheetVisible(true);
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
  };

  const handleSheetSuccess = async () => {
    setSheetVisible(false);
    const data = await getDependents();
    setDependents(data);
    // Assim que o dependente é criado, já retoma o fluxo do exame com ele selecionado.
    const newest = data[data.length - 1];
    if (newest) handleSelectDependent(newest);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Exame</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Passo 1 de 3: Para quem é o teste?</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '33.33%' }]} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {dependents.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Escolha um dependente</Text>
                {dependents.map((dependent) => (
                  <DependentCard
                    key={dependent.id}
                    id={dependent.id}
                    name={dependent.name}
                    age={dependent.age}
                    sex={dependent.sex}
                    onPress={() => handleSelectDependent(dependent)}
                  />
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.addCard}
              onPress={handleAddDependent}
              activeOpacity={0.8}
            >
              <View style={styles.addIconContainer}>
                <Plus color={colors.primary} size={22} />
              </View>
              <Text style={styles.addText}>Adicionar novo dependente</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <AddDependentBottomSheet
        visible={sheetVisible}
        openKey={sheetOpenKey}
        onClose={handleSheetClose}
        onSuccess={handleSheetSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...typography.h3 },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  content: { flex: 1, padding: spacing.lg },
  loadingContainer: { paddingTop: spacing.xxl, alignItems: 'center' },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.md },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addText: { ...typography.bodyBold, color: colors.primary },
});
