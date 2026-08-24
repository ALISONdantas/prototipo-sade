import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { Box, Text, VStack, HStack, Pressable } from '@gluestack-ui/themed';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppStack';
import { colors } from '../../theme';
import { ErrorState, EmptyState } from '../../components';
import {
  getInstitutionAlerts,
  resolveInstitutionAlert,
  type InstitutionAlert,
} from '../../services/alertsService';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Alerts'>;

const RESULT_LABEL: Record<InstitutionAlert['result'], string> = {
  POSITIVE: 'Indícios Detectados',
  INCONCLUSIVE: 'Resultado Inconclusivo',
};

const RESULT_COLOR: Record<InstitutionAlert['result'], string> = {
  POSITIVE: colors.positive,
  INCONCLUSIVE: colors.warning,
};

function AlertCard({
  alert,
  onResolve,
  resolving,
}: {
  alert: InstitutionAlert;
  onResolve: () => void;
  resolving: boolean;
}) {
  const formattedDate = new Date(alert.examDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Box
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      p="$4"
      bg={colors.surface}
      mb="$3"
      opacity={alert.resolved ? 0.6 : 1}
    >
      <HStack justifyContent="space-between" alignItems="flex-start" mb="$2">
        <VStack flex={1}>
          <Text color={colors.textPrimary} fontWeight="$bold">
            {alert.patientName}
          </Text>
          <Text color={colors.textSecondary} fontSize="$sm">
            {alert.age} anos · {formattedDate}
          </Text>
        </VStack>
        <Box bg={`${RESULT_COLOR[alert.result]}20`} borderRadius="$full" px="$3" py="$1">
          <Text color={RESULT_COLOR[alert.result]} fontSize="$xs" fontWeight="$bold">
            {RESULT_LABEL[alert.result]}
          </Text>
        </Box>
      </HStack>

      {alert.resolved ? (
        <HStack alignItems="center" space="xs">
          <Check size={16} color={colors.negative} />
          <Text color={colors.negative} fontSize="$sm" fontWeight="$bold">
            Resolvido
          </Text>
        </HStack>
      ) : (
        <Pressable onPress={onResolve} disabled={resolving}>
          <HStack
            borderWidth={1}
            borderColor={colors.primary}
            borderRadius="$lg"
            py="$2"
            alignItems="center"
            justifyContent="center"
            space="xs"
            opacity={resolving ? 0.6 : 1}
          >
            {resolving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Check size={16} color={colors.primary} />
            )}
            <Text color={colors.primary} fontSize="$sm" fontWeight="$bold">
              {resolving ? 'Marcando...' : 'Marcar como resolvido'}
            </Text>
          </HStack>
        </Pressable>
      )}
    </Box>
  );
}

export default function AlertsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [alerts, setAlerts] = useState<InstitutionAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getInstitutionAlerts()
      .then(setAlerts)
      .catch(() => setError('Não foi possível carregar os alertas.'))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [fetchAlerts]),
  );

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await resolveInstitutionAlert(alertId);
      setAlerts((current) =>
        current.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert)),
      );
    } catch (err) {
      console.error('Erro ao marcar alerta como resolvido:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Box flex={1} bg={colors.background} pt="$12" px="$6">
      <HStack alignItems="center" space="md" mb="$6">
        <Pressable onPress={() => navigation.goBack()} p="$1">
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold">
          Alertas
        </Text>
      </HStack>

      {error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : isLoading ? (
        <Box py="$12" alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" color={colors.primary} />
        </Box>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="Nenhum alerta"
          subtitle="Exames com indícios que precisam de encaminhamento médico aparecerão aqui."
          icon={<AlertTriangle color={colors.primary} size={64} />}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onResolve={() => handleResolve(item.id)}
              resolving={resolvingId === item.id}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
}
