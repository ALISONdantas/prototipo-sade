import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Box, Text, VStack, HStack, Pressable } from '@gluestack-ui/themed';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore, RegisterData } from '../../store/authStore';
import { Input, Button, ProgressBar, ConsentCheckbox, ConsentTermsModal } from '../../components';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RouteProps = RouteProp<AuthStackParamList, 'Register'>;

const profileLabels: Record<string, string> = {
  PATIENT: 'Usuário',
  PROFESSIONAL: 'Profissional de Saúde',
  INSTITUTION: 'Instituição',
};

const genderOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Feminino', value: 'F' },
  { label: 'Outro', value: 'O' },
];

const institutionTypeOptions = [
  { label: 'Escola', value: 'school' },
  { label: 'Clínica', value: 'clinic' },
  { label: 'Centro de Saúde', value: 'health_center' },
];

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { role } = route.params;
  const isInstitution = role === 'INSTITUTION';

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [conselho, setConselho] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordHints, setPasswordHints] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  const register = useAuthStore((state) => state.register);

  const professionalAnim = useRef(new Animated.Value(role === 'PROFESSIONAL' ? 1 : 0)).current;
  const institutionAnim = useRef(new Animated.Value(role === 'INSTITUTION' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(professionalAnim, {
      toValue: role === 'PROFESSIONAL' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    Animated.timing(institutionAnim, {
      toValue: role === 'INSTITUTION' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [role]);

  const getPasswordStrength = (pwd: string): { progress: number; color: string; label: string } => {
    if (!pwd) return { progress: 0, color: '#E53E3E', label: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 10) score++;
    const map = [
      { progress: 0.33, color: '#E53E3E', label: 'Fraca' },
      { progress: 0.66, color: '#D69E2E', label: 'Média' },
      { progress: 1, color: '#38A169', label: 'Forte' },
    ];
    return map[score - 1] ?? { progress: 0.1, color: '#E53E3E', label: 'Muito fraca' };
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setFullNameError('');
    setEmailError('');
    setCpfError('');
    setPhoneError('');
    setPasswordError('');
    setPasswordHints([]);
    setConfirmPasswordError('');
    setBirthDateError('');
    setGenderError('');
    setTermsError('');

    // Protótipo: o checkbox de consentimento fica visível (RNF10), mas não
    // bloqueia a navegação — o objetivo aqui é validar as telas livremente.
    // Instituição não é pessoa física: sem CPF, nascimento ou gênero — em
    // troca, pede os dados da própria instituição (CNPJ, tipo, endereço).
    const baseFieldsMissing =
      !fullName.trim() || !phone.trim() || !email.trim() || !password.trim() || !confirmPassword.trim();
    const personFieldsMissing = !isInstitution && (!cpf.trim() || !birthDate.trim() || !gender);
    const institutionFieldsMissing =
      isInstitution && (!cnpj.trim() || !institutionName.trim() || !institutionType || !institutionAddress.trim());

    if (baseFieldsMissing || personFieldsMissing || institutionFieldsMissing) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.');
      return;
    }

    if (!isInstitution && cpf.replace(/\D/g, '').length < 11) {
      setCpfError('O CPF deve ter 11 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const data: RegisterData = {
        fullName,
        phone,
        email,
        password,
        role,
        termsAccepted,
        ...(!isInstitution && { cpf, birthDate, gender }),
        ...(role === 'PROFESSIONAL' && { crm, especialidade, conselho }),
        ...(isInstitution && { cnpj, institutionName, institutionType, institutionAddress }),
      };
      await register(data);
      navigation.navigate('EmailConfirmation', { email, type: 'register' });
    } catch (error: any) {
      const status = error.response?.status;
      const body = error.response?.data;

      // Aplica a mensagem de erro no campo correspondente, com fallback genérico.
      const applyFieldError = (field: string | undefined, message: string) => {
        switch (field) {
          case 'email':
            setEmailError(message);
            break;
          case 'cpf':
            setCpfError(message);
            break;
          case 'phone':
            setPhoneError(message);
            break;
          case 'birth_date':
            setBirthDateError(message);
            break;
          case 'gender':
            setGenderError(message);
            break;
          case 'password':
            setPasswordError(message);
            break;
          case 'first_name':
          case 'last_name':
            setFullNameError(message);
            break;
          default:
            setErrorMessage(message);
        }
      };

      if (status === 409) {
        // Formato do backend: { error, message, details: { field } }
        const field = body?.details?.field;
        const messages: Record<string, string> = {
          email: 'Este e-mail já está cadastrado.',
          cpf: 'Este CPF já está cadastrado.',
        };
        applyFieldError(field, messages[field] || body?.message || 'Dados já cadastrados.');
      } else if (status === 400 || status === 422) {
        // Duas formas possíveis de erro 422:
        // (a) validação nativa do Pydantic/FastAPI: { detail: [{ loc, msg, type }] }
        // (b) exceção de domínio customizada: { error, message, details: { field, hints? } }
        const detail = body?.detail;
        const field = body?.details?.field;

        if (Array.isArray(detail) && detail.length > 0) {
          detail.forEach((item: { loc?: string[]; msg?: string }) => {
            const fieldName = item.loc?.[item.loc.length - 1];
            applyFieldError(fieldName, item.msg || 'Valor inválido.');
          });
        } else if (field === 'password') {
          // Senha fraca: exibe as dicas (`hints`) retornadas pelo back, quando existirem.
          setPasswordError(body?.message || 'Senha não atende aos requisitos de segurança.');
          setPasswordHints(Array.isArray(body?.details?.hints) ? body.details.hints : []);
        } else if (field) {
          applyFieldError(field, body?.message || 'Valor inválido.');
        } else {
          setErrorMessage(body?.message || 'Verifique o formato dos dados preenchidos.');
        }
      } else if (status === 500) {
        setErrorMessage('Erro no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  };

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} bg="$white">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Box px="$6" pt="$12">
            {/* Header */}
            <HStack alignItems="center" justifyContent="space-between" mb="$8">
              <HStack alignItems="center">
                <Pressable p="$2" ml="-$2" onPress={() => navigation.goBack()}>
                  <ArrowLeft color="#1C2E2A" size={24} />
                </Pressable>
                <Text color="$black" fontSize="$xl" fontWeight="$bold" ml="$4">
                  Criar conta
                </Text>
              </HStack>
              {/* Badge simulado */}
              <Box bg="$green100" px="$3" py="$1" borderRadius="$full">
                <Text color="#2A5D44" fontSize="$xs" fontWeight="$bold">
                  {profileLabels[role]}
                </Text>
              </Box>
            </HStack>

            {/* Título */}
            <VStack space="xs" mb="$8">
              <Text color="$black" fontSize="$2xl" fontWeight="$bold">
                Seus dados
              </Text>
              <Text color="$textLight500" fontSize="$md">
                Preencha as informações abaixo para criar sua conta.
              </Text>
            </VStack>

            <VStack space="xl">
              {/* Mensagem de erro global */}
              {errorMessage !== '' && (
                <Box bg="$red50" borderRadius="$lg" p="$3" borderWidth={1} borderColor="$red300">
                  <Text color="$red700" fontSize="$sm" fontWeight="$medium">
                    {errorMessage}
                  </Text>
                </Box>
              )}

              <Input
                label={isInstitution ? 'Nome do responsável' : 'Nome completo'}
                placeholder="Maria Silva"
                value={fullName}
                onChangeText={(text: string) => {
                  setFullName(text);
                  setFullNameError('');
                }}
                autoCapitalize="words"
                error={!!fullNameError}
                helperText={fullNameError}
              />

              {!isInstitution && (
                <Input
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChangeText={(text: string) => {
                    setCpf(formatCpf(text));
                    setCpfError('');
                  }}
                  keyboardType="numeric"
                  error={!!cpfError}
                  helperText={cpfError}
                />
              )}

              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={phone}
                onChangeText={(text: string) => {
                  setPhone(formatPhone(text));
                  setPhoneError('');
                }}
                keyboardType="phone-pad"
                error={!!phoneError}
                helperText={phoneError}
              />

              <Input
                label="E-mail"
                placeholder="usuario@email.com"
                value={email}
                onChangeText={(text: string) => {
                  setEmail(text);
                  setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!emailError}
                helperText={emailError}
              />

              <Input
                label="Senha"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={(text: string) => {
                  setPassword(text);
                  setPasswordError('');
                  setPasswordHints([]);
                }}
                secureTextEntry
                error={!!passwordError}
                helperText={
                  passwordHints.length > 0
                    ? [passwordError, ...passwordHints.map((hint) => `• ${hint}`)].join('\n')
                    : passwordError
                }
              />

              {password.length > 0 && (
                <VStack space="xs">
                  <ProgressBar
                    progress={getPasswordStrength(password).progress}
                    color={getPasswordStrength(password).color}
                  />
                  <Text fontSize="$xs" color={getPasswordStrength(password).color}>
                    Força da senha: {getPasswordStrength(password).label}
                  </Text>
                </VStack>
              )}

              <Input
                label="Confirmação de Senha"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChangeText={(text: string) => {
                  setConfirmPassword(text);
                  if (text.length > 0 && password !== text) {
                    setConfirmPasswordError('As senhas não coincidem.');
                  } else {
                    setConfirmPasswordError('');
                  }
                }}
                secureTextEntry
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
              />

              {!isInstitution && (
                <Input
                  label="Data de nascimento"
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChangeText={(text: string) => {
                    setBirthDate(formatBirthDate(text));
                    setBirthDateError('');
                  }}
                  keyboardType="numeric"
                  error={!!birthDateError}
                  helperText={birthDateError}
                />
              )}

              {/* Gênero — não se aplica a Instituição (não é pessoa física) */}
              {!isInstitution && (
                <VStack space="md">
                  <Text color="$black" fontWeight="$bold">
                    Gênero
                  </Text>
                  <HStack
                    space="md"
                    flexWrap="wrap"
                    borderWidth={genderError ? 1 : 0}
                    borderColor="$red600"
                    borderRadius="$md"
                    p={genderError ? '$2' : 0}
                  >
                    {genderOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        borderWidth={1}
                        borderColor={gender === option.value ? '#2A5D44' : '$borderLight300'}
                        bg={gender === option.value ? '$green100' : '$white'}
                        borderRadius="$md"
                        px="$4"
                        py="$2"
                        onPress={() => {
                          setGender(option.value);
                          setGenderError('');
                        }}
                      >
                        <Text
                          color={gender === option.value ? '#2A5D44' : '$textLight500'}
                          fontWeight={gender === option.value ? '$bold' : '$normal'}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </HStack>
                  {genderError !== '' && (
                    <Text color="$red600" fontSize="$xs">
                      {genderError}
                    </Text>
                  )}
                </VStack>
              )}

              <Animated.View
                style={{
                  maxHeight: professionalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                  overflow: 'hidden',
                }}
              >
                <VStack space="xl" pb="$1">
                  <Input
                    label="CRM"
                    placeholder="CRM/UF 000000"
                    value={crm}
                    onChangeText={setCrm}
                    autoCapitalize="characters"
                  />
                  <Input
                    label="Especialidade"
                    placeholder="Ex: Cardiologia, Fisioterapia"
                    value={especialidade}
                    onChangeText={setEspecialidade}
                    autoCapitalize="words"
                  />
                  <Input
                    label="Conselho Profissional"
                    placeholder="Ex: CFM, CFF, CREFITO"
                    value={conselho}
                    onChangeText={setConselho}
                    autoCapitalize="characters"
                  />
                </VStack>
              </Animated.View>

              <Animated.View
                style={{
                  maxHeight: institutionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 750],
                  }),
                  overflow: 'hidden',
                }}
              >
                <VStack space="xl" pb="$1">
                  <Input
                    label="CNPJ"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChangeText={(text: string) => setCnpj(formatCnpj(text))}
                    keyboardType="numeric"
                  />
                  <Input
                    label="Nome da Instituição"
                    placeholder="Nome da clínica ou escola"
                    value={institutionName}
                    onChangeText={setInstitutionName}
                    autoCapitalize="words"
                  />

                  <VStack space="md">
                    <Text color="$black" fontWeight="$bold">
                      Tipo de Instituição
                    </Text>
                    <HStack space="md" flexWrap="wrap">
                      {institutionTypeOptions.map((option) => (
                        <Pressable
                          key={option.value}
                          borderWidth={1}
                          borderColor={institutionType === option.value ? '#2A5D44' : '$borderLight300'}
                          bg={institutionType === option.value ? '$green100' : '$white'}
                          borderRadius="$md"
                          px="$4"
                          py="$2"
                          onPress={() => setInstitutionType(option.value)}
                        >
                          <Text
                            color={institutionType === option.value ? '#2A5D44' : '$textLight500'}
                            fontWeight={institutionType === option.value ? '$bold' : '$normal'}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </HStack>
                  </VStack>

                  <Input
                    label="Endereço"
                    placeholder="Rua, número — Bairro, Cidade"
                    value={institutionAddress}
                    onChangeText={setInstitutionAddress}
                    autoCapitalize="words"
                  />
                </VStack>
              </Animated.View>

              <ConsentCheckbox
                checked={termsAccepted}
                onToggle={() => {
                  setTermsAccepted((prev) => !prev);
                  setTermsError('');
                }}
                onReadTerms={() => setShowTermsModal(true)}
                error={termsError}
              />

              <HStack justifyContent="center" mt="$4" mb="$8">
                <Text color="$textLight500" fontSize="$sm">
                  Já tem conta?{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text color="#2A5D44" fontWeight="$bold" fontSize="$sm">
                    Entrar
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </Box>
        </ScrollView>
        <Box p="$6" bg="$white" borderTopWidth={1} borderColor="$borderLight200">
          <Button
            title="Criar conta"
            onPress={handleRegister}
            disabled={isLoading}
            loading={isLoading}
          />
        </Box>
      </Box>

      <ConsentTermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setTermsError('');
          setShowTermsModal(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}
