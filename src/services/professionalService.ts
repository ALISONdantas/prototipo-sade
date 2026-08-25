import { api } from './api';

export interface AttendedUnit {
  id: string;
  name: string;
  type: 'school' | 'clinic' | 'health_center';
  address: string;
  contact: string;
  state: string; // UF
  city: string;
}

export interface UnitFilters {
  state?: string;
  city?: string;
}

// TODO: substituir por chamada real quando o backend expuser o vínculo
// profissional -> instituição (ver Plano de Implementação, risco R3).
export const UNITS_CATALOG: AttendedUnit[] = [
  {
    id: 'unit-1',
    name: 'Clínica São Lucas',
    type: 'clinic',
    address: 'Rua das Acácias, 120 — Centro',
    contact: '(11) 4002-8922',
    state: 'SP',
    city: 'São Paulo',
  },
  {
    id: 'unit-2',
    name: 'Escola Girassol',
    type: 'school',
    address: 'Av. dos Girassóis, 45 — Jardim das Flores',
    contact: '(11) 4002-8923',
    state: 'SP',
    city: 'São Paulo',
  },
  {
    id: 'unit-3',
    name: 'Centro de Saúde Vila Nova',
    type: 'health_center',
    address: 'Rua Vila Nova, 300',
    contact: '(11) 4002-8930',
    state: 'SP',
    city: 'São Paulo',
  },
  {
    id: 'unit-4',
    name: 'Escola Municipal Praia de Iracema',
    type: 'school',
    address: 'Av. Beira Mar, 210',
    contact: '(85) 4002-8940',
    state: 'CE',
    city: 'Fortaleza',
  },
  {
    id: 'unit-5',
    name: 'Clínica Aldeota',
    type: 'clinic',
    address: 'Av. Santos Dumont, 1500',
    contact: '(85) 4002-8950',
    state: 'CE',
    city: 'Fortaleza',
  },
  {
    id: 'unit-6',
    name: 'Centro de Saúde Meireles',
    type: 'health_center',
    address: 'Rua Meireles, 320',
    contact: '(85) 4002-8960',
    state: 'CE',
    city: 'Fortaleza',
  },
];

// IDs das unidades já atendidas pelo profissional logado (mock em memória).
let ATTENDED_UNIT_IDS = new Set<string>(['unit-1', 'unit-2']);

export const getAttendedUnits = async (): Promise<AttendedUnit[]> => {
  try {
    const response = await api.get<AttendedUnit[]>('/professional/units');
    return response.data;
  } catch (error: any) {
    console.warn('Mocking getAttendedUnits (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return UNITS_CATALOG.filter((unit) => ATTENDED_UNIT_IDS.has(unit.id));
  }
};

export const getAvailableUnits = async (filters: UnitFilters = {}): Promise<AttendedUnit[]> => {
  try {
    const response = await api.get<AttendedUnit[]>('/institutions', { params: filters });
    return response.data;
  } catch (error: any) {
    console.warn('Mocking getAvailableUnits (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return UNITS_CATALOG.filter(
      (unit) => (!filters.state || unit.state === filters.state) && (!filters.city || unit.city === filters.city),
    );
  }
};

export const getUnitStates = (): string[] => {
  return Array.from(new Set(UNITS_CATALOG.map((unit) => unit.state))).sort();
};

export const getUnitCities = (state: string): string[] => {
  return Array.from(
    new Set(UNITS_CATALOG.filter((unit) => unit.state === state).map((unit) => unit.city)),
  ).sort();
};

export const isUnitAttended = (unitId: string): boolean => ATTENDED_UNIT_IDS.has(unitId);

export const addAttendedUnit = async (unitId: string): Promise<void> => {
  try {
    await api.post('/professional/units', { unit_id: unitId });
  } catch (error: any) {
    console.warn('Mocking addAttendedUnit (Backend indisponível ou com erro)', error?.message);
  } finally {
    // Protótipo: o vínculo profissional -> instituição ainda não existe no
    // backend (ver Plano de Implementação, risco R3) — fica só no mock local.
    ATTENDED_UNIT_IDS = new Set([...ATTENDED_UNIT_IDS, unitId]);
  }
};

export const removeAttendedUnit = async (unitId: string): Promise<void> => {
  try {
    await api.delete(`/professional/units/${unitId}`);
  } catch (error: any) {
    console.warn('Mocking removeAttendedUnit (Backend indisponível ou com erro)', error?.message);
  } finally {
    const next = new Set(ATTENDED_UNIT_IDS);
    next.delete(unitId);
    ATTENDED_UNIT_IDS = next;
  }
};
