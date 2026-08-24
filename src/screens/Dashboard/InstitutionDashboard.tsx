import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, useWindowDimensions, Modal, Alert } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
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
  Building2,
  Activity,
  Users,
  PlusCircle,
  Download,
  CheckSquare,
  Square,
  Network,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppStack';
import { ErrorState, Button } from '../../components';
import {
  getInstitutionDashboard,
  type DashboardPeriod,
  type InstitutionDashboardData,
  type InstitutionGroup,
} from '../../services/institutionDashboardService';
import { generateAndShareInstitutionDashboardReport } from '../../services/pdfService';

type NavigationProp = BottomTabNavigationProp<AppTabParamList> &
  NativeStackNavigationProp<AppStackParamList>;

const INSTITUTION_ACCENT = '#5B21B6';
const INSTITUTION_ACCENT_LIGHT = '$purple100';

type Period = DashboardPeriod;

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];

const ALL_GROUPS_KEY = 'all';

const POSITIVE_RATE_COLOR: Record<string, string> = {
  Positivo: colors.positive,
  Negativo: colors.negative,
  Inconclusivo: colors.warning,
};

// TODO: substituir por chamada real quando o backend expuser métricas da instituição.
// Sem métrica de "Alertas" aqui — casos com indícios positivos vão direto
// para a tela do Profissional responsável, não para a Instituição.
const METRICS = [
  { key: 'exams', label: 'Exames Realizados', value: 0, icon: Activity },
  { key: 'patients', label: 'Pacientes Ativos', value: 0, icon: Users },
];

const MOCK_EXAMS = [
  { id: 'ex-1', patientName: 'Ana Silva', date: '19/08/2026', status: 'Positivo' },
  { id: 'ex-2', patientName: 'João Souza', date: '18/08/2026', status: 'Negativo' },
  { id: 'ex-3', patientName: 'Maria Oliveira', date: '18/08/2026', status: 'Inconclusivo' },
];

function hexToRgba(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => hexToRgba(colors.primary, opacity),
  labelColor: (opacity = 1) => hexToRgba(colors.textSecondary, opacity),
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border },
  barPercentage: 0.6,
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      bg={colors.surface}
      p="$4"
      mb="$4"
    >
      <Text color={colors.textPrimary} fontSize="$md" fontWeight="$bold" mb="$3">
        {title}
      </Text>
      {children}
    </Box>
  );
}

