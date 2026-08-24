import { api } from './api';

export interface CreateExamDraftPayload {
  dependent_id?: string;
  // Exame feito por um Profissional em um paciente da(s) unidade(s) que ele
  // atende — o backend ainda não modela essa relação (ver Plano de
  // Implementação, risco R1), então esse caso sempre resolve via mock.
  patient_id?: string;
  age: number;
  sex: string;
  family_history: boolean;
  has_pain: boolean;
  had_surgery: boolean;
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
  family_history: boolean;
  has_pain: boolean;
  had_surgery: boolean;
  created_at: string;
  evaluation?: ExamEvaluation;
}

export interface ExamEvaluation {
  opinion: string;
  agreesWithAi: boolean;
  evaluatedAt: string;
}

export const createExamDraft = async (payload: CreateExamDraftPayload): Promise<ExamResponse> => {
  if (payload.patient_id) {
    // Backend não modela exame de Profissional sobre Paciente ainda — mock direto.
    console.warn('Mocking createExamDraft para exame de Profissional (patient_id)');
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: 'mock-exam-patient-' + Date.now(),
      id_patient: payload.patient_id,
      status: 'DRAFT',
      age: payload.age,
      sex: payload.sex,
      family_history: payload.family_history,
      has_pain: payload.has_pain,
      had_surgery: payload.had_surgery,
      created_at: new Date().toISOString(),
    };
  }

  try {
    // Tenta chamar a API. O backend recebe "sex" como Gender ("male"/"female"/"prefer_not_to_say")
    // e responde apenas com a confirmacao do rascunho (id_draft, id_user, id_dependent, message),
    // entao adaptamos os dois lados para o formato que o restante do app espera.
    const response = await api.post<DraftExamApiResponse>('/exams', {
      ...payload,
      sex: SEX_TO_GENDER[payload.sex] || payload.sex,
    });
    const draft = response.data;
    return {
      id: draft.id_draft,
      id_patient: draft.id_user,
      id_dependent: draft.id_dependent || payload.dependent_id,
      status: 'DRAFT',
      age: payload.age,
      sex: payload.sex,
      family_history: payload.family_history,
      has_pain: payload.has_pain,
      had_surgery: payload.had_surgery,
      created_at: new Date().toISOString(),
    };
  } catch (error: any) {
    // Protótipo: qualquer falha do backend cai no mock, para nunca travar a
    // navegação entre telas.
    console.warn('Mocking createExamDraft (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      id: 'mock-exam-' + Date.now(),
      id_patient: 'mock-patient-id',
      id_dependent: payload.dependent_id,
      status: 'DRAFT',
      age: payload.age,
      sex: payload.sex,
      family_history: payload.family_history,
      has_pain: payload.has_pain,
      had_surgery: payload.had_surgery,
      created_at: new Date().toISOString(),
    };
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

export const getExamHistory = async (): Promise<ExamResponse[]> => {
  try {
    const response = await api.get<ExamResponse[]>('/exams');
    return response.data;
  } catch (error: any) {
    {
      console.warn('Mocking getExamHistory (Backend indisponível ou com erro)', error?.message);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return [
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
          family_history: false,
          has_pain: false,
          had_surgery: false,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
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
    }
  }
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
    return evaluation;
  } catch (error: any) {
    // Endpoint ainda não existe no backend — o parecer fica registrado só localmente.
    console.warn('Mocking evaluateExam (Backend endpoint missing)', error?.message);
    return evaluation;
  }
};
