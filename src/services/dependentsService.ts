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

// Mock Storage para o Frontend enquanto a API do Backend (Issue #231) não está pronta.
// Já vem com um dependente pré-cadastrado (mock-dep-1, mesmo id usado no
// histórico de exames mockado em examService.ts) para demonstrar, sem passos
// extras, o pré-preenchimento da anamnese com o último exame do dependente.
export let mockDependents: Dependent[] = [
  {
    id: 'mock-dep-1',
    name: 'João Souza',
    age: 9,
    sex: 'M',
    birthDate: '15/03/2017',
    relationship: 'Filho',
    genderLabel: 'Masculino',
  },
];

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
    // Protótipo: qualquer falha do backend cai no mock, para nunca travar a
    // navegação entre telas.
    console.warn('Mocking getDependents (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...mockDependents]; // Retorna cópia do estado em memória
  }
};

export const deleteDependent = async (id: string): Promise<void> => {
  try {
    await api.delete(`/dependents/${id}`);
  } catch (error: any) {
    console.warn('Mocking deleteDependent (Backend indisponível ou com erro)', error?.message);
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockDependents = mockDependents.filter((d) => d.id !== id);
  }
};
