import { api } from './api';

export interface CreateExamDraftPayload {
  dependent_id?: string;
  // Exame feito por um Profissional em um paciente da(s) unidade(s) que ele
  // atende — o backend ainda não modela essa relação (ver Plano de
  // Implementação, risco R1), então esse caso sempre resolve via mock.
  patient_id?: string;
  // RF04 — formulário de anamnese completo, coletado a cada exame (idade,
  // sexo, peso e altura podem mudar de um teste para o outro, especialmente
  // em crianças em fase de crescimento).
  age: number;
  sex: string;
  weight_kg: number;
  height_cm: number;
  family_history: boolean;
  pre_existing_conditions?: string;
  has_pain: boolean;
  had_surgery: boolean;
  surgery_detail?: string;
}

// Backend usa o VO Gender ("male" | "female" | "prefer_not_to_say"); a UI usa "M" | "F".
const SEX_TO_GENDER: Record<string, string> = {
  M: 'male',
  F: 'female',
  O: 'prefer_not_to_say',
};

interface DraftExamApiResponse {
  id_draft: string;
  id_user: string;
  id_dependent?: string | null;
  message: string;
}

export interface ExamResponse {
  id: string;
  id_patient: string;
  id_dependent?: string;
  dependent_name?: string;
  status: string;
  age: number;
  sex: string;
  weight_kg?: number;
  height_cm?: number;
  family_history: boolean;
  pre_existing_conditions?: string;
  has_pain: boolean;
  had_surgery: boolean;
  surgery_detail?: string;
  // Só coletado quando o exame é feito por Profissional/Instituição em um
  // paciente (ver GuardianInfoScreen) — sem contrato real no backend ainda,
  // fica só no mock local.
  guardian_name?: string;
  guardian_cpf?: string;
  guardian_birth_date?: string;
  guardian_relationship?: string;
  created_at: string;
  evaluation?: ExamEvaluation;
  retake?: ExamRetakeRequest;
}

export interface ExamEvaluation {
  opinion: string;
  agreesWithAi: boolean;
  evaluatedAt: string;
}

export interface ExamRetakeRequest {
  reason: string;
  requestedAt: string;
}

function buildDraftResponse(
  payload: CreateExamDraftPayload,
  overrides: Partial<Pick<ExamResponse, 'id' | 'id_patient' | 'id_dependent'>>,
): ExamResponse {
  return {
    id: overrides.id ?? 'mock-exam-' + Date.now(),
    id_patient: overrides.id_patient ?? 'mock-patient-id',
    id_dependent: overrides.id_dependent ?? payload.dependent_id,
    status: 'DRAFT',
    age: payload.age,
    sex: payload.sex,
    weight_kg: payload.weight_kg,
    height_cm: payload.height_cm,
    family_history: payload.family_history,
    pre_existing_conditions: payload.pre_existing_conditions,
    has_pain: payload.has_pain,
    had_surgery: payload.had_surgery,
    surgery_detail: payload.surgery_detail,
    created_at: new Date().toISOString(),
  };
}

