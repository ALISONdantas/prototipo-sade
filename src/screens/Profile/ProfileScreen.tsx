import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable, Alert, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, AvatarFallbackText } from '@gluestack-ui/themed';
import { ChevronRight, LogOut, KeyRound, Pencil } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { AppStackParamList } from '../../navigation/AppStack';
import { Input, Button } from '../../components';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

function maskCpf(cpf?: string): string {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return 'Não informado';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function formatPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return 'Não informado';
}

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, updateProfile } = useAuthStore();

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Usuário';
  const fullName = user?.full_name || 'Usuário Não Identificado';
  const email = user?.email || 'N/A';
  const cpf = maskCpf(user?.cpf);
  const phone = formatPhone(user?.phone);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(fullName);
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Tem certeza que deseja sair do aplicativo?');
      if (confirm) {
        logout();
      }
    } else {
      Alert.alert('Sair da Conta', 'Tem certeza que deseja sair do aplicativo?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleStartEdit = () => {
    setEditName(fullName);
    setEditPhone(user?.phone || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName: editName, phone: editPhone });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.profileCard}>
          <Avatar bg={colors.primaryLight} size="2xl" mb="$4">
            <AvatarFallbackText color={colors.primary} fontWeight="$bold">
              {firstName.substring(0, 2).toUpperCase()}
            </AvatarFallbackText>
          </Avatar>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            {!isEditing && (
              <Pressable
                style={styles.editButton}
                onPress={handleStartEdit}
                accessibilityLabel="Editar dados pessoais"
              >
                <Pencil color={colors.primary} size={16} />
                <Text style={styles.editButtonText}>Editar</Text>
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <View style={{ gap: spacing.md }}>
              <Input label="Nome completo" value={editName} onChangeText={setEditName} autoCapitalize="words" />
              <Input
                label="Telefone"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValue}>{cpf}</Text>
              </View>

              <View style={styles.editActionsRow}>
                <Button
                  title="Cancelar"
                  variant="ghost"
                  onPress={handleCancelEdit}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  title={saving ? 'Salvando...' : 'Salvar'}
                  onPress={handleSaveEdit}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nome completo</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValue}>{cpf}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{phone}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>

          <Pressable style={styles.actionRow} onPress={handlePasswordChange}>
            <View style={styles.actionIconTitle}>
              <View style={styles.iconContainer}>
                <KeyRound color={colors.primary} size={20} />
              </View>
              <Text style={styles.actionText}>Alterar Senha</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
          </Pressable>
        </View>

        <View style={[styles.section, { borderBottomWidth: 0, marginTop: spacing.xl }]}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color={colors.negative} size={20} />
            <Text style={styles.logoutText}>Sair do Aplicativo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h3 },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  profileName: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  profileEmail: { ...typography.body, color: colors.textSecondary },
  section: {
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.xs },
  editButtonText: { ...typography.small, color: colors.primary, fontWeight: 'bold' },
  infoRow: {
    flexDirection: 'column',
    marginBottom: spacing.md,
  },
  infoLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 2 },
  infoValue: { ...typography.body, color: colors.textPrimary },
  editActionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actionIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionText: { ...typography.bodyBold, color: colors.textPrimary },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  logoutText: { ...typography.bodyBold, color: colors.negative, marginLeft: spacing.sm },
});
