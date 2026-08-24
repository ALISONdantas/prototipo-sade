import { AuthStoreSlice, AuthStoreState, UpdateProfileData } from './types';
import * as SecureStore from '../../utils/storage';
import { api } from '../../services/api';
import { mockFetchUser } from '../../services/mockAuth';

export const createUserSlice: AuthStoreSlice<
  Pick<AuthStoreState, 'user' | 'fetchUser' | 'updateProfile'>
> = (set, get) => ({
  user: null,

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      // Sem backend por trás (ex.: GitHub Pages) — se o token guardado for de
      // uma sessão mockada (ver mockAuth.ts), a sessão continua normalmente.
      const token = await SecureStore.getItemAsync('sade_access_token');
      const mockUser = mockFetchUser(token);
      if (mockUser) {
        set({ user: mockUser, isAuthenticated: true });
      } else {
        console.error('Erro ao buscar dados do usuário:', error);
        await SecureStore.deleteItemAsync('sade_access_token');
        set({ user: null, isAuthenticated: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    const currentUser = get().user;
    const [firstName, ...rest] = (data.fullName ?? currentUser?.full_name ?? '').split(' ');

    try {
      const response = await api.patch('/users/me', {
        first_name: firstName,
        last_name: rest.join(' '),
        phone: data.phone,
      });
      set({ user: { ...currentUser, ...response.data } });
    } catch (error: any) {
      // Endpoint ainda não existe no backend (protótipo): atualiza só o estado local.
      console.warn('Mocking updateProfile (Backend endpoint missing)', error?.message);
      set({
        user: currentUser
          ? {
              ...currentUser,
              full_name: data.fullName ?? currentUser.full_name,
              first_name: firstName || currentUser.first_name,
              last_name: rest.length > 0 ? rest.join(' ') : currentUser.last_name,
              phone: data.phone ?? currentUser.phone,
            }
          : currentUser,
      });
    }
  },
});
