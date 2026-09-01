import { create } from 'zustand';
import {
  createExamDraft,
  uploadExamImage,
  retryExam as retryExamRequest,
  getExamHistory,
  evaluateExam as evaluateExamRequest,
  requestExamRetake as requestExamRetakeRequest,
  updateExamGuardian as updateExamGuardianRequest,
  CreateExamDraftPayload,
  ExamGuardianPayload,
  ExamResponse,
} from '../services/examService';

interface ExamState {
  currentExam: ExamResponse | null;
  examHistory: ExamResponse[];
  isSubmitting: boolean;
  isLoadingHistory: boolean;
  error: string | null;
}

interface ExamActions {
  createExam: (payload: CreateExamDraftPayload) => Promise<void>;
  uploadImage: (imageUri: string) => Promise<void>;
  fetchExamHistory: () => Promise<void>;
  retryExam: (examId: string) => Promise<void>;
  evaluateExam: (examId: string, opinion: string, agreesWithAi: boolean) => Promise<void>;
  requestRetake: (examId: string, reason: string) => Promise<void>;
  updateGuardianInfo: (guardian: ExamGuardianPayload) => Promise<void>;
  clearCurrentExam: () => void;
}

export const useExamStore = create<ExamState & ExamActions>((set, get) => ({
  currentExam: null,
  examHistory: [],
  isSubmitting: false,
  isLoadingHistory: false,
  error: null,

  createExam: async (payload: CreateExamDraftPayload) => {
    set({ isSubmitting: true, error: null });
    try {
      const exam = await createExamDraft(payload);
      set({ currentExam: exam, isSubmitting: false });
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao criar o rascunho do exame',
        isSubmitting: false,
      });
      throw error;
    }
  },

  uploadImage: async (imageUri: string) => {
    const { currentExam } = get();
    if (!currentExam) {
      throw new Error('Nenhum exame em andamento para anexar a imagem.');
    }

    set({ isSubmitting: true, error: null });
    try {
      await uploadExamImage(currentExam.id, imageUri);

      // Update local status to PENDING_AI
      set((state) => ({
        currentExam: state.currentExam ? { ...state.currentExam, status: 'PENDING_AI' } : null,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao fazer upload da imagem',
        isSubmitting: false,
      });
      throw error;
    }
  },

  fetchExamHistory: async () => {
    set({ isLoadingHistory: true, error: null });
    try {
      const history = await getExamHistory();
      set({ examHistory: history, isLoadingHistory: false });
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao buscar histórico de exames',
        isLoadingHistory: false,
      });
    }
  },

  retryExam: async (examId: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const { status } = await retryExamRequest(examId);
      set((state) => ({
        currentExam:
          state.currentExam?.id === examId ? { ...state.currentExam, status } : state.currentExam,
        examHistory: state.examHistory.map((exam) =>
          exam.id === examId ? { ...exam, status } : exam,
        ),
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao tentar novamente o exame',
        isSubmitting: false,
      });
      throw error;
    }
  },

  evaluateExam: async (examId: string, opinion: string, agreesWithAi: boolean) => {
    set({ isSubmitting: true, error: null });
    try {
      const evaluation = await evaluateExamRequest(examId, { opinion, agreesWithAi });
      set((state) => ({
        currentExam:
          state.currentExam?.id === examId
            ? { ...state.currentExam, evaluation }
            : state.currentExam,
        examHistory: state.examHistory.map((exam) =>
          exam.id === examId ? { ...exam, evaluation } : exam,
        ),
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao enviar o parecer do profissional',
        isSubmitting: false,
      });
      throw error;
    }
  },

  requestRetake: async (examId: string, reason: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const retake = await requestExamRetakeRequest(examId, reason);
      set((state) => ({
        currentExam:
          state.currentExam?.id === examId ? { ...state.currentExam, retake } : state.currentExam,
        examHistory: state.examHistory.map((exam) =>
          exam.id === examId ? { ...exam, retake } : exam,
        ),
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao solicitar a repetição do exame',
        isSubmitting: false,
      });
      throw error;
    }
  },

  updateGuardianInfo: async (guardian: ExamGuardianPayload) => {
    const { currentExam } = get();
    if (!currentExam) return;

    set({ isSubmitting: true, error: null });
    try {
      await updateExamGuardianRequest(currentExam.id, guardian);
      set((state) => ({
        currentExam: state.currentExam
          ? {
              ...state.currentExam,
              guardian_name: guardian.name,
              guardian_cpf: guardian.cpf,
              guardian_birth_date: guardian.birthDate,
              guardian_relationship: guardian.relationship,
            }
          : null,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao salvar os dados do responsável',
        isSubmitting: false,
      });
      throw error;
    }
  },

  clearCurrentExam: () => {
    set({ currentExam: null, error: null });
  },
}));
