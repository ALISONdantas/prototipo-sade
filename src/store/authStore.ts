import { create } from 'zustand';
import { AuthStoreState } from './slices/types';
import { createAuthSlice } from './slices/authSlice';
import { createUserSlice } from './slices/userSlice';
import { createSessionSlice } from './slices/sessionSlice';

// Re-exportamos os tipos principais para não quebrar quem os importava diretamente do authStore
export type { User, RegisterData } from './slices/types';

export const useAuthStore = create<AuthStoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUserSlice(...a),
  ...createSessionSlice(...a),
}));
