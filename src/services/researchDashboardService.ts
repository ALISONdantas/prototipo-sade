import { api } from './api';

export type ResearchPeriod = 'week' | 'month' | 'year';
export type ResearchResultFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';

export const AGE_RANGE_OPTIONS = ['0-12', '13-18', '19-30', '31-50', '51+'] as const;
export type AgeRange = (typeof AGE_RANGE_OPTIONS)[number];

export interface SeriesData {
  labels: string[];
  values: number[];
}

export interface ResultSlice {
  label: string;
  percentage: number;
}

export interface ResearchStatsParams {
  period: ResearchPeriod;
  ageRange?: AgeRange;
  result?: ResearchResultFilter;
}

export interface ResearchStatsData {
  totalExams: number;
  positiveRatePercentage: number;
  populationDistribution: SeriesData;
  resultDistribution: ResultSlice[];
}

export interface ResearchDatasetRow {
  exam_id: string;
  age_range: AgeRange;
  region: string;
  result: Exclude<ResearchResultFilter, 'ALL'>;
  exam_date: string;
}

interface ResearchStatsApiResponse {
  total_exams: number;
  positive_rate_percentage: number;
  population_distribution: SeriesData;
  result_distribution: ResultSlice[];
}

// TODO(#49): mock enquanto GET /api/v1/research/stats e GET /api/v1/research/export
// não existem no backend. Ver docs/frontend-researcher-dashboard-charts-export-issue-49.md
// para o contrato esperado das duas APIs reais.
const MOCK_STATS_BY_PERIOD: Record<ResearchPeriod, ResearchStatsData> = {
  week: {
    totalExams: 214,
    positiveRatePercentage: 18,
    populationDistribution: { labels: [...AGE_RANGE_OPTIONS], values: [28, 46, 61, 52, 27] },
    resultDistribution: [
      { label: 'Negativo', percentage: 74 },
      { label: 'Positivo', percentage: 18 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
  },
  month: {
    totalExams: 968,
    positiveRatePercentage: 21,
    populationDistribution: { labels: [...AGE_RANGE_OPTIONS], values: [120, 198, 261, 224, 165] },
    resultDistribution: [
      { label: 'Negativo', percentage: 71 },
      { label: 'Positivo', percentage: 21 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
  },
  year: {
    totalExams: 15420,
    positiveRatePercentage: 12.5,
    populationDistribution: {
      labels: [...AGE_RANGE_OPTIONS],
      values: [1980, 3240, 4380, 3560, 2260],
    },
    resultDistribution: [
      { label: 'Negativo', percentage: 79.5 },
      { label: 'Positivo', percentage: 12.5 },
      { label: 'Inconclusivo', percentage: 8 },
    ],
  },
};

const RESULT_LABEL: Record<Exclude<ResearchResultFilter, 'ALL'>, string> = {
  POSITIVE: 'Positivo',
  NEGATIVE: 'Negativo',
  INCONCLUSIVE: 'Inconclusivo',
};

function scaleAgeDistribution(series: SeriesData, ageRange?: AgeRange): SeriesData {
  if (!ageRange) return series;
  return {
    labels: series.labels,
    values: series.labels.map((label, index) => (label === ageRange ? series.values[index] : 0)),
  };
}

function isolateResult(slices: ResultSlice[], result?: ResearchResultFilter): ResultSlice[] {
  if (!result || result === 'ALL') return slices;
  const targetLabel = RESULT_LABEL[result];
  return slices.map((slice) => ({
    ...slice,
    percentage: slice.label === targetLabel ? slice.percentage : 0,
  }));
}

function buildMockStats(params: ResearchStatsParams): ResearchStatsData {
  const base = MOCK_STATS_BY_PERIOD[params.period];
  return {
    totalExams:
      params.ageRange || (params.result && params.result !== 'ALL')
        ? Math.round(base.totalExams * 0.2)
        : base.totalExams,
    positiveRatePercentage: base.positiveRatePercentage,
    populationDistribution: scaleAgeDistribution(base.populationDistribution, params.ageRange),
    resultDistribution: isolateResult(base.resultDistribution, params.result),
  };
}

export const getResearchStats = async (params: ResearchStatsParams): Promise<ResearchStatsData> => {
  try {
    const response = await api.get<ResearchStatsApiResponse>('/research/stats', {
      params: { period: params.period, age_range: params.ageRange, result: params.result },
    });
    const data = response.data;
    return {
      totalExams: data.total_exams,
      positiveRatePercentage: data.positive_rate_percentage,
      populationDistribution: data.population_distribution,
      resultDistribution: data.result_distribution,
    };
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getResearchStats (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return buildMockStats(params);
    }
    console.error('Erro ao buscar estatísticas de pesquisa:', error);
    throw error;
  }
};

const MOCK_REGIONS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'];

function buildMockDataset(params: ResearchStatsParams): ResearchDatasetRow[] {
  const ageRanges = params.ageRange ? [params.ageRange] : [...AGE_RANGE_OPTIONS];
  const results: Exclude<ResearchResultFilter, 'ALL'>[] =
    params.result && params.result !== 'ALL'
      ? [params.result]
      : ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'];

  const rows: ResearchDatasetRow[] = [];
  let sequence = 1;
  for (const ageRange of ageRanges) {
    for (const result of results) {
      for (let i = 0; i < 4; i++) {
        const region = MOCK_REGIONS[(sequence + i) % MOCK_REGIONS.length];
        const daysAgo = (sequence * 7 + i) % 90;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        rows.push({
          exam_id: `mock-${params.period}-${sequence.toString().padStart(4, '0')}`,
          age_range: ageRange,
          region,
          result,
          exam_date: date.toISOString().slice(0, 10),
        });
        sequence++;
      }
    }
  }
  return rows;
}

export const getResearchDataset = async (
  params: ResearchStatsParams,
): Promise<ResearchDatasetRow[]> => {
  try {
    const response = await api.get<ResearchDatasetRow[]>('/research/export', {
      params: { period: params.period, age_range: params.ageRange, result: params.result },
    });
    return response.data;
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getResearchDataset (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      return buildMockDataset(params);
    }
    console.error('Erro ao buscar dataset de pesquisa:', error);
    throw error;
  }
};
