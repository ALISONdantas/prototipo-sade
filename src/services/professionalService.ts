import { api } from './api';

export interface AttendedUnit {
  id: string;
  name: string;
  type: 'school' | 'clinic' | 'health_center';
  address: string;
  contact: string;
}

// TODO: substituir por chamada real quando o backend expuser o vínculo
// profissional -> instituição (ver Plano de Implementação, risco R3).
const MOCK_UNITS: AttendedUnit[] = [
  {
    id: 'unit-1',
    name: 'Clínica São Lucas',
    type: 'clinic',
    address: 'Rua das Acácias, 120 — Centro',
    contact: '(11) 4002-8922',
  },
  {
    id: 'unit-2',
    name: 'Escola Girassol',
    type: 'school',
    address: 'Av. dos Girassóis, 45 — Jardim das Flores',
    contact: '(11) 4002-8923',
  },
];

export const getAttendedUnits = async (): Promise<AttendedUnit[]> => {
  try {
    const response = await api.get<AttendedUnit[]>('/professional/units');
    return response.data;
  } catch (error: any) {
    if (!error.response || error.response.status === 404) {
      console.warn('Mocking getAttendedUnits (Backend endpoint missing)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_UNITS;
    }
    throw error;
  }
};
