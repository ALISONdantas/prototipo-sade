import { api } from './api';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  unitId: string;
  unitName: string;
}

// TODO: substituir por chamada real quando o backend expuser o vínculo
// profissional -> instituição -> paciente (ver Plano de Implementação, risco R1).
const MOCK_PATIENTS: Patient[] = [
  { id: 'pat-1', name: 'Ana Silva', age: 12, sex: 'F', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
  { id: 'pat-2', name: 'Bruno Costa', age: 9, sex: 'M', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
  { id: 'pat-3', name: 'Carla Mendes', age: 15, sex: 'F', unitId: 'unit-2', unitName: 'Escola Girassol' },
  { id: 'pat-4', name: 'Daniel Souza', age: 10, sex: 'M', unitId: 'unit-2', unitName: 'Escola Girassol' },
  { id: 'pat-5', name: 'Eduarda Lima', age: 13, sex: 'F', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
];

export const searchPatients = async (query: string): Promise<Patient[]> => {
  try {
    const response = await api.get<Patient[]>('/professional/patients', { params: { q: query } });
    return response.data;
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking searchPatients (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      const normalized = query.trim().toLowerCase();
      if (!normalized) return MOCK_PATIENTS;
      return MOCK_PATIENTS.filter((patient) => patient.name.toLowerCase().includes(normalized));
    }
    throw error;
  }
};
