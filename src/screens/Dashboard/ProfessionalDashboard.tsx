import { useCallback, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Avatar,
  AvatarFallbackText,
  Pressable,
  Icon,
} from '@gluestack-ui/themed';
import {
  LogOut,
  FileText,
  Stethoscope,
  Building2,
  AlertTriangle,
  ChevronRight,
  Percent,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { ExamResponse } from '../../services/examService';
import { colors } from '../../theme';
import { EmptyState, MetricCard } from '../../components';
import { getAttendedUnits, AttendedUnit } from '../../services/professionalService';
import { getProfessionalAlerts } from '../../services/alertsService';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> &
  NativeStackNavigationProp<AppStackParamList>;

// O Profissional só recebe exames com resultado definitivo (Positivo ou
// Negativo) — inconclusivos e falhas ficam só com o paciente/usuário, que
// resolve refazendo o Teste de Adams (ver ResultScreen). Nunca chegam aqui.
const STATUS_LABEL: Record<string, string> = {
  POSITIVE: 'Positivo',
  NEGATIVE: 'Negativo',
};

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  POSITIVE: { text: colors.positive, bg: colors.positiveLight },
  NEGATIVE: { text: colors.negative, bg: colors.negativeLight },
};

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

function ExamResultBadge({ status }: { status: string }) {
  const { text, bg } = STATUS_COLOR[status] ?? STATUS_COLOR.POSITIVE;
  return (
    <Box bg={bg} borderRadius="$full" px="$3" py="$1">
      <Text color={text} fontSize="$xs" fontWeight="$bold">
        {STATUS_LABEL[status] ?? status}
      </Text>
    </Box>
  );
}

function SharedExamCard({ exam, onPress }: { exam: ExamResponse; onPress: () => void }) {
  const patientName = exam.dependent_name || 'Paciente';
  return (
    <Pressable onPress={onPress}>
      <Box
        borderWidth={1}
        borderColor={colors.border}
        borderRadius="$xl"
        p="$4"
        bg={colors.surface}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center" flex={1}>
            <Avatar bg={colors.primaryLight} size="md">
              <AvatarFallbackText color={colors.primary} fontWeight="$bold">
                {getInitials(patientName)}
              </AvatarFallbackText>
            </Avatar>
            <VStack flex={1}>
              <Text color={colors.textPrimary} fontWeight="$bold" numberOfLines={1}>
                {patientName}
              </Text>
              <Text color={colors.textSecondary} fontSize="$sm">
                {formatDate(exam.created_at)}
              </Text>
            </VStack>
          </HStack>
          <ExamResultBadge status={exam.status} />
        </HStack>
      </Box>
    </Pressable>
  );
}

export default function ProfessionalDashboard() {
  const { user, logout } = useAuthStore();
  const { examHistory, fetchExamHistory } = useExamStore();
  const navigation = useNavigation<NavigationProp>();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Profissional';
  const sharedExams = examHistory.filter(
    (exam) =>
      (exam.status === 'POSITIVE' || exam.status === 'NEGATIVE') &&
      !exam.evaluation &&
      !exam.retake,
  );
  const definitiveExams = examHistory.filter(
    (exam) => exam.status === 'POSITIVE' || exam.status === 'NEGATIVE',
  );
  const positiveRate =
    definitiveExams.length > 0
      ? Math.round(
          (definitiveExams.filter((exam) => exam.status === 'POSITIVE').length /
            definitiveExams.length) *
            100,
        )
      : 0;

  const [units, setUnits] = useState<AttendedUnit[]>([]);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);

  // useFocusEffect (não useEffect) para refletir na hora unidades, exames e
  // alertas adicionados/avaliados/resolvidos nas outras abas.
  useFocusEffect(
    useCallback(() => {
      getAttendedUnits().then(setUnits);
      fetchExamHistory();
      getProfessionalAlerts().then((alerts) =>
        setPendingAlertsCount(alerts.filter((alert) => !alert.resolved).length),
      );
    }, []),
  );

  const handleStartExam = () => {
    navigation.navigate('ExamFlow', { screen: 'PatientPicker' });
  };

  const handleOpenExam = async (examId: string) => {
    await fetchExamHistory();
    navigation.navigate('ExamFlow', { screen: 'Report', params: { examId } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
    >
      <Box px="$6" pt="$12" flex={1}>
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center" mb="$8">
          <VStack>
            <Text color={colors.textPrimary} fontSize="$2xl" fontWeight="$bold">
              Olá, {firstName}
            </Text>
            <Text color={colors.textSecondary} fontSize="$sm">
              Profissional de Saúde
            </Text>
          </VStack>
          <HStack space="md" alignItems="center">
            <Avatar bg={colors.primaryLight} size="md">
              <AvatarFallbackText color={colors.primary} fontWeight="$bold">
                {getInitials(firstName)}
              </AvatarFallbackText>
            </Avatar>
            <Pressable onPress={() => logout()} p="$2">
              <Icon as={LogOut} color="$red500" size="xl" />
            </Pressable>
          </HStack>
        </HStack>

        {/* CTA — iniciar exame em um paciente (não um dependente) */}
        <Pressable onPress={handleStartExam}>
          <Box bg={colors.primary} borderRadius="$2xl" p="$6" alignItems="center" mb="$8">
            <Stethoscope size={40} color={colors.white} />
            <Text color={colors.white} fontSize="$xl" fontWeight="$bold" mt="$4">
              Iniciar Exame
            </Text>
            <Text color={colors.primaryLight} fontSize="$sm" mt="$1">
              Teste de Adams em um paciente
            </Text>
          </Box>
        </Pressable>

        {/* Métricas rápidas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$8">
          <HStack space="sm">
            <MetricCard
              label="Unidades atendidas"
              value={units.length}
              icon={Building2}
              onPress={() => navigation.navigate('UnitsTab')}
            />
            <MetricCard
              label="Alertas"
              value={pendingAlertsCount}
              icon={AlertTriangle}
              accentColor={colors.warning}
              accentBg={colors.warningLight}
              onPress={() => navigation.navigate('Alerts')}
            />
            <MetricCard label="Taxa de Positividade" value={`${positiveRate}%`} icon={Percent} />
          </HStack>
        </ScrollView>

        {/* Prévia das unidades de atendimento */}
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold">
            Minhas Unidades
          </Text>
          <Pressable onPress={() => navigation.navigate('UnitsTab')} hitSlop={10}>
            <HStack alignItems="center">
              <Text color={colors.primary} fontSize="$sm" fontWeight="$bold">
                Ver todas
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </HStack>
          </Pressable>
        </HStack>

        <VStack space="sm" mb="$8">
          {units.slice(0, 3).map((unit) => (
            <HStack
              key={unit.id}
              borderWidth={1}
              borderColor={colors.border}
              borderRadius="$lg"
              p="$3"
              alignItems="center"
              space="sm"
              bg={colors.surface}
            >
              <Building2 size={18} color={colors.primary} />
              <Text color={colors.textPrimary} fontWeight="$bold" flex={1} numberOfLines={1}>
                {unit.name}
              </Text>
            </HStack>
          ))}
        </VStack>

        <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold" mb="$4">
          Exames para Avaliar
        </Text>

        {sharedExams.length === 0 ? (
          <EmptyState
            title="Nenhum exame para avaliar"
            icon={<FileText color={colors.primary} size={64} />}
          />
        ) : (
          <VStack space="md">
            {sharedExams.map((exam) => (
              <SharedExamCard key={exam.id} exam={exam} onPress={() => handleOpenExam(exam.id)} />
            ))}
          </VStack>
        )}
      </Box>
    </ScrollView>
  );
}
