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
import { LogOut, FileText } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import { EmptyState } from '../../components';

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
const MOCK_SHARED_EXAMS: SharedExam[] = [
  { id: '1', patientName: 'Maria Silva', date: '2026-05-10', result: 'negative' },
  { id: '2', patientName: 'João Souza', date: '2026-04-15', result: 'inconclusive' },
  { id: '3', patientName: 'Ana Pereira', date: '2026-03-28', result: 'positive' },
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

function SharedExamCard({ exam }: { exam: SharedExam }) {
  return (
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
  );
}

export default function ProfessionalDashboard() {
  const { user, logout } = useAuthStore();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Profissional';
  const sharedExams = MOCK_SHARED_EXAMS;

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

        <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold" mb="$4">
          Exames Compartilhados
        </Text>

        {sharedExams.length === 0 ? (
          <EmptyState
            title="Nenhum exame compartilhado ainda"
            icon={<FileText color={colors.primary} size={64} />}
          />
        ) : (
          <VStack space="md">
            {sharedExams.map((exam) => (
              <SharedExamCard key={exam.id} exam={exam} />
            ))}
          </VStack>
        )}
      </Box>
    </ScrollView>
  );
}
