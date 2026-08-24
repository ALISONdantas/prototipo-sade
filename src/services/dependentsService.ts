import { api } from './api';

export type GenderLabel = 'Masculino' | 'Feminino' | 'Outro';

export interface Dependent {
  id: string;
  name: string;
  age: number;
  sex: string;
  birthDate: string; // DD/MM/AAAA, para pre-preencher edição
  relationship: string;
  genderLabel: GenderLabel;
}

interface DependentApiResponse {
  id_dependent: string;
  id_responsible: string;
  name: string;
  birth_date: string;
  gender: string;
  relationship: string;
  is_active: boolean;
}

// Backend usa o VO Gender ("male"/"female"/"prefer_not_to_say"); a UI usa "M"/"F"/"O" ou rótulo PT-BR.
const GENDER_TO_SEX: Record<string, string> = {
  male: 'M',
  female: 'F',
  prefer_not_to_say: 'O',
};

const GENDER_TO_LABEL: Record<string, GenderLabel> = {
  male: 'Masculino',
  female: 'Feminino',
  prefer_not_to_say: 'Outro',
};

function isoToBrDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function calculateAge(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function mapDependent(item: DependentApiResponse): Dependent {
  return {
    id: item.id_dependent,
    name: item.name,
    age: calculateAge(item.birth_date),
    sex: GENDER_TO_SEX[item.gender] || 'O',
    birthDate: isoToBrDate(item.birth_date),
    relationship: item.relationship,
    genderLabel: GENDER_TO_LABEL[item.gender] || 'Outro',
  };
}

// Mock Storage para o Frontend enquanto a API do Backend (Issue #231) não está pronta
export let mockDependents: Dependent[] = [];

export const mockCreateDependent = async (data: {
  name: string;
  age: number;
  sex: string;
  birthDate?: string;
  relationship?: string;
  genderLabel?: GenderLabel;
}): Promise<Dependent> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newDep: Dependent = {
    id: 'mock-dep-' + Date.now(),
    name: data.name,
    age: data.age,
    sex: data.sex,
    birthDate: data.birthDate || '',
    relationship: data.relationship || '',
    genderLabel: data.genderLabel || 'Outro',
  };
  mockDependents.push(newDep);
  return newDep;
};

export const getDependents = async (): Promise<Dependent[]> => {
  try {
    const response = await api.get<DependentApiResponse[]>('/dependents');
    return response.data.map(mapDependent);
  } catch (error: any) {
    if (!error.response || error.response?.status === 404) {
      console.warn('Mocking getDependents (Backend missing or CORS block)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [...mockDependents]; // Retorna cópia do estado em memória
    }
    console.error('Erro ao buscar dependentes:', error);
    throw error;
  }
};

export const deleteDependent = async (id: string): Promise<void> => {
  try {
    await api.delete(`/dependents/${id}`);
  } catch (error: any) {
    if (!error.response || error.response?.status === 404) {
      console.warn('Mocking deleteDependent (Backend missing or CORS block)');
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockDependents = mockDependents.filter((d) => d.id !== id);
      return;
    }
    console.error(`Erro ao deletar o dependente ${id}:`, error);
    throw error;
  }
};
