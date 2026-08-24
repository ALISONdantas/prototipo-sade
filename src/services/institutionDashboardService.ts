import { api } from './api';

export type DashboardPeriod = 'week' | 'month' | 'year';

export interface InstitutionGroup {
  id: string;
  name: string;
}

export interface SeriesData {
  labels: string[];
  values: number[];
}

export interface PositiveRateSlice {
  label: string;
  percentage: number;
}

export interface InstitutionDashboardData {
  groups: InstitutionGroup[];
  examVolume: SeriesData;
  positiveRate: PositiveRateSlice[];
  ageDistribution: SeriesData;
}

export interface GetInstitutionDashboardParams {
  period: DashboardPeriod;
  groupId?: string;
}

interface InstitutionDashboardApiResponse {
  groups: InstitutionGroup[];
  exam_volume: SeriesData;
  positive_rate: PositiveRateSlice[];
  age_distribution: SeriesData;
}

// TODO(#48): mock enquanto GET /api/v1/institution/dashboard não existe no
// backend. Ver docs/frontend-institution-dashboard-filters-export-issue-48.md
// para o contrato esperado da API real.
const MOCK_GROUPS: InstitutionGroup[] = [
  { id: 'triagem-geral', name: 'Triagem Geral' },
  { id: 'ortopedia', name: 'Ortopedia' },
  { id: 'pediatria', name: 'Pediatria' },
];

// Fatia aproximada do volume total de cada setor, usada só para o mock deixar
// visível que o filtro por setor realmente muda os dados exibidos.
const MOCK_GROUP_WEIGHT: Record<string, number> = {
  'triagem-geral': 0.45,
  ortopedia: 0.32,
  pediatria: 0.23,
};

const MOCK_DATA_BY_PERIOD: Record<DashboardPeriod, Omit<InstitutionDashboardData, 'groups'>> = {
  week: {
    examVolume: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      values: [4, 7, 5, 9, 6, 3, 2],
    },
    positiveRate: [
      { label: 'Negativo', percentage: 74 },
      { label: 'Positivo', percentage: 18 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
    ageDistribution: {
      labels: ['0-12', '13-18', '19-30', '31-50', '51+'],
      values: [12, 20, 15, 9, 4],
    },
  },
  month: {
    examVolume: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      values: [22, 31, 27, 35],
    },
    positiveRate: [
      { label: 'Negativo', percentage: 71 },
      { label: 'Positivo', percentage: 21 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
    ageDistribution: {
      labels: ['0-12', '13-18', '19-30', '31-50', '51+'],
      values: [48, 76, 58, 34, 15],
    },
  },
  year: {
    examVolume: {
      labels: ['T1', 'T2', 'T3', 'T4'],
      values: [420, 480, 460, 510],
    },
    positiveRate: [
      { label: 'Negativo', percentage: 69 },
      { label: 'Positivo', percentage: 23 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
    ageDistribution: {
      labels: ['0-12', '13-18', '19-30', '31-50', '51+'],
      values: [520, 810, 640, 390, 180],
    },
  },
};

function scaleSeries(series: SeriesData, weight: number): SeriesData {
  return {
    labels: series.labels,
    values: series.values.map((value) => Math.max(0, Math.round(value * weight))),
  };
}

function buildMockDashboard({
  period,
  groupId,
}: GetInstitutionDashboardParams): InstitutionDashboardData {
  const base = MOCK_DATA_BY_PERIOD[period];
  const weight = groupId ? (MOCK_GROUP_WEIGHT[groupId] ?? 1) : 1;
  return {
    groups: MOCK_GROUPS,
    examVolume: scaleSeries(base.examVolume, weight),
    positiveRate: base.positiveRate,
    ageDistribution: scaleSeries(base.ageDistribution, weight),
  };
}

export const getInstitutionDashboard = async (
  params: GetInstitutionDashboardParams,
): Promise<InstitutionDashboardData> => {
  try {
    const response = await api.get<InstitutionDashboardApiResponse>('/institution/dashboard', {
      params: { period: params.period, group_id: params.groupId },
    });
    const data = response.data;
    return {
      groups: data.groups,
      examVolume: data.exam_volume,
      positiveRate: data.positive_rate,
      ageDistribution: data.age_distribution,
    };
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getInstitutionDashboard (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return buildMockDashboard(params);
    }
    console.error('Erro ao buscar métricas do dashboard da instituição:', error);
    throw error;
  }
};
