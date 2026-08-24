import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Users, Plus, ChevronLeft } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { DependentCard } from '../../components/DependentCard';
import { AddDependentBottomSheet } from '../../components/AddDependentBottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getDependents, deleteDependent, Dependent } from '../../services/dependentsService';
import { AppTabParamList } from '../../navigation/AppStack';

type NavigationProp = BottomTabNavigationProp<AppTabParamList>;

export default function DependentsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);
  const [sheetOpenKey, setSheetOpenKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Dependent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDependents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDependents();
      setDependents(data);
    } catch (err: any) {
      console.log('Erro ao carregar dependentes', err);
      setError(err.message || 'Não foi possível carregar seus dependentes. Tente novamente mais tarde.');
      setDependents([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDependents();
    }, []),
  );

  const handleAddDependent = () => {
    setEditingDependent(null);
    setSheetOpenKey((k) => k + 1);
    setSheetVisible(true);
  };

  const handleEditDependent = (dependent: Dependent) => {
    setEditingDependent(dependent);
    setSheetOpenKey((k) => k + 1);
    setSheetVisible(true);
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
    setEditingDependent(null);
  };

  const handleSheetSuccess = () => {
    setSheetVisible(false);
    setEditingDependent(null);
    fetchDependents();
  };

  // Nota: Alert.alert com múltiplos botões (Cancelar/Excluir) não renderiza no
  // Expo Web, então a confirmação de exclusão usa o ConfirmDialog do próprio
  // app (funciona em todas as plataformas) em vez do Alert nativo.
  const handleDelete = (dependent: Dependent) => {
    setDeleteTarget(dependent);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteDependent(deleteTarget.id);
      setDependents((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o dependente. Tente novamente mais tarde.');
    } finally {
      setDeleting(false);
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      title="Nenhum dependente"
      subtitle="Você ainda não possui dependentes cadastrados. Adicione um para gerenciar seus resultados."
      icon={<Users color={colors.primary} size={64} />}
      actionTitle="Adicionar Dependente"
      onAction={handleAddDependent}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeTab')}
          accessibilityLabel="Voltar para o Início"
        >
          <ChevronLeft color={colors.textPrimary} size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Dependentes</Text>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDependents} />
        ) : dependents.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={dependents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <DependentCard
                id={item.id}
                name={item.name}
                age={item.age}
                sex={item.sex}
                onEdit={() => handleEditDependent(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
          />
        )}
      </View>

      {/* FAB para adicionar novo dependente */}
      {!loading && dependents.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddDependent}>
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      )}

      <AddDependentBottomSheet
        visible={sheetVisible}
        dependent={editingDependent}
        openKey={sheetOpenKey}
        onClose={handleSheetClose}
        onSuccess={handleSheetSuccess}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Excluir Dependente"
        message={`Tem certeza que deseja remover ${deleteTarget?.name ?? 'este dependente'}? Essa ação não poderá ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
