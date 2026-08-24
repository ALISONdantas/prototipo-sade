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
      if (!error.response || error.response?.status === 404) {
        console.warn('Mocking createDependent (Backend missing or CORS block)');
        return mockCreateDependent({
          name: data.name,
          age: calculateAge(data.birthDate),
          sex: GENDER_TO_SEX[data.gender],
          birthDate: data.birthDate,
          relationship: data.relationship,
          genderLabel: data.gender,
        });
      }
      throw error;
    }
  },

  updateDependent: async (id: string, data: CreateDependentData) => {
    const response = await api.put(`/dependents/${id}`, {
      name: data.name,
      birth_date: toIsoDate(data.birthDate),
      gender: GENDER_TO_ENUM[data.gender],
      relationship: data.relationship,
    });
    return response.data;
  },
};
