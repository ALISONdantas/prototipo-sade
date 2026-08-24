import { StateCreator } from 'zustand';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role_code?: string;
  cpf?: string;
  phone?: string;
}

export interface RegisterData {
  fullName: string;
  cpf: string;
  email: string;
  password: string;
  birthDate: string;
  gender: string;
  role: 'PATIENT' | 'PROFESSIONAL' | 'INSTITUTION';
  crm?: string;
  especialidade?: string;
  conselho?: string;
  cnpj?: string;
  institutionName?: string;
  responsibleName?: string;
  phone: string;
}

export interface AuthSlice {
  isAuthenticated: boolean;
  login: (access_token: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface UserSlice {
  user: User | null;
  fetchUser: () => Promise<void>;
}

export interface SessionSlice {
  isLoading: boolean;
  restoreSession: () => Promise<void>;
}

// O estado global combinado
export type AuthStoreState = AuthSlice & UserSlice & SessionSlice;

// O helper genérico para criarmos cada slice com acesso completo ao store
export type AuthStoreSlice<T> = StateCreator<AuthStoreState, [], [], T>;
