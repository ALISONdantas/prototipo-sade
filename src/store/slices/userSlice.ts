import { AuthStoreSlice, AuthStoreState } from './types';
import * as SecureStore from '../../utils/storage';
import { api } from '../../services/api';

export const createUserSlice: AuthStoreSlice<Pick<AuthStoreState, 'user' | 'fetchUser'>> = (
  set,
  get,
) => ({
  user: null,

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      await SecureStore.deleteItemAsync('sade_access_token');
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
});
