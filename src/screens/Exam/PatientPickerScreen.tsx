import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, User, Plus } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { AddPatientBottomSheet } from '../../components/AddPatientBottomSheet';
import { searchPatients, Patient } from '../../services/patientsService';
import { ExamStackParamList } from '../../navigation/ExamStack';

type NavigationProp = NativeStackNavigationProp<ExamStackParamList, 'PatientPicker'>;

export default function PatientPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetOpenKey, setSheetOpenKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchPatients(query)
      .then((data) => {
        if (active) setPatients(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const handleSelect = (patient: Patient) => {
    navigation.navigate('HealthHistory', {
      patientId: patient.id,
      dependentName: patient.name,
      age: patient.age,
      sex: patient.sex,
    });
  };

  const handleAddPatient = () => {
    setSheetOpenKey((k) => k + 1);
    setSheetVisible(true);
  };

  const handleSheetSuccess = async (patientId: string) => {
    setSheetVisible(false);
    // Paciente novo: busca a lista atualizada e já segue direto para a
    // anamnese com ele selecionado, como no fluxo de "novo dependente".
    const data = await searchPatients('');
    setPatients(data);
    const created = data.find((p) => p.id === patientId);
    if (created) handleSelect(created);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecionar Paciente</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Input
          label="Buscar paciente"
          placeholder="Digite o nome do paciente"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.addPatientContainer}>
        <TouchableOpacity style={styles.addCard} onPress={handleAddPatient} activeOpacity={0.8}>
          <View style={styles.addIconContainer}>
            <Plus color={colors.primary} size={20} />
          </View>
          <Text style={styles.addText}>Cadastrar novo paciente</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : patients.length === 0 ? (
        <EmptyState
          title="Nenhum paciente encontrado"
          subtitle="Tente buscar por outro nome ou cadastre um paciente novo."
          icon={<User color={colors.primary} size={64} />}
        />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.patientCard} onPress={() => handleSelect(item)}>
              <View style={styles.avatar}>
                <User color={colors.primary} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientMeta}>
                  {item.age} anos · {item.unitName}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <AddPatientBottomSheet
        visible={sheetVisible}
        openKey={sheetOpenKey}
        onClose={() => setSheetVisible(false)}
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
  searchContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  addPatientContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing.sm,
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addText: { ...typography.bodyBold, color: colors.primary },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.lg, paddingTop: 0 },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  patientName: { ...typography.bodyBold, color: colors.textPrimary },
  patientMeta: { ...typography.small, color: colors.textSecondary },
});
