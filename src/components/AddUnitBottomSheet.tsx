import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Check, Plus, X, Building2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import {
  getAvailableUnits,
  addAttendedUnit,
  getUnitStates,
  getUnitCities,
  isUnitAttended,
  AttendedUnit,
} from '../services/professionalService';

export interface AddUnitBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUnitBottomSheet({ visible, onClose, onSuccess }: AddUnitBottomSheetProps) {
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [units, setUnits] = useState<AttendedUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [attendedIds, setAttendedIds] = useState<string[]>([]);

  const states = useMemo(() => getUnitStates(), []);
  const cities = useMemo(() => (state ? getUnitCities(state) : []), [state]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getAvailableUnits({ state: state ?? undefined, city: city ?? undefined })
      .then((data) => {
        setUnits(data);
        setAttendedIds(data.filter((u) => isUnitAttended(u.id)).map((u) => u.id));
      })
      .finally(() => setLoading(false));
  }, [visible, state, city]);

  const handleSelectState = (value: string) => {
    setState((prev) => (prev === value ? null : value));
    setCity(null);
  };

  const handleAdd = async (unitId: string) => {
    setAddingId(unitId);
    try {
      await addAttendedUnit(unitId);
      setAttendedIds((prev) => [...prev, unitId]);
      onSuccess();
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Adicionar unidade</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={24} />
            </Pressable>
          </View>

          <Text style={styles.filterLabel}>Estado</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {states.map((uf) => (
              <Pressable
                key={uf}
                style={[styles.pill, state === uf && styles.pillActive]}
                onPress={() => handleSelectState(uf)}
              >
                <Text style={[styles.pillText, state === uf && styles.pillTextActive]}>{uf}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {state && (
            <>
              <Text style={styles.filterLabel}>Cidade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {cities.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.pill, city === c && styles.pillActive]}
                    onPress={() => setCity((prev) => (prev === c ? null : c))}
                  >
                    <Text style={[styles.pillText, city === c && styles.pillTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
            ) : units.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma unidade encontrada para esse filtro.</Text>
            ) : (
              units.map((unit) => {
                const attended = attendedIds.includes(unit.id);
                const isAdding = addingId === unit.id;
                return (
                  <View key={unit.id} style={styles.unitRow}>
                    <View style={styles.unitIcon}>
                      <Building2 size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unitName}>{unit.name}</Text>
                      <Text style={styles.unitMeta}>
                        {unit.city} · {unit.state}
                      </Text>
                    </View>
                    {attended ? (
                      <View style={styles.attendedBadge}>
                        <Check size={14} color={colors.primaryDark} />
                        <Text style={styles.attendedText}>Atendida</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.addButton}
                        onPress={() => handleAdd(unit.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Plus size={14} color={colors.primary} />
                            <Text style={styles.addButtonText}>Adicionar</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...(StyleSheet.absoluteFill as object), backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    maxHeight: '85%',
    ...shadows.card,
  },
  dragHandleContainer: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  dragHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: radius.full },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2 },
  closeButton: { padding: spacing.xs },
  filterLabel: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  filterRow: { marginBottom: spacing.md },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.small, color: colors.textSecondary, fontWeight: 'bold' },
  pillTextActive: { color: colors.white },
  list: { marginTop: spacing.sm },
  emptyText: { ...typography.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  unitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  unitName: { ...typography.bodyBold, color: colors.textPrimary },
  unitMeta: { ...typography.small, color: colors.textSecondary },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  addButtonText: { ...typography.small, color: colors.primary, fontWeight: 'bold' },
  attendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  attendedText: { ...typography.small, color: colors.primaryDark, fontWeight: 'bold' },
});
