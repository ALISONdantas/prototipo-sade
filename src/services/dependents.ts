import { api } from './api';
import { mockCreateDependent } from './dependentsService';

export interface CreateDependentData {
  name: string;
  birthDate: string; // DD/MM/AAAA
  gender: 'Masculino' | 'Feminino' | 'Outro';
  relationship: string;
}

const GENDER_TO_ENUM: Record<string, string> = {
  Masculino: 'male',
  Feminino: 'female',
  Outro: 'prefer_not_to_say',
};

const GENDER_TO_SEX: Record<string, string> = {
  Masculino: 'M',
  Feminino: 'F',
  Outro: 'O',
};

function toIsoDate(birthDateBr: string): string {
  const [day, month, year] = birthDateBr.split('/');
  return `${year}-${month}-${day}`;
}

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

export const dependentsService = {
  createDependent: async (data: CreateDependentData) => {
    try {
      const response = await api.post('/dependents', {
        name: data.name,
        birth_date: toIsoDate(data.birthDate),
        gender: GENDER_TO_ENUM[data.gender],
        relationship: data.relationship,
      });
      return response.data;
    } catch (error: any) {
      // Protótipo: qualquer falha do backend (404, 500, schema desatualizado
      // etc.) cai no mock, para nunca travar a navegação entre telas.
      console.warn('Mocking createDependent (Backend indisponível ou com erro)', error?.message);
      return mockCreateDependent({
        name: data.name,
        age: calculateAge(data.birthDate),
        sex: GENDER_TO_SEX[data.gender],
        birthDate: data.birthDate,
        relationship: data.relationship,
        genderLabel: data.gender,
      });
    }
  },

  updateDependent: async (id: string, data: CreateDependentData) => {
    try {
      const response = await api.put(`/dependents/${id}`, {
        name: data.name,
        birth_date: toIsoDate(data.birthDate),
        gender: GENDER_TO_ENUM[data.gender],
        relationship: data.relationship,
      });
      return response.data;
    } catch (error: any) {
      console.warn('Mocking updateDependent (Backend indisponível ou com erro)', error?.message);
      return {
        id_dependent: id,
        name: data.name,
        birth_date: toIsoDate(data.birthDate),
        gender: GENDER_TO_ENUM[data.gender],
        relationship: data.relationship,
        is_active: true,
      };
    }
  },
};
