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
  birth_date?: string;
  gender?: string;
  age?: number;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: 'PATIENT' | 'PROFESSIONAL' | 'INSTITUTION';
  phone: string;
  termsAccepted: boolean;
  // Pessoa física — não se aplica a Instituição.
  cpf?: string;
  birthDate?: string;
  gender?: string;
  // Profissional
  crm?: string;
  especialidade?: string;
  conselho?: string;
  // Instituição — não é pessoa física, por isso não pede CPF/nascimento/gênero.
  cnpj?: string;
  institutionName?: string;
  institutionType?: string;
  institutionAddress?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
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
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

export interface SessionSlice {
  isLoading: boolean;
  restoreSession: () => Promise<void>;
}

// O estado global combinado
export type AuthStoreState = AuthSlice & UserSlice & SessionSlice;

// O helper genérico para criarmos cada slice com acesso completo ao store
export type AuthStoreSlice<T> = StateCreator<AuthStoreState, [], [], T>;
