// Mock local do microsserviço de IA (issue #43), usado enquanto o backend real de
// análise de imagem não existe. Habilitado por padrão via EXPO_PUBLIC_USE_AI_MOCK.
//
// Quando o microsserviço de IA estiver pronto, o fluxo real deve substituir a
// chamada a `mockAnalyzeExam` por polling em GET /api/v1/exams/:id até o status
// deixar de ser PENDING_AI.

export type AiMockResult = 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE' | 'NETWORK_ERROR' | 'INVALID_IMAGE';

export const AI_MOCK_DELAY_MS = 4000;

// Probabilidades cumulativas: cada cenário soma sua fatia da faixa [0, 1).
const WEIGHTED_OUTCOMES: readonly { result: AiMockResult; weight: number }[] = [
  { result: 'POSITIVE', weight: 0.25 },
  { result: 'NEGATIVE', weight: 0.40 },
  { result: 'INCONCLUSIVE', weight: 0.1 },
  { result: 'INVALID_IMAGE', weight: 0.1 },
  { result: 'NETWORK_ERROR', weight: 0.15 },
];

export function isAiMockEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_AI_MOCK === 'true';
}

export function pickWeightedAiOutcome(): AiMockResult {
  const roll = Math.random();
  let cumulative = 0;
  for (const { result, weight } of WEIGHTED_OUTCOMES) {
    cumulative += weight;
    if (roll < cumulative) return result;
  }
  // Guarda contra erro de arredondamento de ponto flutuante no último item.
  return WEIGHTED_OUTCOMES[WEIGHTED_OUTCOMES.length - 1].result;
}

export async function mockAnalyzeExam(): Promise<AiMockResult> {
  await new Promise((resolve) => setTimeout(resolve, AI_MOCK_DELAY_MS));
  return pickWeightedAiOutcome();
}
