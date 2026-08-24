import { useEffect, useState } from 'react';
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
import { LogOut, FileText, Stethoscope, Building2, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { colors } from '../../theme';
import { EmptyState, MetricCard } from '../../components';
import { getAttendedUnits, AttendedUnit } from '../../services/professionalService';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> &
  NativeStackNavigationProp<AppStackParamList>;

type ExamResult = 'positive' | 'negative' | 'inconclusive';

interface SharedExam {
  id: string;
  patientName: string;
  date: string;
  result: ExamResult;
}

const RESULT_LABEL: Record<ExamResult, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  inconclusive: 'Inconclusivo',
};

const RESULT_COLOR: Record<ExamResult, { text: string; bg: string }> = {
  positive: { text: colors.positive, bg: colors.positiveLight },
  negative: { text: colors.negative, bg: colors.negativeLight },
  inconclusive: { text: colors.warning, bg: colors.warningLight },
};

// TODO: substituir por chamada real quando a API de compartilhamento de exames existir.
// IDs alinhados com os mocks de `examService.getExamHistory` para que o toque no
// card abra o laudo de verdade (ver seção "Parecer do profissional" no Report).
const MOCK_SHARED_EXAMS: SharedExam[] = [
  { id: 'mock-exam-1', patientName: 'Maria Silva', date: '2026-05-10', result: 'positive' },
  { id: 'mock-exam-2', patientName: 'João Souza', date: '2026-04-15', result: 'negative' },
  { id: 'mock-exam-3', patientName: 'Ana Pereira', date: '2026-03-28', result: 'inconclusive' },
];

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function ExamResultBadge({ result }: { result: ExamResult }) {
  const { text, bg } = RESULT_COLOR[result];
  return (
    <Box bg={bg} borderRadius="$full" px="$3" py="$1">
      <Text color={text} fontSize="$xs" fontWeight="$bold">
        {RESULT_LABEL[result]}
      </Text>
    </Box>
  );
}

function SharedExamCard({ exam, onPress }: { exam: SharedExam; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Box borderWidth={1} borderColor={colors.border} borderRadius="$xl" p="$4" bg={colors.surface}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center" flex={1}>
            <Avatar bg={colors.primaryLight} size="md">
              <AvatarFallbackText color={colors.primary} fontWeight="$bold">
                {getInitials(exam.patientName)}
              </AvatarFallbackText>
            </Avatar>
            <VStack flex={1}>
              <Text color={colors.textPrimary} fontWeight="$bold" numberOfLines={1}>
                {exam.patientName}
              </Text>
              <Text color={colors.textSecondary} fontSize="$sm">
                {formatDate(exam.date)}
              </Text>
            </VStack>
          </HStack>
          <ExamResultBadge result={exam.result} />
        </HStack>
      </Box>
    </Pressable>
  );
}

export default function ProfessionalDashboard() {
  const { user, logout } = useAuthStore();
  const { fetchExamHistory } = useExamStore();
  const navigation = useNavigation<NavigationProp>();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Profissional';
  const sharedExams = MOCK_SHARED_EXAMS;

  const [units, setUnits] = useState<AttendedUnit[]>([]);

  useEffect(() => {
    getAttendedUnits().then(setUnits);
  }, []);

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
          <HStack space="md">
            <MetricCard
              label="Unidades atendidas"
              value={units.length}
              icon={Building2}
              onPress={() => navigation.navigate('UnitsTab')}
            />
            <MetricCard
              label="Alertas"
              value="!"
              icon={AlertTriangle}
              accentColor={colors.warning}
              accentBg={colors.warningLight}
              onPress={() => navigation.navigate('Alerts')}
            />
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