export const createExamDraft = async (payload: CreateExamDraftPayload): Promise<ExamResponse> => {
  if (payload.patient_id) {
    // Backend não modela exame de Profissional sobre Paciente ainda — mock direto.
    console.warn('Mocking createExamDraft para exame de Profissional (patient_id)');
    await new Promise((resolve) => setTimeout(resolve, 500));
    const draft = buildDraftResponse(payload, {
      id: 'mock-exam-patient-' + Date.now(),
      id_patient: payload.patient_id,
    });
    mockExamHistory.push(draft);
    return draft;
  }

  try {
    // Tenta chamar a API. O backend recebe "sex" como Gender ("male"/"female"/"prefer_not_to_say")
    // e responde apenas com a confirmacao do rascunho (id_draft, id_user, id_dependent, message).
    // Os campos de anamnese completos do RF04 (peso, altura, doenças pré-existentes,
    // detalhe de cirurgia) ainda não têm contrato real no backend — seguem no payload
    // para quando existir, mas hoje só sobrevivem no mock local.
    const response = await api.post<DraftExamApiResponse>('/exams', {
      ...payload,
      sex: SEX_TO_GENDER[payload.sex] || payload.sex,
    });
    const draft = response.data;
    return buildDraftResponse(payload, {
      id: draft.id_draft,
      id_patient: draft.id_user,
      id_dependent: draft.id_dependent || payload.dependent_id,
    });
  } catch (error: any) {
    // Protótipo: qualquer falha do backend cai no mock, para nunca travar a
    // navegação entre telas.
    console.warn('Mocking createExamDraft (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const draft = buildDraftResponse(payload, {});
    mockExamHistory.push(draft);
    return draft;
  }
};

export const uploadExamImage = async (examId: string, imageUri: string): Promise<void> => {
  try {
    const formData = new FormData();
    // @ts-ignore - FormData on React Native accepts this object shape
    formData.append('file', {
      uri: imageUri,
      name: 'scoliosis_image.jpg',
      type: 'image/jpeg',
    });

    await api.post(`/exams/${examId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error: any) {
    console.warn('Mocking uploadExamImage (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate 2s upload
  }
};

// Mock Storage para o Frontend enquanto o histórico de exames por dependente
// não tem contrato real no backend — os rascunhos criados via mock (ver
// createExamDraft) são acrescentados aqui, para que a pré-preenchimento da
// anamnese (RF04) com o último exame do dependente funcione de ponta a ponta
// no protótipo.
let mockExamHistory: ExamResponse[] = [
  {
    id: 'mock-exam-1',
    id_patient: 'mock-patient-id',
    status: 'POSITIVE',
    age: 12,
    sex: 'F',
    family_history: false,
    has_pain: true,
    had_surgery: false,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'mock-exam-2',
    id_patient: 'mock-patient-id',
    id_dependent: 'mock-dep-1',
    dependent_name: 'João Souza',
    status: 'NEGATIVE',
    age: 9,
    sex: 'M',
    weight_kg: 32.4,
    height_cm: 134,
    family_history: false,
    pre_existing_conditions: 'Asma',
    has_pain: false,
    had_surgery: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    // Paciente do Profissional (id_patient real, ver patientsService) que já
    // passou por um exame antes — usado para demonstrar o pré-preenchimento
    // dos dados do responsável na tela de Responsável (GuardianInfoScreen).
    id: 'mock-exam-pat-1',
    id_patient: 'pat-1',
    dependent_name: 'Ana Silva',
    status: 'NEGATIVE',
    age: 12,
    sex: 'F',
    weight_kg: 38,
    height_cm: 148,
    family_history: false,
    has_pain: false,
    had_surgery: false,
    guardian_name: 'Carlos Silva',
    guardian_cpf: '111.222.333-44',
    guardian_birth_date: '10/05/1985',
    guardian_relationship: 'Pai',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mock-exam-3',
    id_patient: 'mock-patient-id',
    status: 'INCONCLUSIVE',
    age: 12,
    sex: 'F',
    family_history: false,
    has_pain: false,
    had_surgery: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'mock-exam-4',
    id_patient: 'mock-patient-id',
    status: 'FAILED',
    age: 12,
    sex: 'F',
    family_history: false,
    has_pain: false,
    had_surgery: false,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const getExamHistory = async (): Promise<ExamResponse[]> => {
  try {
    const response = await api.get<ExamResponse[]>('/exams');
    return response.data;
  } catch (error: any) {
    console.warn('Mocking getExamHistory (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return [...mockExamHistory];
  }
};

// RF04 — ao abrir a anamnese de um dependente que já tem exame anterior,
// pré-preenche o formulário com os dados do exame mais recente dele, para
// agilizar o fluxo quando os dados continuam os mesmos.
export const getLastExamForDependent = async (
  dependentId: string,
): Promise<ExamResponse | null> => {
  const history = await getExamHistory();
  const dependentExams = history
    .filter((exam) => exam.id_dependent === dependentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return dependentExams[0] ?? null;
};

// Paciente do Profissional/Instituição que já fez exame antes já tem um
// responsável cadastrado (ver GuardianInfoScreen) — pré-preenche com o mais
// recente, excluindo o rascunho atual (ainda sem dados de responsável).
export const getLastExamForPatient = async (
  patientId: string,
  excludeExamId?: string,
): Promise<ExamResponse | null> => {
  const history = await getExamHistory();
  const patientExams = history
    .filter((exam) => exam.id_patient === patientId && exam.id !== excludeExamId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return patientExams[0] ?? null;
};

export const retryExam = async (examId: string): Promise<{ status: string }> => {
  try {
    const response = await api.post<{ status: string }>(`/exams/${examId}/retry`);
    return response.data;
  } catch (error: any) {
    console.warn('Mocking retryExam (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { status: 'PENDING_AI' };
  }
};

export const evaluateExam = async (
  examId: string,
  payload: { opinion: string; agreesWithAi: boolean },
): Promise<ExamEvaluation> => {
  const evaluation: ExamEvaluation = { ...payload, evaluatedAt: new Date().toISOString() };
  try {
    await api.post(`/exams/${examId}/evaluation`, {
      opinion: payload.opinion,
      agrees_with_ai: payload.agreesWithAi,
    });
  } catch (error: any) {
    // Endpoint ainda não existe no backend — o parecer fica registrado só localmente.
    console.warn('Mocking evaluateExam (Backend endpoint missing)', error?.message);
  }
  // Persiste no mock local (não só no estado da store) para sobreviver a um
  // novo fetchExamHistory() — sem isso, o exame reaparecia na fila de
  // "para avaliar" ao trocar de tela e recarregar o histórico.
  const exam = mockExamHistory.find((e) => e.id === examId);
  if (exam) exam.evaluation = evaluation;
  return evaluation;
};

// Profissional pede para o paciente/dependente refazer o exame (ex.: foto
// com qualidade ruim, ângulo incorreto) em vez de emitir um parecer sobre o
// resultado atual — endpoint ainda não existe no backend, fica só no mock.
export const requestExamRetake = async (
  examId: string,
  reason: string,
): Promise<ExamRetakeRequest> => {
  const retake: ExamRetakeRequest = { reason, requestedAt: new Date().toISOString() };
  try {
    await api.post(`/exams/${examId}/retake`, { reason });
  } catch (error: any) {
    console.warn('Mocking requestExamRetake (Backend endpoint missing)', error?.message);
  }
  const exam = mockExamHistory.find((e) => e.id === examId);
  if (exam) exam.retake = retake;
  return retake;
};

export interface ExamGuardianPayload {
  name: string;
  cpf: string;
  birthDate: string;
  relationship: string;
}

export const updateExamGuardian = async (
  examId: string,
  guardian: ExamGuardianPayload,
): Promise<void> => {
  try {
    await api.post(`/exams/${examId}/guardian`, {
      name: guardian.name,
      cpf: guardian.cpf,
      birth_date: guardian.birthDate,
      relationship: guardian.relationship,
    });
  } catch (error: any) {
    // Endpoint ainda não existe no backend — dado do responsável fica só localmente.
    console.warn('Mocking updateExamGuardian (Backend endpoint missing)', error?.message);
  }
  const exam = mockExamHistory.find((e) => e.id === examId);
  if (exam) {
    exam.guardian_name = guardian.name;
    exam.guardian_cpf = guardian.cpf;
    exam.guardian_birth_date = guardian.birthDate;
    exam.guardian_relationship = guardian.relationship;
  }
};
