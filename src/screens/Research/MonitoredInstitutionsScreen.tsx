import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Building2, MapPin, Phone, Plus, Trash2 } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AddInstitutionBottomSheet } from '../../components/AddInstitutionBottomSheet';
import {
  getMonitoredInstitutions,
  removeMonitoredInstitution,
  MonitoredInstitution,
} from '../../services/researchInstitutionsService';

const TYPE_LABEL: Record<MonitoredInstitution['type'], string> = {
  school: 'Escola',
  clinic: 'Clínica',
  health_center: 'Centro de Saúde',
};

export default function MonitoredInstitutionsScreen() {
  const [institutions, setInstitutions] = useState<MonitoredInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonitoredInstitution | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInstitutions = useCallback(() => {
    setLoading(true);
    setError(null);
    getMonitoredInstitutions()
      .then(setInstitutions)
      .catch(() => setError('Não foi possível carregar as instituições monitoradas.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInstitutions();
    }, [fetchInstitutions]),
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeMonitoredInstitution(deleteTarget.id);
      setInstitutions((prev) => prev.filter((institution) => institution.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Instituições Monitoradas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddSheetVisible(true)}
          accessibilityLabel="Adicionar instituição"
        >
          <Plus color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInstitutions} />
        ) : institutions.length === 0 ? (
          <EmptyState
            title="Nenhuma instituição monitorada"
            subtitle="Adicione instituições para acompanhar seus dados de triagem nas suas pesquisas."
            icon={<Building2 color={colors.primary} size={64} />}
          />
        ) : (
          <FlatList
            data={institutions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Building2 color={colors.primary} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.institutionName}>{item.name}</Text>
                    <Text style={styles.institutionType}>{TYPE_LABEL[item.type]}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeleteTarget(item)}
                    accessibilityLabel={`Excluir ${item.name}`}
                  >
                    <Trash2 color={colors.positive} size={18} />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                  <MapPin color={colors.textSecondary} size={16} />
                  <Text style={styles.infoText}>{item.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Phone color={colors.textSecondary} size={16} />
                  <Text style={styles.infoText}>{item.contact}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <AddInstitutionBottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSuccess={fetchInstitutions}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remover instituição?"
        message={`Tem certeza que deseja parar de monitorar ${deleteTarget?.name ?? 'esta instituição'}? Você pode adicioná-la novamente depois.`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h3 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  institutionName: { ...typography.bodyBold, color: colors.textPrimary },
  institutionType: { ...typography.small, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  infoText: { ...typography.small, color: colors.textSecondary },
});
