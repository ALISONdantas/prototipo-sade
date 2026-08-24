import { AuthStoreSlice, AuthStoreState } from './types';
import * as SecureStore from '../../utils/storage';

export const createSessionSlice: AuthStoreSlice<
  Pick<AuthStoreState, 'isLoading' | 'restoreSession'>
> = (set, get) => ({
  isLoading: true,

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('sade_access_token');
      if (token) {
        await get().fetchUser();
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },
});
