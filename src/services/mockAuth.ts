import { User } from '../store/slices/types';

interface MockAccount {
  password: string;
  token: string;
  user: User;
}

// Login/sessão totalmente mockados para quando o backend não está acessível
// (ex.: build estático publicado no GitHub Pages, sem servidor real por trás).
// Cobre as mesmas 5 contas de demonstração já usadas em desenvolvimento local.
const MOCK_ACCOUNTS: Record<string, MockAccount> = {
  'sade.seed.admin@gmail.com': {
    password: 'Senha123!',
    token: 'mock-token-admin',
    user: {
      id: 1,
      email: 'sade.seed.admin@gmail.com',
      first_name: 'Admin',
      last_name: 'Seed',
      full_name: 'Admin Seed',
      role_code: 'admin',
      cpf: '52998224725',
      phone: '11999999999',
    },
  },
  'paciente.demo@sade.com': {
    password: 'Senha123!',
    token: 'mock-token-patient',
    user: {
      id: 2,
      email: 'paciente.demo@sade.com',
      first_name: 'Paciente',
      last_name: 'Demo',
      full_name: 'Paciente Demo',
      role_code: 'patient',
      cpf: '11122233396',
      phone: '11988887777',
    },
  },
  'profissional.demo@sade.com': {
    password: 'Senha123!',
    token: 'mock-token-professional',
    user: {
      id: 3,
      email: 'profissional.demo@sade.com',
      first_name: 'Profissional',
      last_name: 'Demo',
      full_name: 'Profissional Demo',
      role_code: 'professional',
      cpf: '11144477735',
      phone: '11988887777',
    },
  },
  'instituicao.demo@sade.com': {
    password: 'Senha123!',
    token: 'mock-token-institution',
    user: {
      id: 4,
      email: 'instituicao.demo@sade.com',
      first_name: 'Instituicao',
      last_name: 'Demo',
      full_name: 'Instituicao Demo',
      role_code: 'institution_manager',
      cnpj: '12345678000199',
      phone: '11988887777',
    },
  },
  'pesquisador.demo@sade.com': {
    password: 'Senha123!',
    token: 'mock-token-researcher',
    user: {
      id: 5,
      email: 'pesquisador.demo@sade.com',
      first_name: 'Pesquisador',
      last_name: 'Demo',
      full_name: 'Pesquisador Demo',
      role_code: 'researcher',
      cpf: '77788899941',
      phone: '11988887777',
    },
  },
};

export function mockLogin(email: string, password: string): { access_token: string } | null {
  const account = MOCK_ACCOUNTS[email.trim().toLowerCase()];
  if (account && account.password === password) {
    return { access_token: account.token };
  }
  return null;
}

export function mockFetchUser(token: string | null | undefined): User | null {
  if (!token) return null;
  const account = Object.values(MOCK_ACCOUNTS).find((acc) => acc.token === token);
  return account ? account.user : null;
}
