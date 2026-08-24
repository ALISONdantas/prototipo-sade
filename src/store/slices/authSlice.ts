import { AuthStoreSlice, RegisterData, AuthStoreState } from './types';
import * as SecureStore from '../../utils/storage';
import { api } from '../../services/api';

// Mapeia o perfil escolhido na UI para o id_role real da tabela `roles` (seed fixo do backend).
const ROLE_TO_ID: Record<RegisterData['role'], number> = {
  PATIENT: 1,
  PROFESSIONAL: 2,
  INSTITUTION: 3,
};

// Backend usa o VO Gender ("male" | "female" | "prefer_not_to_say"); a UI usa "M" | "F".
const GENDER_TO_ENUM: Record<string, string> = {
  M: 'male',
  F: 'female',
  O: 'prefer_not_to_say',
};

export const createAuthSlice: AuthStoreSlice<
  Pick<
    AuthStoreState,
    | 'isAuthenticated'
    | 'login'
    | 'logout'
    | 'register'
    | 'forgotPassword'
    | 'resetPassword'
    | 'changePassword'
  >
> = (set, get) => ({
  isAuthenticated: false,

  login: async (access_token: string) => {
    await SecureStore.setItemAsync('sade_access_token', access_token);
    set({ isAuthenticated: true });
    // Chama o fetchUser que vive no userSlice
    await get().fetchUser();
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Erro ao chamar rota de logout no servidor:', e);
    } finally {
      await SecureStore.deleteItemAsync('sade_access_token');
      // Reseta estado global do usuário e flag de auth
      set({ user: null, isAuthenticated: false });
    }
  },

  register: async (data: RegisterData) => {
    const nameParts = data.fullName.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || nameParts[0];
    const cpf = data.cpf.replace(/\D/g, '');
    const phone = data.phone.replace(/\D/g, '');
    const [day, month, year] = data.birthDate.split('/');
    const birth_date = `${year}-${month}-${day}`;

    const payload: Record<string, string | number> = {
      first_name,
      last_name,
      email: data.email.trim(),
      password: data.password,
      cpf,
      phone,
      birth_date,
      gender: GENDER_TO_ENUM[data.gender] || data.gender,
      id_role: ROLE_TO_ID[data.role],
    };

    if (data.crm) payload.crm = data.crm;
    if (data.especialidade) payload.especialidade = data.especialidade;
    if (data.conselho) payload.conselho = data.conselho;
    if (data.cnpj) payload.cnpj = data.cnpj.replace(/\D/g, '');
    if (data.institutionName) payload.institution_name = data.institutionName;
    if (data.responsibleName) payload.responsible_name = data.responsibleName;

    await api.post('/auth/register', payload);
  },

  forgotPassword: async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    await api.post('/auth/reset-password', { token, new_password: newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
});
