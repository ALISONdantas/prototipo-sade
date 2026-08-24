import { api } from './api';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  unitId: string;
  unitName: string;
}

export interface CreatePatientData {
  name: string;
  birthDate: string; // DD/MM/AAAA
  sex: 'M' | 'F' | 'O';
  unitId: string;
  unitName: string;
}

// TODO: substituir por chamada real quando o backend expuser o vínculo
// profissional -> instituição -> paciente (ver Plano de Implementação, risco R1).
let MOCK_PATIENTS: Patient[] = [
  { id: 'pat-1', name: 'Ana Silva', age: 12, sex: 'F', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
  { id: 'pat-2', name: 'Bruno Costa', age: 9, sex: 'M', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
  { id: 'pat-3', name: 'Carla Mendes', age: 15, sex: 'F', unitId: 'unit-2', unitName: 'Escola Girassol' },
  { id: 'pat-4', name: 'Daniel Souza', age: 10, sex: 'M', unitId: 'unit-2', unitName: 'Escola Girassol' },
  { id: 'pat-5', name: 'Eduarda Lima', age: 13, sex: 'F', unitId: 'unit-1', unitName: 'Clínica São Lucas' },
];

function calculateAge(birthDateBr: string): number {
  const [day, month, year] = birthDateBr.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export const searchPatients = async (query: string): Promise<Patient[]> => {
  try {
    const response = await api.get<Patient[]>('/professional/patients', { params: { q: query } });
    return response.data;
  } catch (error: any) {
    console.warn('Mocking searchPatients (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const normalized = query.trim().toLowerCase();
    if (!normalized) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter((patient) => patient.name.toLowerCase().includes(normalized));
  }
};

export const createPatient = async (data: CreatePatientData): Promise<Patient> => {
  try {
    const response = await api.post<Patient>('/professional/patients', {
      name: data.name,
      birth_date: data.birthDate,
      sex: data.sex,
      unit_id: data.unitId,
    });
    return response.data;
  } catch (error: any) {
    // Protótipo: cadastro de paciente novo pelo Profissional ainda não existe
    // no backend (mesmo gap do vínculo profissional->paciente, ver risco R1) —
    // fica só no mock local, para nunca travar a navegação.
    console.warn('Mocking createPatient (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newPatient: Patient = {
      id: 'pat-' + Date.now(),
      name: data.name,
      age: calculateAge(data.birthDate),
      sex: data.sex,
      unitId: data.unitId,
      unitName: data.unitName,
    };
    MOCK_PATIENTS = [...MOCK_PATIENTS, newPatient];
    return newPatient;
  }
};
