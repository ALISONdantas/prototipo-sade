import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  useWindowDimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Pressable,
  Avatar,
  AvatarFallbackText,
  Icon,
} from '@gluestack-ui/themed';
import {
  LogOut,
  Activity,
  BarChart2,
  Map,
  Download,
  X,
  FileText,
  FileJson,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components';
import {
  getResearchStats,
  getResearchDataset,
  AGE_RANGE_OPTIONS,
  type ResearchPeriod,
  type ResearchResultFilter,
  type ResearchStatsData,
  type AgeRange,
} from '../../services/researchDashboardService';
import {
  exportResearchDataset,
  type DatasetExportFormat,
} from '../../services/datasetExportService';

const PERIOD_OPTIONS: { key: ResearchPeriod; label: string }[] = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];

const RESULT_OPTIONS: { key: ResearchResultFilter; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'POSITIVE', label: 'Positivo' },
  { key: 'NEGATIVE', label: 'Negativo' },
  { key: 'INCONCLUSIVE', label: 'Inconclusivo' },
];

const ALL_AGES_KEY = 'all';

const RESULT_SLICE_COLOR: Record<string, string> = {
  Positivo: colors.positive,
  Negativo: colors.negative,
  Inconclusivo: colors.warning,
};

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
  propsForBackgroundLines: { stroke: colors.border },
  barPercentage: 0.6,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
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
        bg={active ? colors.primary : colors.surface}
        borderWidth={1}
        borderColor={active ? colors.primary : colors.border}
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