function MetricCard({
  label,
  value,
  icon: MetricIcon,
  onPress,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  onPress?: () => void;
}) {
  const content = (
    <Box
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      p="$4"
      bg={colors.surface}
      minWidth={160}
    >
      <Box bg={INSTITUTION_ACCENT_LIGHT} p="$3" borderRadius="$lg" alignSelf="flex-start" mb="$3">
        <MetricIcon size={20} color={INSTITUTION_ACCENT} />
      </Box>
      <Text color={colors.textPrimary} fontSize="$2xl" fontWeight="$bold">
        {value}
      </Text>
      <Text color={colors.textSecondary} fontSize="$sm">
        {label}
      </Text>
    </Box>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Métrica: ${label}. Valor atual: ${value}`}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filtro: ${label}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={4}
    >
      <Box
        bg={active ? INSTITUTION_ACCENT : colors.surface}
        borderWidth={1}
        borderColor={active ? INSTITUTION_ACCENT : colors.border}
        borderRadius="$full"
        px="$4"
        py="$2"
      >
        <Text
          color={active ? colors.white : colors.textSecondary}
          fontSize="$sm"
          fontWeight="$bold"
        >
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}

export default function InstitutionDashboard() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const displayName = user?.full_name || 'Instituição';
  const initials = displayName.substring(0, 2).toUpperCase();
  const [period, setPeriod] = useState<Period>('week');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_GROUPS_KEY);
  const { width: windowWidth } = useWindowDimensions();

  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [destination, setDestination] = useState('Prontuário E-SUS');

  const [groups, setGroups] = useState<InstitutionGroup[]>([]);
  const [dashboardData, setDashboardData] = useState<InstitutionDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const requestIdRef = useRef(0);

  const groupId = selectedGroupId === ALL_GROUPS_KEY ? undefined : selectedGroupId;
  const selectedGroupLabel =
    groups.find((group) => group.id === selectedGroupId)?.name ?? 'Todos os setores';

  const fetchDashboard = () => {
    const requestId = ++requestIdRef.current;
    Promise.resolve()
      .then(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(true);
        setError(null);
        return getInstitutionDashboard({ period, groupId });
      })
      .then((data) => {
        if (!data || requestId !== requestIdRef.current) return;
        setDashboardData(data);
        setGroups(data.groups);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError('Não foi possível carregar as métricas da instituição.');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });
  };

  useEffect(fetchDashboard, [period, groupId]);

  const handleExport = async () => {
    if (!dashboardData || isExporting) return;
    setIsExporting(true);
    try {
      await generateAndShareInstitutionDashboardReport(dashboardData, period, selectedGroupLabel);
    } catch (exportError) {
      console.error('Erro ao exportar relatório da instituição:', exportError);
    } finally {
      setIsExporting(false);
    }
  };

  const chartWidth = windowWidth - 80;
  const donutSize = 80;
  const positiveSlice = dashboardData?.positiveRate.find((slice) => slice.label === 'Positivo');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Box px="$6" pt="$12">
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center" mb="$8">
          <VStack>
            <Text color={colors.textPrimary} fontSize="$2xl" fontWeight="$bold">
              {displayName}
            </Text>
            <HStack alignItems="center" space="xs">
              <Building2 size={14} color={colors.textSecondary} />
              <Text color={colors.textSecondary} fontSize="$sm">
                Instituição
              </Text>
            </HStack>
          </VStack>
          <HStack space="md" alignItems="center">
            <Avatar bg={INSTITUTION_ACCENT_LIGHT} size="md">
              <AvatarFallbackText color={INSTITUTION_ACCENT} fontWeight="$bold">
                {initials}
              </AvatarFallbackText>
            </Avatar>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              accessibilityHint="Desconecta da sua conta e retorna para a tela de login"
              onPress={() => logout()}
              p="$2"
              hitSlop={10}
            >
              <Icon as={LogOut} color="$red500" size="xl" />
            </Pressable>
          </HStack>
        </HStack>

        {/* Big CTA for new triage — instituição não faz teste em si mesma,
            só em pacientes/alunos, mesma lógica de busca/cadastro do Profissional. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar nova triagem"
          onPress={() => navigation.navigate('ExamFlow', { screen: 'PatientPicker' })}
        >
          <Box bg={INSTITUTION_ACCENT} borderRadius="$2xl" p="$6" alignItems="center" mb="$8">
            <PlusCircle size={40} color={colors.white} />
            <Text color={colors.white} fontSize="$xl" fontWeight="$bold" mt="$4">
              Realizar Triagem
            </Text>
            <Text color={INSTITUTION_ACCENT_LIGHT} fontSize="$sm" mt="$1">
              Buscar ou cadastrar paciente
            </Text>
          </Box>
        </Pressable>

        {/* Métricas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$8">
          <HStack space="md">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
              />
            ))}
          </HStack>
        </ScrollView>

        {/* Filtro de período */}
        <HStack space="sm" mb="$4">
          {PERIOD_OPTIONS.map((option) => (
            <FilterPill
              key={option.key}
              label={option.label}
              active={period === option.key}
              onPress={() => setPeriod(option.key)}
            />
          ))}
        </HStack>

        {/* Filtro de setor */}
        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$4">
            <HStack space="sm">
              <FilterPill
                label="Todos os setores"
                active={selectedGroupId === ALL_GROUPS_KEY}
                onPress={() => setSelectedGroupId(ALL_GROUPS_KEY)}
              />
              {groups.map((group) => (
                <FilterPill
                  key={group.id}
                  label={group.name}
                  active={selectedGroupId === group.id}
                  onPress={() => setSelectedGroupId(group.id)}
                />
              ))}
            </HStack>
          </ScrollView>
        )}

        {error ? (
          <ErrorState message={error} onRetry={fetchDashboard} />
        ) : isLoading && !dashboardData ? (
          <Box py="$12" alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color={colors.primary} />
          </Box>
        ) : dashboardData ? (
          <>
            {/* Volume de exames */}
            <ChartCard title="Volume de Exames">
              <LineChart
                data={{
                  labels: dashboardData.examVolume.labels,
                  datasets: [{ data: dashboardData.examVolume.values }],
                }}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                bezier
                fromZero
                withInnerLines={false}
                style={{ borderRadius: 12, paddingRight: 24 }}
              />
            </ChartCard>

            {/* Percentual de positivos */}
            <ChartCard title="Percentual de Positivos">
              <Box alignItems="center">
                <Box position="relative">
                  <PieChart
                    data={dashboardData.positiveRate.map((slice) => ({
                      name: slice.label,
                      population: slice.percentage,
                      color: POSITIVE_RATE_COLOR[slice.label] ?? colors.textDisabled,
                      legendFontColor: colors.textSecondary,
                      legendFontSize: 12,
                    }))}
                    width={chartWidth}
                    height={180}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft={String(chartWidth / 4)}
                    hasLegend={false}
                  />
                  <Box
                    position="absolute"
                    top={90 - donutSize / 2}
                    left={chartWidth / 2 - donutSize / 2}
                    width={donutSize}
                    height={donutSize}
                    borderRadius="$full"
                    bg={colors.surface}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold">
                      {positiveSlice?.percentage ?? 0}%
                    </Text>
                    <Text color={colors.textSecondary} fontSize="$2xs">
                      Positivo
                    </Text>
                  </Box>
                </Box>
                <HStack space="md" flexWrap="wrap" justifyContent="center" mt="$4">
                  {dashboardData.positiveRate.map((slice) => (
                    <HStack key={slice.label} alignItems="center" space="xs">
                      <Box
                        width={10}
                        height={10}
                        borderRadius="$full"
                        bg={POSITIVE_RATE_COLOR[slice.label] ?? colors.textDisabled}
                      />
                      <Text color={colors.textSecondary} fontSize="$xs">
                        {slice.label} ({slice.percentage}%)
                      </Text>
                    </HStack>
                  ))}
                </HStack>
              </Box>
            </ChartCard>

            {/* Distribuição etária */}
            <ChartCard title="Distribuição Etária">
              <BarChart
                data={{
                  labels: dashboardData.ageDistribution.labels,
                  datasets: [{ data: dashboardData.ageDistribution.values }],
                }}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                fromZero
                showValuesOnTopOfBars
                withInnerLines={false}
                yAxisLabel=""
                yAxisSuffix=""
                style={{ borderRadius: 12 }}
              />
            </ChartCard>

            {/* Exportar relatório */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exportar relatório do dashboard"
              accessibilityState={{ disabled: isExporting }}
              onPress={handleExport}
              disabled={isExporting}
              hitSlop={10}
            >
              <HStack
                borderWidth={1}
                borderColor={INSTITUTION_ACCENT}
                borderRadius="$xl"
                p="$4"
                alignItems="center"
                justifyContent="center"
                space="sm"
                opacity={isExporting ? 0.6 : 1}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={INSTITUTION_ACCENT} />
                ) : (
                  <Download size={18} color={INSTITUTION_ACCENT} />
                )}
                <Text color={INSTITUTION_ACCENT} fontWeight="$bold">
                  {isExporting ? 'Gerando relatório...' : 'Exportar Relatório'}
                </Text>
              </HStack>
            </Pressable>
          </>
        ) : null}

        {/* SEÇÃO INTEGRAÇÃO FHIR */}
        <Box mt="$8" mb="$4">
          <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold" mb="$4">
            Integração com Prontuário (FHIR)
          </Text>
          
          <Text color={colors.textSecondary} fontSize="$sm" mb="$4">
            Selecione os exames que deseja exportar para o sistema de saúde parceiro.
          </Text>

          {MOCK_EXAMS.map((exam) => {
            const isSelected = selectedExams.includes(exam.id);
            return (
              <Pressable
                key={exam.id}
                onPress={() => {
                  if (isSelected) {
                    setSelectedExams(selectedExams.filter((id) => id !== exam.id));
                  } else {
                    setSelectedExams([...selectedExams, exam.id]);
                  }
                }}
              >
                <HStack
                  bg={colors.surface}
                  borderWidth={1}
                  borderColor={isSelected ? INSTITUTION_ACCENT : colors.border}
                  borderRadius="$xl"
                  p="$4"
                  mb="$3"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack space="md" alignItems="center">
                    {isSelected ? (
                      <CheckSquare color={INSTITUTION_ACCENT} size={24} />
                    ) : (
                      <Square color={colors.textSecondary} size={24} />
                    )}
                    <VStack>
                      <Text color={colors.textPrimary} fontWeight="$bold">{exam.patientName}</Text>
                      <Text color={colors.textSecondary} fontSize="$xs">{exam.date} • {exam.status}</Text>
                    </VStack>
                  </HStack>
                </HStack>
              </Pressable>
            );
          })}

          <Box mt="$4">
            <Button
              title={`Integrar Selecionados (${selectedExams.length})`}
              onPress={() => setIsModalVisible(true)}
              disabled={selectedExams.length === 0}
            />
          </Box>
        </Box>
      </Box>

      {/* Modal de Confirmação de Integração */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" alignItems="center" p="$6">
          <Box bg={colors.surface} width="100%" borderRadius="$2xl" p="$6">
            <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold" mb="$2">
              Confirmar Integração
            </Text>
            <Text color={colors.textSecondary} fontSize="$sm" mb="$6">
              Você selecionou {selectedExams.length} exame(s) para exportar. Selecione o sistema destino:
            </Text>

            <VStack space="md" mb="$6">
              {['Prontuário E-SUS', 'Sistema Local Hosp. São Lucas'].map((sys) => (
                <Pressable key={sys} onPress={() => setDestination(sys)}>
                  <HStack 
                    borderWidth={1} 
                    borderColor={destination === sys ? INSTITUTION_ACCENT : colors.border}
                    borderRadius="$lg"
                    p="$3"
                    alignItems="center"
                  >
                    <Box 
                      width={20} 
                      height={20} 
                      borderRadius="$full" 
                      borderWidth={2}
                      borderColor={destination === sys ? INSTITUTION_ACCENT : colors.border}
                      alignItems="center"
                      justifyContent="center"
                      mr="$3"
                    >
                      {destination === sys && <Box width={10} height={10} borderRadius="$full" bg={INSTITUTION_ACCENT} />}
                    </Box>
                    <Text color={destination === sys ? colors.textPrimary : colors.textSecondary} fontWeight="$bold">
                      {sys}
                    </Text>
                  </HStack>
                </Pressable>
              ))}
            </VStack>

            <HStack space="md">
              <Button 
                title="Cancelar" 
                variant="outline" 
                style={{ flex: 1 }} 
                onPress={() => setIsModalVisible(false)} 
              />
              <Button 
                title="Confirmar" 
                style={{ flex: 1, backgroundColor: INSTITUTION_ACCENT }} 
                onPress={() => {
                  Alert.alert('Sucesso', `Exames exportados para ${destination} com sucesso!`);
                  setIsModalVisible(false);
                  setSelectedExams([]);
                }} 
              />
            </HStack>
          </Box>
        </Box>
      </Modal>
    </ScrollView>
  );
}
