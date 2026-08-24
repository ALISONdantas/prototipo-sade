import React from 'react';
import { Box, Text, VStack, Pressable, HStack, ScrollView } from '@gluestack-ui/themed';
import { ArrowLeft, User, Stethoscope, Building2, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProfileSelect'>;

const profiles = [
  {
    role: 'PATIENT' as const,
    title: 'Usuário',
    description: 'Responsável por realizar os testes.',
    icon: User,
  },
  {
    role: 'PROFESSIONAL' as const,
    title: 'Profissional de Saúde',
    description: 'Médico especialista.',
    icon: Stethoscope,
  },
  {
    role: 'INSTITUTION' as const,
    title: 'Instituição',
    description: 'Instituição responsável por realizar e gerenciar os laudos.',
    icon: Building2,
  },
];

export default function ProfileSelectScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <Box flex={1} bg="$white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Box px="$6" pt="$12">
          <HStack alignItems="center" mb="$8">
            <Pressable
              p="$2"
              ml="-$2"
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <ArrowLeft color="#1C2E2A" size={24} />
            </Pressable>
            <Text color="$black" fontSize="$xl" fontWeight="$bold" ml="$4">
              Criar conta
            </Text>
          </HStack>

          <VStack space="xs" mb="$8">
            <Text color="$black" fontSize="$2xl" fontWeight="$bold">
              Qual é o seu perfil?
            </Text>
            <Text color="$textLight500" fontSize="$md">
              Escolha o perfil que melhor descreve você.
            </Text>
          </VStack>

          <VStack space="md">
            {profiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <Pressable
                  key={profile.role}
                  onPress={() => navigation.navigate('Register', { role: profile.role })}
                  borderWidth={1}
                  borderColor="$borderLight200"
                  borderRadius="$xl"
                  p="$5"
                  bg="$white"
                  $active-bg="$green50"
                  $active-borderColor="#2A5D44"
                >
                  <HStack alignItems="center" space="md">
                    <Box bg="$green100" p="$3" borderRadius="$lg">
                      <Icon size={24} color="#2A5D44" />
                    </Box>
                    <VStack flex={1} space="xs">
                      <Text color="$black" fontWeight="$bold" fontSize="$md">
                        {profile.title}
                      </Text>
                      <Text color="$textLight500" fontSize="$sm">
                        {profile.description}
                      </Text>
                    </VStack>
                    <ChevronRight size={20} color="#6B8A84" />
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
