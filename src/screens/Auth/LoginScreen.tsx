import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { mockLogin } from '../../services/mockAuth';
import { Button } from '../../components/Button';
import { colors } from '../../theme';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    // Limpa erro anterior
    setErrorMessage('');

    // Validação básica local
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      // POST /api/v1/auth/login → { email, password }
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { access_token } = response.data;

      // Salva token no SecureStore e busca dados do usuário (GET /auth/me)
      await login(access_token);
      // O RootNavigator vai trocar automaticamente para o AppStack
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 404) {
          setErrorMessage('E-mail ou senha incorretos.');
        } else if (status === 422) {
          setErrorMessage('Verifique o formato do e-mail e da senha.');
        } else if (status === 500) {
          setErrorMessage('Erro no servidor. Tente novamente mais tarde.');
        } else {
          setErrorMessage('Erro inesperado. Tente novamente.');
        }
      } else if (error.request) {
        // Sem resposta do servidor (ex.: build estático sem backend por trás,
        // como o protótipo publicado no GitHub Pages) — tenta as contas de
        // demonstração mockadas antes de desistir.
        const mock = mockLogin(email, password);
        if (mock) {
          await login(mock.access_token);
          return;
        }
        setErrorMessage('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        setErrorMessage('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$white" px="$6" py="$10">
      {/* Cabeçalho Verde / Banner */}
      <Box
        bg="$green100"
        h={100}
        w="100%"
        borderRadius="$xl"
        justifyContent="center"
        alignItems="center"
        mb="$8"
        mt="$4"
      >
        <User size={32} color={colors.primary} />
      </Box>

      {/* Título */}
      <VStack space="xs" mb="$8">
        <Text color="$black" fontSize="$2xl" fontWeight="$bold">
          Bem-vindo de volta 👋
        </Text>
        <Text color="$textLight500" fontSize="$md">
          Acesse sua conta para iniciar um novo exame.
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
        <Box>
          <Text
            color="$textLight600"
            fontSize="$xs"
            ml="$2"
            mb="-$2"
            zIndex={1}
            bg="$white"
            alignSelf="flex-start"
            px="$1"
          >
            E-mail
          </Text>
          <Input
            variant="outline"
            size="lg"
            borderRadius="$lg"
            borderColor={errorMessage ? '$red400' : '$borderLight300'}
            $focus-borderColor={colors.primary}
          >
            <InputSlot pl="$3">
              <InputIcon as={Mail} color="$textLight500" />
            </InputSlot>
            <InputField
              placeholder="usuario@sade.com"
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Input>
        </Box>

        <Box>
          <Text
            color="$textLight600"
            fontSize="$xs"
            ml="$2"
            mb="-$2"
            zIndex={1}
            bg="$white"
            alignSelf="flex-start"
            px="$1"
          >
            Senha
          </Text>
          <Input
            variant="outline"
            size="lg"
            borderRadius="$lg"
            borderColor={errorMessage ? '$red400' : '$borderLight300'}
            $focus-borderColor={colors.primary}
          >
            <InputSlot pl="$3">
              <InputIcon as={Lock} color="$textLight500" />
            </InputSlot>
            <InputField
              placeholder="••••••"
              value={password}
              onChangeText={(text: string) => {
                setPassword(text);
                setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
            />
            <InputSlot pr="$3" onPress={() => setShowPassword(!showPassword)}>
              <InputIcon as={showPassword ? Eye : EyeOff} color="$textLight500" />
            </InputSlot>
          </Input>
        </Box>

        <Pressable
          alignSelf="flex-end"
          onPress={() => navigation.navigate('ForgotPassword')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Esqueci a senha"
        >
          <Text color={colors.primary} fontWeight="$semibold" fontSize="$sm">
            Esqueci a senha
          </Text>
        </Pressable>

        <Button
          title={isLoading ? 'Entrando...' : 'Entrar'}
          onPress={handleLogin}
          variant="primary"
          loading={isLoading}
          style={{ marginTop: 16 }}
        />

        <HStack justifyContent="center" mt="$4">
          <Text color="$textLight500" fontSize="$sm">
            Ainda não tem conta?{' '}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('ProfileSelect')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Criar conta"
          >
            <Text color={colors.primary} fontWeight="$bold" fontSize="$sm">
              Criar conta
            </Text>
          </Pressable>
        </HStack>

        {/* [DEV] Atalho temporário para testar ResetPasswordScreen */}
        <Pressable
          mt="$6"
          alignSelf="center"
          onPress={() => navigation.navigate('ResetPassword', { token: 'token-de-teste-dev' })}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text color="$textLight400" fontSize="$xs">
            [DEV] Testar tela de redefinir senha
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