export default function ResearcherDashboard() {
  const { user, logout } = useAuthStore();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Pesquisador';
  const { width: windowWidth } = useWindowDimensions();

  const [period, setPeriod] = useState<ResearchPeriod>('week');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>(ALL_AGES_KEY);
  const [resultFilter, setResultFilter] = useState<ResearchResultFilter>('ALL');

  const [stats, setStats] = useState<ResearchStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const ageRange = selectedAgeRange === ALL_AGES_KEY ? undefined : (selectedAgeRange as AgeRange);

  const fetchStats = () => {
    const requestId = ++requestIdRef.current;
    Promise.resolve()
      .then(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(true);
        setError(null);
        return getResearchStats({ period, ageRange, result: resultFilter });
      })
      .then((data) => {
        if (!data || requestId !== requestIdRef.current) return;
        setStats(data);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError('Não foi possível carregar as estatísticas de pesquisa.');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });
  };

  useEffect(fetchStats, [period, ageRange, resultFilter]);

  const handleExport = async (format: DatasetExportFormat) => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const rows = await getResearchDataset({ period, ageRange, result: resultFilter });
      await exportResearchDataset(rows, format);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erro ao exportar dataset de pesquisa:', err);
      setExportError('Não foi possível exportar o dataset. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const chartWidth = windowWidth - 80;
  const donutSize = 80;
  const positiveSlice = stats?.resultDistribution.find((slice) => slice.label === 'Positivo');

  return (
    <>
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
              <Avatar bg={colors.primaryLight} size="md">
                <AvatarFallbackText color={colors.primary} fontWeight="$bold">
                  {firstName.substring(0, 2).toUpperCase()}
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

          <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold" mb="$4">
            Estatísticas Gerais
          </Text>

          <VStack space="md" mb="$8">
            <Box
              borderWidth={1}
              borderColor={colors.border}
              borderRadius="$xl"
              p="$4"
              bg={colors.surface}
            >
              <HStack space="md" alignItems="center">
                <Box bg={colors.primaryLight} p="$3" borderRadius="$lg">
                  <Activity size={24} color={colors.primary} />
                </Box>
                <VStack>
                  <Text color={colors.textSecondary} fontSize="$sm">
                    Testes Realizados
                  </Text>
                  <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold">
                    {stats ? stats.totalExams.toLocaleString('pt-BR') : '—'}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              borderWidth={1}
              borderColor={colors.border}
              borderRadius="$xl"
              p="$4"
              bg={colors.surface}
            >
              <HStack space="md" alignItems="center">
                <Box bg={colors.positiveLight} p="$3" borderRadius="$lg">
                  <BarChart2 size={24} color={colors.positive} />
                </Box>
                <VStack>
                  <Text color={colors.textSecondary} fontSize="$sm">
                    Taxa de Positividade
                  </Text>
                  <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold">
                    {stats ? `${stats.positiveRatePercentage.toLocaleString('pt-BR')}%` : '—'}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              borderWidth={1}
              borderColor={colors.border}
              borderRadius="$xl"
              p="$4"
              bg={colors.surface}
            >
              <HStack space="md" alignItems="center">
                <Box bg={colors.warningLight} p="$3" borderRadius="$lg">
                  <Map size={24} color={colors.warning} />
                </Box>
                <VStack>
                  <Text color={colors.textSecondary} fontSize="$sm">
                    Regiões Monitoradas
                  </Text>
                  <Text color={colors.textPrimary} fontSize="$xl" fontWeight="$bold">
                    {stats ? stats.regionsMonitored : '—'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>

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

          {/* Filtro de faixa etária */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$4">
            <HStack space="sm">
              <FilterPill
                label="Todas as idades"
                active={selectedAgeRange === ALL_AGES_KEY}
                onPress={() => setSelectedAgeRange(ALL_AGES_KEY)}
              />
              {AGE_RANGE_OPTIONS.map((range) => (
                <FilterPill
                  key={range}
                  label={range}
                  active={selectedAgeRange === range}
                  onPress={() => setSelectedAgeRange(range)}
                />
              ))}
            </HStack>
          </ScrollView>

          {/* Filtro de resultado */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} mb="$6">
            <HStack space="sm">
              {RESULT_OPTIONS.map((option) => (
                <FilterPill
                  key={option.key}
                  label={option.label}
                  active={resultFilter === option.key}
                  onPress={() => setResultFilter(option.key)}
                />
              ))}
            </HStack>
          </ScrollView>

          {error ? (
            <ErrorState message={error} onRetry={fetchStats} />
          ) : isLoading && !stats ? (
            <Box py="$12" alignItems="center" justifyContent="center">
              <ActivityIndicator size="large" color={colors.primary} />
            </Box>
          ) : stats ? (
            <>
              {/* Distribuição populacional */}
              <ChartCard title="Distribuição Populacional por Faixa Etária">
                <BarChart
                  data={{
                    labels: stats.populationDistribution.labels,
                    datasets: [{ data: stats.populationDistribution.values }],
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

              {/* Distribuição de resultados */}
              <ChartCard title="Distribuição de Resultados">
                <Box alignItems="center">
                  <Box position="relative">
                    <PieChart
                      data={stats.resultDistribution.map((slice) => ({
                        name: slice.label,
                        population: slice.percentage,
                        color: RESULT_SLICE_COLOR[slice.label] ?? colors.textDisabled,
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
                    {stats.resultDistribution.map((slice) => (
                      <HStack key={slice.label} alignItems="center" space="xs">
                        <Box
                          width={10}
                          height={10}
                          borderRadius="$full"
                          bg={RESULT_SLICE_COLOR[slice.label] ?? colors.textDisabled}
                        />
                        <Text color={colors.textSecondary} fontSize="$xs">
                          {slice.label} ({slice.percentage}%)
                        </Text>
                      </HStack>
                    ))}
                  </HStack>
                </Box>
              </ChartCard>
            </>
          ) : null}

          <Text color={colors.textPrimary} fontSize="$lg" fontWeight="$bold" mb="$4" mt="$4">
            Dados para Pesquisa
          </Text>

          <Box
            borderWidth={1}
            borderColor={colors.border}
            borderRadius="$xl"
            p="$4"
            bg={colors.surface}
            alignItems="center"
          >
            <Download size={32} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text color={colors.textPrimary} fontWeight="$bold" mb="$2">
              Base de Dados Anonimizada
            </Text>
            <Text color={colors.textSecondary} fontSize="$sm" textAlign="center" mb="$4">
              Exporte o conjunto de dados sem identificação de pacientes, respeitando os filtros
              selecionados acima.
            </Text>
            <Button
              title="Exportar Dataset"
              onPress={() => {
                setExportError(null);
                setShowExportModal(true);
              }}
              style={{ width: '100%' }}
            />
          </Box>
        </Box>
      </ScrollView>

      {/* Modal de escolha de formato de exportação */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isExporting && setShowExportModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <RNPressable
            style={styles.backdrop}
            onPress={() => !isExporting && setShowExportModal(false)}
          />

          <Box style={styles.sheetContainer}>
            <Box style={styles.dragHandleContainer}>
              <Box style={styles.dragHandle} />
            </Box>

            <HStack justifyContent="space-between" alignItems="center" mb="$4">
              <Text style={styles.headerTitle}>Exportar Dataset</Text>
              <RNPressable
                onPress={() => !isExporting && setShowExportModal(false)}
                style={styles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </RNPressable>
            </HStack>

            <Text style={styles.description}>
              Escolha o formato do arquivo anonimizado a ser exportado com os filtros atuais.
            </Text>

            {exportError ? (
              <Text
                style={[styles.description, { color: colors.positive, marginBottom: spacing.md }]}
              >
                {exportError}
              </Text>
            ) : null}

            <VStack space="md">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Exportar como CSV"
                onPress={() => handleExport('csv')}
                disabled={isExporting}
                hitSlop={10}
              >
                <HStack
                  borderWidth={1}
                  borderColor={colors.border}
                  borderRadius="$lg"
                  p="$4"
                  alignItems="center"
                  space="md"
                  opacity={isExporting ? 0.6 : 1}
                >
                  <FileText size={22} color={colors.primary} />
                  <VStack flex={1}>
                    <Text color={colors.textPrimary} fontWeight="$bold">
                      CSV
                    </Text>
                    <Text color={colors.textSecondary} fontSize="$xs">
                      Planilha, compatível com Excel/Sheets
                    </Text>
                  </VStack>
                  {isExporting && <ActivityIndicator size="small" color={colors.primary} />}
                </HStack>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Exportar como JSON"
                onPress={() => handleExport('json')}
                disabled={isExporting}
                hitSlop={10}
              >
                <HStack
                  borderWidth={1}
                  borderColor={colors.border}
                  borderRadius="$lg"
                  p="$4"
                  alignItems="center"
                  space="md"
                  opacity={isExporting ? 0.6 : 1}
                >
                  <FileJson size={22} color={colors.primary} />
                  <VStack flex={1}>
                    <Text color={colors.textPrimary} fontWeight="$bold">
                      JSON
                    </Text>
                    <Text color={colors.textSecondary} fontSize="$xs">
                      Estruturado, ideal para scripts de análise
                    </Text>
                  </VStack>
                  {isExporting && <ActivityIndicator size="small" color={colors.primary} />}
                </HStack>
              </Pressable>
            </VStack>
          </Box>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    ...shadows.card,
  } as any,
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
  },
  headerTitle: {
    ...typography.h2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});
