# SADE - Protótipo Multi-Perfil (React Native / Expo Web)

> **Este repositório é um protótipo**, criado a partir de um snapshot do código do `frontend-sade` (branch `dev`) para implementar e testar, de forma isolada, as mudanças de produto descritas em [`docs/PLANO_IMPLEMENTACAO_PROTOTIPO_MULTIPERFIL.md`](docs/PLANO_IMPLEMENTACAO_PROTOTIPO_MULTIPERFIL.md) — sem afetar o repositório principal.

Bem-vindo ao repositório frontend do projeto SADE! Aqui nós utilizamos o ecossistema Expo com React Native, focado primeiramente em Web.

## 🚀 Como Rodar o Projeto com Docker (Recomendado)

Nós preparamos um ambiente Docker otimizado para não precisar instalar toneladas de dependências pesadas na sua máquina local, mantendo o *Hot-Reload* (atualização em tempo real) 100% funcional.

### 1. Preparação
Antes de subir o Docker, é necessário criar o arquivo `.env` para o Frontend saber onde a API do Backend está rodando.

```bash
# Copie o template
cp .env.example .env
```
*(O padrão já aponta para `http://localhost:8000/api/v1`, que é a porta do nosso backend local).*

### 2. Subindo o Ambiente
Na pasta raiz do `frontend-sade`, execute:

```bash
docker compose up -d --build
```

- **Por que é tão rápido?** Nossa imagem Docker (`node:20`) utiliza os módulos nativos do seu hospedeiro Linux espelhando o volume local, em vez de reinstalar tudo do zero.

### 3. Acessando a Aplicação
O container expõe a porta `8081`. Acesse em seu navegador:
👉 **[http://localhost:8081](http://localhost:8081)**

---

## 🔑 Testando o Login (Dev)
Como os containers de banco de dados locais nascem vazios e a nossa tela de Cadastro (M1-10) ainda não está integrada no frontend, você precisará injetar um usuário de teste direto na API do backend para testar o login.

Certifique-se de que o backend (`sade-core`) está rodando e execute o comando abaixo no seu terminal para criar o usuário de teste:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "teste@sade.com",
  "password": "Password123!",
  "first_name": "Teste",
  "last_name": "SADE",
  "cpf": "12345678901",
  "phone": "11999999999",
  "birth_date": "1990-01-01",
  "gender": "M"
}'
```

Pronto! Agora basta acessar `http://localhost:8081` e realizar o login com:
- **E-mail**: `teste@sade.com`
- **Senha**: `Password123!`

---

## 🏗️ Estrutura do Projeto e Padronização

Utilizamos o **Git Flow** e a divisão em Sprints. Nossas issues e acompanhamento estão na documentação (`/docs`), assim como os artefatos de tokens CSS (Gluestack-UI).

- **`/src/screens`**: Componentes de tela completos.
- **`/src/services`**: Arquivos de comunicação com a API (Axios configurado com interceptors para o Refresh Token automatizado).
- **`/src/store`**: Gerenciamento de estado (Zustand).
- **`/src/utils/storage.ts`**: Wrapper que nós criamos para que o `SecureStore` não trave na versão Web e use automaticamente o `localStorage`.
