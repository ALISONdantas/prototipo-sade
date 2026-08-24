import React, { useState } from 'react';
import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors } from '../../theme';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const handleSendLink = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('O e-mail informado não parece ser válido.');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email.trim());
      // A API retorna 200 sempre ("Se o email estiver cadastrado, você receberá instruções...")
      // Passamos para a próxima tela repassando o email.
      navigation.navigate('EmailConfirmation', {
        email: email.trim(),
        type: 'forgot_password',
      });
    } catch (error: any) {
      if (error.response?.status === 422) {
        setErrorMessage('Verifique o formato do e-mail informado.');
      } else if (error.response?.status === 500) {
        setErrorMessage('Erro no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Ocorreu um erro ao tentar recuperar a senha. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$white" px="$6" py="$10">
      {/* Header com Botão Voltar */}
      <Pressable
        onPress={() => navigation.goBack()}
        mb="$8"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft color={colors.primary} size={24} />
      </Pressable>

      {/* Título e Descrição */}
      <VStack space="xs" mb="$8">
        <Text color="$black" fontSize="$2xl" fontWeight="$bold">
          Esqueci minha senha 🔒
        </Text>
        <Text color="$textLight500" fontSize="$md" mt="$1">
          Informe seu e-mail cadastrado. Se ele existir na nossa base, enviaremos um link para você
          redefinir sua senha.
        </Text>
      </VStack>

      {/* Mensagem de Erro */}
      {errorMessage !== '' && (
        <Box bg="$red50" borderRadius="$lg" p="$3" mb="$4" borderWidth={1} borderColor="$red300">
          <Text color="$red700" fontSize="$sm" fontWeight="$medium">
            {errorMessage}
          </Text>
        </Box>
      )}

      {/* Formulário */}
      <VStack space="xl">
        <Input
          label="E-mail"
          placeholder="usuario@sade.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMessage('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"

        />

        <Button
          title={isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
          onPress={handleSendLink}
          variant="primary"
          loading={isLoading}
          style={{ marginTop: 16 }}
        />
      </VStack>
    </Box>
  );
}
