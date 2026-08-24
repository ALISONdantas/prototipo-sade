import { api } from './api';

export interface InstitutionAlert {
  id: string;
  examId: string;
  patientName: string;
  age: number;
  result: 'POSITIVE' | 'INCONCLUSIVE';
  examDate: string;
  resolved: boolean;
}

interface InstitutionAlertApiResponse {
  id_alert: string;
  id_exam: string;
  patient_name: string;
  age: number;
  ia_result: 'POSITIVE' | 'INCONCLUSIVE';
  exam_date: string;
  resolved: boolean;
}

// TODO(#137-frontend-followup): mock enquanto GET /api/v1/institution/alerts e
// POST /api/v1/institution/alerts/:id/resolve não existem no backend. Ver
// docs/frontend-institution-alerts-screen-issue-126.md para o contrato
// esperado da API real e a issue de backend correspondente.
let MOCK_ALERTS: InstitutionAlert[] = [
  {
    id: 'mock-alert-1',
    examId: 'mock-exam-101',
    patientName: 'Maria Eduarda Santos',
    age: 13,
    result: 'POSITIVE',
    examDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    resolved: false,
  },
  {
    id: 'mock-alert-2',
    examId: 'mock-exam-102',
    patientName: 'João Pedro Lima',
    age: 15,
    result: 'POSITIVE',
    examDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolved: false,
  },
  {
    id: 'mock-alert-3',
    examId: 'mock-exam-103',
    patientName: 'Ana Beatriz Costa',
    age: 11,
    result: 'INCONCLUSIVE',
    examDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    resolved: false,
  },
  {
    id: 'mock-alert-4',
    examId: 'mock-exam-104',
    patientName: 'Lucas Gabriel Ferreira',
    age: 16,
    result: 'POSITIVE',
    examDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    resolved: true,
  },
];

export const getInstitutionAlerts = async (): Promise<InstitutionAlert[]> => {
  try {
    const response = await api.get<InstitutionAlertApiResponse[]>('/institution/alerts');
    return response.data.map((alert) => ({
      id: alert.id_alert,
      examId: alert.id_exam,
      patientName: alert.patient_name,
      age: alert.age,
      result: alert.ia_result,
      examDate: alert.exam_date,
      resolved: alert.resolved,
    }));
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getInstitutionAlerts (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_ALERTS;
    }
    console.error('Erro ao buscar alertas da instituição:', error);
    throw error;
  }
};

export const resolveInstitutionAlert = async (alertId: string): Promise<void> => {
  try {
    await api.post(`/institution/alerts/${alertId}/resolve`);
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking resolveInstitutionAlert (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      MOCK_ALERTS = MOCK_ALERTS.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      );
      return;
    }
    console.error('Erro ao resolver alerta da instituição:', error);
    throw error;
  }
};

// TODO: substituir por chamada real quando o backend expuser os alertas
// escopados aos pacientes das unidades atendidas pelo profissional (ver
// Plano de Implementação, seção 3.6).
let MOCK_PROFESSIONAL_ALERTS: InstitutionAlert[] = [
  {
    id: 'mock-prof-alert-1',
    examId: 'mock-exam-201',
    patientName: 'Ana Silva',
    age: 12,
    result: 'POSITIVE',
    examDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    resolved: false,
  },
  {
    id: 'mock-prof-alert-2',
    examId: 'mock-exam-202',
    patientName: 'Carla Mendes',
    age: 15,
    result: 'INCONCLUSIVE',
    examDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolved: false,
  },
];

export const getProfessionalAlerts = async (): Promise<InstitutionAlert[]> => {
  try {
    const response = await api.get<InstitutionAlertApiResponse[]>('/professional/alerts');
    return response.data.map((alert) => ({
      id: alert.id_alert,
      examId: alert.id_exam,
      patientName: alert.patient_name,
      age: alert.age,
      result: alert.ia_result,
      examDate: alert.exam_date,
      resolved: alert.resolved,
    }));
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getProfessionalAlerts (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_PROFESSIONAL_ALERTS;
    }
    console.error('Erro ao buscar alertas do profissional:', error);
    throw error;
  }
};

export const resolveProfessionalAlert = async (alertId: string): Promise<void> => {
  try {
    await api.post(`/professional/alerts/${alertId}/resolve`);
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking resolveProfessionalAlert (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      MOCK_PROFESSIONAL_ALERTS = MOCK_PROFESSIONAL_ALERTS.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      );
      return;
    }
    console.error('Erro ao resolver alerta do profissional:', error);
    throw error;
  }
};
