import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Pressable,
  Avatar,
  AvatarFallbackText,
} from '@gluestack-ui/themed';
import { User, Plus, FileText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> & NativeStackNavigationProp<AppStackParamList>;

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Box px="$6" pt="$12">
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center" mb="$6">
          <VStack>
            <Text color={colors.textPrimary} fontSize="$2xl" fontWeight="$bold">
              Olá, {firstName} 👋
            </Text>
            <Text color={colors.textSecondary} fontSize="$sm">
              {user?.email || ''}
            </Text>
          </VStack>

          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.navigate('ProfileTab')} hitSlop={10}>
              <Avatar bg={colors.primaryLight} size="md">
                <AvatarFallbackText color={colors.primary} fontWeight="$bold">
                  {firstName.substring(0, 2).toUpperCase()}
                </AvatarFallbackText>
              </Avatar>
            </Pressable>
          </HStack>
        </HStack>

        {/* Big Card */}
        <Pressable
          onPress={() => navigation.navigate('ExamFlow', { screen: 'SelectTestee' })}
        >
          <Box bg={colors.primary} borderRadius="$2xl" p="$6" alignItems="center" mb="$8">
            <User size={40} color={colors.white} />
            <Text color={colors.white} fontSize="$xl" fontWeight="$bold" mt="$4">
              Iniciar Novo Exame
            </Text>
            <Text color={colors.primaryLight} fontSize="$sm" mt="$1">
              Teste de Adams em 3 minutos
            </Text>
          </Box>
        </Pressable>

        {/* Dependentes */}
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold">
            Dependentes
          </Text>
          <Pressable onPress={() => navigation.navigate('DependentsTab')} hitSlop={10}>
            <Text color={colors.primary} fontSize="$sm" fontWeight="$bold">
              Ver todos
            </Text>
          </Pressable>
        </HStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$8">
          <HStack space="lg" alignItems="center">
            {/* Botão Adicionar */}
            <Pressable onPress={() => navigation.navigate('DependentsTab')} hitSlop={10}>
              <VStack alignItems="center" space="sm">
                <Box
                  w={56}
                  h={56}
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor={colors.primary}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Plus size={24} color={colors.primary} />
                </Box>
                <Text color={colors.textSecondary} fontSize="$xs">
                  Adicionar
                </Text>
              </VStack>
            </Pressable>
          </HStack>
        </ScrollView>

        {/* Últimos Exames */}
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold">
            Últimos Exames
          </Text>
          <Pressable>
            <Text color={colors.primary} fontSize="$sm" fontWeight="$bold">
              Ver todos
            </Text>
          </Pressable>
        </HStack>

        <VStack space="md">
          {/* Exame 1 */}
          <Box borderWidth={1} borderColor={colors.border} borderRadius="$xl" p="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space="md" alignItems="center">
                <Box bg={colors.primaryLight} p="$3" borderRadius="$lg">
                  <FileText size={24} color={colors.primary} />
                </Box>
                <VStack>
                  <Text color={colors.textPrimary} fontWeight="$bold">
                    Maria Silva
                  </Text>
                  <Text color={colors.textSecondary} fontSize="$sm">
                    10 Mai. 2026
                  </Text>
                </VStack>
              </HStack>
              <Text color={colors.negative} fontWeight="$bold">
                Negativo
              </Text>
            </HStack>
          </Box>

          {/* Exame 2 */}
          <Box borderWidth={1} borderColor={colors.border} borderRadius="$xl" p="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space="md" alignItems="center">
                <Box bg={colors.primaryLight} p="$3" borderRadius="$lg">
                  <FileText size={24} color={colors.primary} />
                </Box>
                <VStack>
                  <Text color={colors.textPrimary} fontWeight="$bold">
                    João Souza
                  </Text>
                  <Text color={colors.textSecondary} fontSize="$sm">
                    15 Abr. 2026
                  </Text>
                </VStack>
              </HStack>
              <Text color={colors.warning} fontWeight="$bold">
                Atenção
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
}
