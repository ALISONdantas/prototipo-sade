import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppStack';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProgressBar } from '../../components/ProgressBar';
import { colors } from '../../theme';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'ChangePassword'>;

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

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordHints, setPasswordHints] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const changePassword = useAuthStore((state) => state.changePassword);

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    setErrorMessage('');
    setCurrentPasswordError('');
    setPasswordError('');
    setPasswordHints([]);
    setConfirmError('');
    setSuccessMessage('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('As senhas não coincidem.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const status = error.response?.status;
      const body = error.response?.data;

      if (status === 400 || status === 401) {
        setCurrentPasswordError(body?.message || 'Senha atual incorreta.');
      } else if (status === 422) {
        const detail = body?.detail;
        const field = body?.details?.field;

        if (Array.isArray(detail) && detail.length > 0) {
          detail.forEach((item: { loc?: string[]; msg?: string }) => {
            const fieldName = item.loc?.[item.loc.length - 1];
            if (fieldName === 'current_password') {
              setCurrentPasswordError(item.msg || 'Senha atual incorreta.');
            } else {
              setPasswordError(item.msg || 'Valor inválido.');
            }
          });
        } else if (field === 'current_password') {
          setCurrentPasswordError(body?.message || 'Senha atual incorreta.');
        } else if (field === 'password' || field === 'new_password') {
          setPasswordError(body?.message || 'Senha não atende aos requisitos de segurança.');
          setPasswordHints(Array.isArray(body?.details?.hints) ? body.details.hints : []);
        } else {
          setErrorMessage(body?.message || 'Verifique o formato dos dados preenchidos.');
        }
      } else if (status === 500) {
        setErrorMessage('Erro no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Não foi possível alterar a senha. Verifique sua conexão.');
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
            Alterar senha 🔒
          </Text>
          <Text color="$textLight500" fontSize="$md" mt="$1">
            Informe sua senha atual e escolha uma nova senha.
          </Text>
        </VStack>

        {errorMessage !== '' && (
          <Box bg="$red50" borderRadius="$lg" p="$3" mb="$4" borderWidth={1} borderColor="$red300">
            <Text color="$red700" fontSize="$sm" fontWeight="$medium">
              {errorMessage}
            </Text>
          </Box>
        )}

        {successMessage !== '' && (
          <Box
            bg="$green50"
            borderRadius="$lg"
            p="$3"
            mb="$4"
            borderWidth={1}
            borderColor="$green300"
          >
            <Text color="$green700" fontSize="$sm" fontWeight="$medium">
              {successMessage}
            </Text>
          </Box>
        )}

        <VStack space="xl">
          <Box>
            <Input
              label="Senha atual"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setCurrentPasswordError('');
              }}
              secureTextEntry={!showCurrent}
              error={!!currentPasswordError}
              helperText={currentPasswordError}
            />
            <TouchableOpacity
              onPress={() => setShowCurrent((v) => !v)}
              style={{ position: 'absolute', right: 16, top: 20 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showCurrent ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </Box>

          <VStack space="xs">
            <Box>
              <Input
                label="Nova senha"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordError('');
                  setPasswordHints([]);
                }}
                secureTextEntry={!showNew}
                error={!!passwordError}
                helperText={
                  passwordHints.length > 0
                    ? [passwordError, ...passwordHints.map((hint) => `• ${hint}`)].join('\n')
                    : passwordError
                }
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
                <ProgressBar progress={strength.progress} color={strength.color} />
                <Text fontSize="$xs" color={strength.color} fontWeight="$medium">
                  Força da senha: {strength.label}
                </Text>
              </VStack>
            )}
          </VStack>

          <Box>
            <Input
              label="Confirmar nova senha"
              placeholder="Digite a nova senha novamente"
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
            title={isLoading ? 'Salvando...' : 'Alterar senha'}
            onPress={handleChangePassword}
            variant="primary"
            loading={isLoading}
            style={{ marginTop: 8 }}
          />
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
}
