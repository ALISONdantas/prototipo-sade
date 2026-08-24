import React, { useState, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { Box, Text, VStack, KeyboardAvoidingView } from '@gluestack-ui/themed';
import { Mail, CheckCircle2 } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Button } from '../../components';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'EmailConfirmation'>;
type RouteProps = RouteProp<AuthStackParamList, 'EmailConfirmation'>;

export default function EmailConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { email, type } = route.params;

  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [bounceAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim]);

  const handleResend = () => {
    if (resendStatus !== 'idle') return;

    setResendStatus('loading');

    // Simula a chamada na API de reenvio com 1.5s de delay
    setTimeout(() => {
      setResendStatus('success');

      // Restaura o botão após 2s de sucesso
      setTimeout(() => {
        setResendStatus('idle');
      }, 2000);
    }, 1500);
  };

  const isRegister = type === 'register';

  const title = isRegister ? 'Verifique seu e-mail' : 'Recuperação de senha';

  const description = isRegister
    ? 'Enviamos um link de confirmação para o endereço de e-mail abaixo. Por favor, verifique sua caixa de entrada.'
    : 'Enviamos as instruções de recuperação para o endereço de e-mail abaixo.';

  const primaryActionText = isRegister ? 'Já confirmei' : 'Voltar para o Login';
  const secondaryActionText = isRegister ? 'Reenviar e-mail' : 'Reenviar link';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} bg="$white" px="$6" justifyContent="center">
        <VStack space="2xl" alignItems="center" mt="$12">
          {/* Ícone Animado */}
          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <Box bg="$green100" p="$6" borderRadius="$full">
              <Mail color="#2A5D44" size={48} strokeWidth={1.5} />
            </Box>
          </Animated.View>

          {/* Textos */}
          <VStack space="sm" alignItems="center">
            <Text color="$black" fontSize="$3xl" fontWeight="$bold" textAlign="center">
              {title}
            </Text>
            <Text color="$textLight500" fontSize="$md" textAlign="center" lineHeight="$xl">
              {description}
            </Text>
          </VStack>

          {/* Email Box */}
          <Box
            bg="$backgroundLight50"
            px="$6"
            py="$4"
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$borderLight200"
            w="$full"
          >
            <Text color="$black" fontWeight="$bold" fontSize="$lg" textAlign="center">
              {email}
            </Text>
          </Box>
        </VStack>

        {/* Botões fixos na parte inferior */}
        <VStack space="md" mt="auto" mb="$12">
          <Button
            title={primaryActionText}
            variant="primary"
            onPress={() => navigation.navigate('Login')}
          />

          {resendStatus === 'success' ? (
            <Box flexDirection="row" alignItems="center" justifyContent="center" h={52}>
              <CheckCircle2 color="#2A5D44" size={20} />
              <Text color="#2A5D44" fontWeight="$bold" ml="$2">
                E-mail reenviado!
              </Text>
            </Box>
          ) : (
            <Button
              title={secondaryActionText}
              variant="ghost"
              onPress={handleResend}
              loading={resendStatus === 'loading'}
            />
          )}
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
}
