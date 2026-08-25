import { api } from './api';
import { AttendedUnit, UNITS_CATALOG } from './professionalService';

export type MonitoredInstitution = AttendedUnit;

export interface InstitutionFilters {
  state?: string;
  city?: string;
}

// TODO: substituir por chamada real quando o backend expuser o vínculo
// pesquisador -> instituições monitoradas.
let MONITORED_INSTITUTION_IDS = new Set<string>(['unit-1']);

export const getMonitoredInstitutions = async (): Promise<MonitoredInstitution[]> => {
  try {
    const response = await api.get<MonitoredInstitution[]>('/research/institutions');
    return response.data;
  } catch (error: any) {
    console.warn('Mocking getMonitoredInstitutions (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return UNITS_CATALOG.filter((unit) => MONITORED_INSTITUTION_IDS.has(unit.id));
  }
};

export const getAvailableInstitutions = async (
  filters: InstitutionFilters = {},
): Promise<MonitoredInstitution[]> => {
  try {
    const response = await api.get<MonitoredInstitution[]>('/institutions', { params: filters });
    return response.data;
  } catch (error: any) {
    console.warn('Mocking getAvailableInstitutions (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return UNITS_CATALOG.filter(
      (unit) => (!filters.state || unit.state === filters.state) && (!filters.city || unit.city === filters.city),
    );
  }
};

export const getInstitutionStates = (): string[] => {
  return Array.from(new Set(UNITS_CATALOG.map((unit) => unit.state))).sort();
};

export const getInstitutionCities = (state: string): string[] => {
  return Array.from(
    new Set(UNITS_CATALOG.filter((unit) => unit.state === state).map((unit) => unit.city)),
  ).sort();
};

export const isInstitutionMonitored = (institutionId: string): boolean =>
  MONITORED_INSTITUTION_IDS.has(institutionId);

export const addMonitoredInstitution = async (institutionId: string): Promise<void> => {
  try {
    await api.post('/research/institutions', { institution_id: institutionId });
  } catch (error: any) {
    console.warn('Mocking addMonitoredInstitution (Backend indisponível ou com erro)', error?.message);
  } finally {
    MONITORED_INSTITUTION_IDS = new Set([...MONITORED_INSTITUTION_IDS, institutionId]);
  }
};

export const removeMonitoredInstitution = async (institutionId: string): Promise<void> => {
  try {
    await api.delete(`/research/institutions/${institutionId}`);
  } catch (error: any) {
    console.warn('Mocking removeMonitoredInstitution (Backend indisponível ou com erro)', error?.message);
  } finally {
    const next = new Set(MONITORED_INSTITUTION_IDS);
    next.delete(institutionId);
    MONITORED_INSTITUTION_IDS = next;
  }
};
