import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProgressBar } from '../../components/ProgressBar';
import { colors } from '../../theme';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type RouteProps = RouteProp<AuthStackParamList, 'ResetPassword'>;

function getPasswordStrength(password: string): { progress: number; label: string; color: string } {
  if (!password) return { progress: 0, label: '', color: '' };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 12;

  if (password.length < 8) return { progress: 0.25, label: 'Fraca', color: '#E74C3C' };

  const score = [hasLetter, hasNumber, hasSpecial, isLong].filter(Boolean).length;

  if (score <= 2) return { progress: 0.5, label: 'Razoável', color: '#E67E22' };
  if (score === 3) return { progress: 0.75, label: 'Boa', color: '#F1C40F' };
  return { progress: 1, label: 'Forte', color: '#27AE60' };
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { token } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const resetPassword = useAuthStore((state) => state.resetPassword);

  const strength = getPasswordStrength(newPassword);

  const handleReset = async () => {
    setErrorMessage('');
    setConfirmError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage('Preencha os dois campos de senha.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigation.navigate('Login');
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 400 || status === 404) {
        setErrorMessage('Link inválido ou expirado. Solicite um novo link de recuperação.');
      } else if (status === 422) {
        setErrorMessage('Verifique o formato da senha informada.');
      } else if (status === 500) {
        setErrorMessage('Erro no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Não foi possível redefinir a senha. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} bg="$white" px="$6" py="$10">
        <Pressable
          onPress={() => navigation.goBack()}
          mb="$8"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>

        <VStack space="xs" mb="$8">
          <Text color="$black" fontSize="$2xl" fontWeight="$bold">
            Redefinir senha 🔑
          </Text>
          <Text color="$textLight500" fontSize="$md" mt="$1">
            Crie uma nova senha para acessar sua conta.
          </Text>
        </VStack>

        {errorMessage !== '' && (
          <Box bg="$red50" borderRadius="$lg" p="$3" mb="$4" borderWidth={1} borderColor="$red300">
            <Text color="$red700" fontSize="$sm" fontWeight="$medium">
              {errorMessage}
            </Text>
          </Box>
        )}

        <VStack space="xl">
          <VStack space="xs">
            <Box>
              <Input
                label="Nova senha"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrorMessage('');
                }}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity
                onPress={() => setShowNew((v) => !v)}
                style={{ position: 'absolute', right: 16, top: 20 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showNew ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </Box>

            {newPassword.length > 0 && (
              <VStack space="xs" mt="$1">
                <ProgressBar progress={strength.progress} />
                <Text fontSize="$xs" color={strength.color} fontWeight="$medium">
                  Força da senha: {strength.label}
                </Text>
              </VStack>
            )}
          </VStack>

          <Box>
            <Input
              label="Confirmar nova senha"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmError('');
              }}
              secureTextEntry={!showConfirm}
              error={!!confirmError}
              helperText={confirmError}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              style={{ position: 'absolute', right: 16, top: 20 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showConfirm ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </Box>

          <Button
            title={isLoading ? 'Salvando...' : 'Redefinir senha'}
            onPress={handleReset}
            variant="primary"
            loading={isLoading}
            style={{ marginTop: 8 }}
          />
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
}
