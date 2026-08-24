import axios from 'axios';
import * as SecureStore from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// ⚠️ MOCK TEMPORÁRIO PARA TESTES DO FRONTEND
// Remova isso quando o Docker voltar a funcionar
// ==========================================
// import MockAdapter from 'axios-mock-adapter';
// const mock = new MockAdapter(api, { delayResponse: 1500 });

// // Mock de Cadastro
// mock.onPost('/auth/register').reply((config) => {
//   const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
//   const { email, cpf } = body;
//   if (email === 'conflito@email.com') return [409, { detail: 'E-mail já cadastrado' }];
//   if (cpf === '00000000000') return [409, { detail: 'CPF já cadastrado' }];
//   return [201, { access_token: 'fake-jwt-token-patient', token_type: 'bearer', expires_in: 1800 }];
// });

// // Mock de Login
// mock.onPost('/auth/login').reply((config) => {
//   const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
//   const { email, password } = body;
//   if (email === 'qimed.seed.admin@gmail.com' && password === 'Senha123!')
//     return [200, { access_token: 'fake-jwt-token-patient', token_type: 'bearer', expires_in: 1800 }];
//   if (email === 'profissional@sade.com' && password === 'Senha123!')
//     return [200, { access_token: 'fake-jwt-token-prof', token_type: 'bearer', expires_in: 1800 }];
//   if (email === 'instituicao@sade.com' && password === 'Senha123!')
//     return [200, { access_token: 'fake-jwt-token-inst', token_type: 'bearer', expires_in: 1800 }];
//   if (email === 'pesquisador@sade.com' && password === 'Senha123!')
//     return [200, { access_token: 'fake-jwt-token-researcher', token_type: 'bearer', expires_in: 1800 }];
//   if (email === 'erro@rede.com') return [500, {}];
//   return [401, { detail: 'Credenciais inválidas' }];
// });

// // Mock de GET /auth/me
// const tokenToProfile: Record<string, object> = {
//   'fake-jwt-token-patient': { id: 1, role_code: 'PATIENT', full_name: 'Maria Paciente', email: 'qimed.seed.admin@gmail.com' },
//   'fake-jwt-token-prof':    { id: 2, role_code: 'PROFESSIONAL', full_name: 'Dr. Carlos Silva', email: 'profissional@sade.com' },
//   'fake-jwt-token-inst':    { id: 3, role_code: 'INSTITUTION', full_name: 'Clínica São Lucas', email: 'instituicao@sade.com' },
//   'fake-jwt-token-researcher': { id: 4, role_code: 'RESEARCHER', full_name: 'Dra. Ana Pesquisadora', email: 'pesquisador@sade.com' },
// };
// mock.onGet('/auth/me').reply((config) => {
//   const token = (config.headers?.Authorization as string)?.replace('Bearer ', '');
//   const profile = token ? tokenToProfile[token] : null;
//   return profile ? [200, profile] : [401, { detail: 'Não autorizado' }];
// });

// // mock.onPost('/auth/refresh').reply(() => [200, { access_token: 'fake-jwt-token-patient', token_type: 'bearer', expires_in: 1800 }]);
// // mock.onPost('/auth/logout').reply(() => [200, { message: 'Logout realizado com sucesso' }]);
// ==========================================

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('sade_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao ler token no SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = refreshResponse.data.access_token;

        if (newAccessToken) {
          await SecureStore.setItemAsync('sade_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Falha no Refresh Token. Usuário precisa logar novamente.', refreshError);
        await SecureStore.deleteItemAsync('sade_access_token');
      }
    }

    return Promise.reject(error);
  },
);
