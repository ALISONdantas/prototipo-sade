import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Building2, MapPin, Phone } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { getAttendedUnits, AttendedUnit } from '../../services/professionalService';

const TYPE_LABEL: Record<AttendedUnit['type'], string> = {
  school: 'Escola',
  clinic: 'Clínica',
  health_center: 'Centro de Saúde',
};

export default function AttendedUnitsScreen() {
  const [units, setUnits] = useState<AttendedUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(() => {
    setLoading(true);
    setError(null);
    getAttendedUnits()
      .then(setUnits)
      .catch(() => setError('Não foi possível carregar as unidades de atendimento.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnits();
    }, [fetchUnits]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unidades de Atendimento</Text>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUnits} />
        ) : units.length === 0 ? (
          <EmptyState
            title="Nenhuma unidade vinculada"
            subtitle="Você ainda não está vinculado a nenhuma instituição de atendimento."
            icon={<Building2 color={colors.primary} size={64} />}
          />
        ) : (
          <FlatList
            data={units}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Building2 color={colors.primary} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.unitName}>{item.name}</Text>
                    <Text style={styles.unitType}>{TYPE_LABEL[item.type]}</Text>
                  </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h3 },
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
  unitName: { ...typography.bodyBold, color: colors.textPrimary },
  unitType: { ...typography.small, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  infoText: { ...typography.small, color: colors.textSecondary },
});
