# Plano de ação — Protótipo Fiel Multi-Perfil (Frontend)

> Base: código deste repositório, um snapshot do `frontend-sade` (branch `dev`) na data da criação deste protótipo — ver [`PLANO_IMPLEMENTACAO_FRONTEND_AUTH.md`](PLANO_IMPLEMENTACAO_FRONTEND_AUTH.md) para o histórico de decisões que moldaram esse código-base.
> Objetivo: evoluir o app React Native/Expo existente para um **protótipo fiel** que incorpore as mudanças de produto combinadas para os perfis **Usuário** (ex-Paciente), **Profissional** e **Pesquisador**, mantendo os mesmos padrões visuais e arquiteturais já usados no projeto. Escopo **somente frontend** — endpoints que ainda não existem no backend seguem o padrão já usado no repo (chamada real com *fallback* para mock em `catch`, ver `dependentsService.ts` / `institutionDashboardService.ts`).

---

## Checklist de implementação

- [ ] [Global] Renomear "Paciente" → "Usuário" em todas as telas e rótulos voltados ao usuário final.
- [ ] [Usuário] Remover a `AnamnesisScreen` como 1ª etapa do exame e criar `SelectTesteeScreen` (escolher dependente / "eu mesmo" / criar novo).
- [ ] [Usuário] Auto-redirecionar para criação de dependente quando a lista estiver vazia, e retomar o fluxo de exame ao salvar.
- [ ] [Usuário] Parar de pedir idade/sexo manualmente no exame — derivar do dependente (ou do próprio usuário) selecionado.
- [ ] [Usuário] Perfil: permitir edição dos dados pessoais (hoje é somente leitura).
- [ ] [Usuário] RNF10: forçar aceite dos Termos de Consentimento Informado no cadastro (imagens médicas + dados de menores).
- [ ] [Profissional] Adicionar 4ª aba "Unidades de Atendimento" + tela de listagem das instituições atendidas.
- [ ] [Profissional] Home: mostrar prévia das unidades atendidas + CTA para iniciar exame em um **paciente** (não dependente).
- [ ] [Profissional] Fluxo de exame por paciente: tela de busca/seleção de paciente da(s) unidade(s).
- [ ] [Profissional] Tela/ação de análise e avaliação (parecer) do exame, além do laudo de IA.
- [ ] [Profissional] Tela de alertas (reaproveitando `AlertsScreen`), com escopo nos pacientes/unidades do profissional.
- [ ] [Pesquisador] Auditoria do que já existe (`ResearcherDashboard`) contra os requisitos — sem mudança estrutural esperada.

---

## Contexto atual no código

| Ponto | Situação hoje | Arquivo |
|-------|----------------|---------|
| Roteamento por perfil | `getLogicalRole()` mapeia `role_code` do backend para `PATIENT \| PROFESSIONAL \| INSTITUTION \| RESEARCHER` e escolhe a dashboard | `src/navigation/AppStack.tsx` |
| Abas visíveis | Fixas: Início (todos), Dependentes (só `PATIENT`), Exames (todos menos `RESEARCHER`), Perfil (todos) | `src/navigation/AppStack.tsx` |
| 1ª tela do exame | `AnamnesisScreen` pede idade, sexo biológico e 3 perguntas de saúde digitadas manualmente; navega direto do card "Iniciar Novo Exame" | `src/screens/Exam/AnamnesisScreen.tsx` |
| Dependentes | CRUD completo (`getDependents`, criar/editar via `AddDependentBottomSheet`, excluir com confirmação) — já com *fallback* mock | `src/screens/Dependents/DependentsListScreen.tsx`, `src/services/dependentsService.ts` |
| Perfil do usuário | Somente leitura: nome, e-mail, CPF mascarado, telefone. Única ação é "Alterar Senha" | `src/screens/Profile/ProfileScreen.tsx` |
| Cadastro | Formulário completo (dados pessoais + campos condicionais por perfil), mas **sem** checkbox de termos/consentimento | `src/screens/Auth/RegisterScreen.tsx` |
| Dashboard Profissional | Minimalista: apenas lista mockada de "Exames Compartilhados", sem CTA de exame, sem unidades, sem alertas | `src/screens/Dashboard/ProfessionalDashboard.tsx` |
| Dashboard Pesquisador | **Já completo**: cards de estatística, filtros (período/faixa etária/resultado), gráficos (barras/pizza) e exportação CSV/JSON | `src/screens/Dashboard/ResearcherDashboard.tsx`, `src/services/researchDashboardService.ts`, `src/services/datasetExportService.ts` |
| Alertas | Tela pronta, mas ligada apenas ao dashboard de Instituição (`getInstitutionAlerts`) | `src/screens/Alerts/AlertsScreen.tsx`, `src/services/alertsService.ts` |
| Laudo do exame | `ReportScreen` mostra laudo gerado pela IA, somente leitura, com exportação em PDF mock | `src/screens/Exam/ReportScreen.tsx`, `src/services/pdfService.ts` |
| Padrão de dados ausentes no backend | Toda `service` tenta a chamada real e cai num mock local em `catch` quando a rota não existe (404/sem resposta) | `dependentsService.ts`, `institutionDashboardService.ts`, `examService.ts` |

**Gap principal:** as telas de Usuário/Profissional cobrem bem o "caminho feliz" original (paciente adulto cadastrando dependentes e fazendo exames neles), mas não cobrem: (a) o caso majoritário de uso — responsável testando o próprio filho sem redigitar dados já cadastrados —, (b) o profissional atuando sobre pacientes de uma instituição (não sobre seus próprios dependentes), nem (c) consentimento informado obrigatório no cadastro.

---

## Decisões de produto a validar antes de codar

| # | Decisão | Recomendação | Por quê |
|---|---------|--------------|---------|
| D1 | A nova tela "Para quem é o teste?" deve incluir a opção **"Fazer teste para mim mesmo"**, além dos dependentes? | **Sim.** O backend já suporta isso (`dependent_id` é opcional em `POST /exams` — omitido = exame do próprio usuário logado). | Sem essa opção, o Usuário perde a capacidade (já existente hoje) de testar a si mesmo. |
| D2 | As 3 perguntas de saúde (dor, histórico familiar, cirurgia prévia) do `AnamnesisScreen` somem junto com a tela, ou viram uma 2ª etapa enxuta? | **Viram uma etapa própria, sem os campos de idade/sexo.** | Idade e sexo já existem no cadastro do dependente/usuário (podem ser derivados), mas essas 3 respostas **mudam por exame** e não têm onde morar fora dele — removê-las reduz o sinal clínico coletado. |
| D3 | O texto legal do Termo de Consentimento (RNF10) é fornecido pelo jurídico ou fica como placeholder no protótipo? | **Placeholder editável**, com estrutura de tela pronta para receber o texto final. | Escopo é frontend/protótipo; o texto definitivo não é uma decisão de UI. |
| D4 | Como o Profissional escolhe "para qual paciente" fazer o exame, já que ele não tem `dependentes`? | Nova tela de busca/seleção de paciente **por unidade de atendimento**, com endpoint mockado (`GET /professional/patients`) seguindo o padrão de mock já usado no projeto. | Hoje não existe no backend nenhuma relação profissional↔paciente nem profissional↔instituição; modelar 100% real está fora do escopo "somente frontend". |
| D5 | "Analisar e avaliar" exames do Profissional vira uma tela nova ou uma seção dentro do `ReportScreen`/`ResultScreen` existentes? | **Seção condicional dentro do fluxo de exame existente** (`ReportScreen`), visível só quando `logicalRole === 'PROFESSIONAL'`. | Reaproveita layout, evita duplicar a exibição do laudo de IA; menor diff. |

---

## 1. Mudança transversal — "Paciente" → "Usuário"

Trocar o rótulo visível em todas as telas (a *role* técnica `PATIENT`/`role_code` no backend **não muda**, só o texto exibido):

| Arquivo | Trecho |
|---|---|
| `src/screens/Auth/ProfileSelectScreen.tsx` | `title: 'Paciente'` → `title: 'Usuário'`, descrição ajustada |
| `src/screens/Auth/RegisterScreen.tsx` | `profileLabels.PATIENT = 'Paciente'` → `'Usuário'` |
| `src/screens/Dashboard/PatientDashboard.tsx` | Renomear arquivo/component para `UserDashboard` (ou manter nome de arquivo e só ajustar textos, para minimizar diff — decisão de estilo, não bloqueia nada) |

Nenhuma mudança de contrato com o backend é necessária aqui.

---

## 2. Perfil "Usuário" (ex-Paciente)

### 2.1 Novo fluxo do Teste — substituir a 1ª tela do exame

**Hoje:** `PatientDashboard` → `navigation.navigate('ExamFlow', { screen: 'Anamnesis' })` → `AnamnesisScreen` pede idade + sexo + 3 perguntas → `AdamsTutorialScreen`.

**Novo:** `UserDashboard`/`DependentsListScreen` → `navigation.navigate('ExamFlow', { screen: 'SelectTestee' })` → **`SelectTesteeScreen`** (nova, substitui a posição da `Anamnesis` como Passo 1) → **`HealthHistoryScreen`** (nova, só as 3 perguntas, Passo 2) → `AdamsTutorialScreen` (Passo 3) → resto do fluxo inalterado.

```mermaid
flowchart TD
    A[Card "Iniciar Novo Exame"] --> B{Tem dependentes cadastrados?}
    B -- Não --> C[AddDependentBottomSheet\n"Cadastre seu 1º dependente"]
    C -- Salvou --> D[SelectTesteeScreen\ndependente novo pré-selecionado]
    B -- Sim --> D
    D --> E{Seleção}
    E -- "Dependente X" --> F[HealthHistoryScreen\nidade/sexo vêm do dependente]
    E -- "Eu mesmo" --> F2[HealthHistoryScreen\nidade/sexo vêm do usuário logado]
    E -- "+ Novo dependente" --> C
    F --> G[AdamsTutorialScreen]
    F2 --> G
```

**`SelectTesteeScreen` (novo arquivo `src/screens/Exam/SelectTesteeScreen.tsx`):**
- Reaproveita `getDependents()` (`dependentsService.ts`) — mesmo *loading/error/empty* já usados em `DependentsListScreen`.
- Se `dependents.length === 0` **no primeiro carregamento**, pula automaticamente para o `AddDependentBottomSheet` (sem precisar o usuário clicar em nada) — atende ao requisito 2 literalmente ("caso não haja dependentes, redirecionar para novo dependente, e voltar para o teste").
- Lista os dependentes com um componente `SelectableDependentCard` (extensão de `DependentCard.tsx`: adicionar prop opcional `onPress`/`selected`, mantendo `onEdit`/`onDelete` como estão — sem quebrar o uso atual em `DependentsListScreen`).
- Um card fixo no topo: **"Fazer teste para mim mesmo"**, usando avatar do próprio usuário (mesmo padrão do header do `PatientDashboard`).
- Um botão/card final: **"+ Adicionar novo dependente"**, abrindo o mesmo `AddDependentBottomSheet` já existente; ao salvar (`onSuccess`), a lista recarrega e o novo dependente já entra pré-selecionado, avançando automaticamente para a próxima etapa (atende "voltar para o teste").
- Ao selecionar, guarda em memória (params de navegação) `{ dependentId?: string; age: number; sex: 'M'|'F'|'O' }` já resolvidos — nenhuma tela seguinte volta a perguntar isso.

**`HealthHistoryScreen` (novo arquivo `src/screens/Exam/HealthHistoryScreen.tsx`):**
- É a `AnamnesisScreen` atual **menos** os campos "Idade" e "Sexo Biol." (que saem do formulário) **mais** os dados vindos da tela anterior via `route.params`.
- Mantém as 3 perguntas (`hasPain`, `familyHistory`, `hadSurgery`), a barra de progresso (agora "Passo 2 de 3"), `useConfirmExitOnBack`, `useToast` e a chamada a `createExam` do `examStore` — o `payload` para `createExamDraft` continua **idêntico** ao de hoje (`age`, `sex`, `dependent_id` opcional, mais as 3 respostas).
- `AnamnesisScreen.tsx` é removida do `ExamStack`.

**`src/navigation/ExamStack.tsx` — novo `ExamStackParamList`:**
```ts
export type ExamStackParamList = {
  SelectTestee: undefined;
  HealthHistory: { dependentId?: string; age: number; sex: 'M' | 'F' | 'O'; dependentName?: string };
  AdamsTutorial: undefined;
  Camera: undefined;
  AILoading: { examId: string; imageUri?: string };
  Result: { examId: string };
  Report: { examId: string };
};
```

**Dados do usuário logado para a opção "Eu mesmo":** o `User` (`src/store/slices/types.ts`) hoje só tem `cpf`/`phone`, mas `GET /auth/me` **já retorna** `gender` e `age` (confirmado na resposta real da API). Ação: adicionar `birth_date?: string; gender?: string; age?: number` ao tipo `User` e mapear na função que processa a resposta de `fetchUser` (`src/store/slices/userSlice.ts`).

> ⚠️ **Ponto de atenção herdado:** `examService.ts` mapeia sexo para o backend em **minúsculo** (`SEX_TO_GENDER = { M: 'male', F: 'female', O: 'prefer_not_to_say' }`), enquanto o `Gender` do backend está em **maiúsculo** (`MALE`/`FEMALE`/`PREFER_NOT_TO_SAY`, ver `src/domain/shared/value_objects/gender.py` no backend). Ao implementar a opção "Eu mesmo" (que expõe `user.gender` vindo direto da API, já em maiúsculo), **não reintroduzir esse descasamento** — usar o mesmo mapeamento централizado que `dependentsService.ts` já usa (`GENDER_TO_SEX`) para normalizar antes de enviar.

### 2.2 Perfil — permitir edição

`ProfileScreen.tsx` hoje só exibe. Adicionar:
- Estado local `isEditing`; ao ativar, trocar os `Text` de "Nome completo", "Telefone" (e opcionalmente "Data de nascimento"/"Gênero", se adicionados ao `User`) pelos componentes `Input` já usados no `RegisterScreen`. **E-mail e CPF permanecem somente leitura** (chave de identidade/unicidade).
- Botão "Editar" no lugar de/ao lado de "Alterar Senha"; em modo edição, mostrar "Salvar"/"Cancelar" (mesmo padrão visual de `Button` primary/ghost usado em outras telas).
- Nova action `updateProfile(data)` no `authStore` (novo slice ou extensão do `userSlice`), chamando `PATCH /users/me` com *fallback* mock (mesmo padrão de todos os outros services): em caso de 404, atualiza só o estado local e resolve como sucesso, permitindo testar a UI sem o endpoint pronto.

### 2.3 RNF10 — Termos de Consentimento Informado obrigatório

- Novo componente `src/components/ConsentCheckbox.tsx`: checkbox + texto curto + link "Ler termo completo".
- Novo `src/screens/Auth/ConsentTermsScreen.tsx` (ou modal): texto placeholder do Termo de Consentimento Informado (processamento de imagens médicas e dados de menores), com botão "Aceito os termos" que fecha e marca o checkbox.
- Em `RegisterScreen.tsx`: adicionar o `ConsentCheckbox` antes do botão "Criar conta"; `handleRegister` passa a validar `termsAccepted` **antes** de chamar `register()` — se falso, mostra erro inline (mesmo padrão dos outros campos) e não envia a requisição.
- `RegisterData` (`src/store/slices/types.ts`) ganha `termsAccepted: boolean`; `authSlice.register` inclui `terms_accepted: data.termsAccepted` no payload enviado — **o backend já tem a coluna `terms_accepted` em `users`**, então isso deixa de ser só cosmético assim que o endpoint de registro for atualizado para aceitar o campo (fora do escopo deste plano, mas documentado no backend).

---

## 3. Perfil "Profissional"

### 3.1 Navegação — 4ª aba

`src/navigation/AppStack.tsx`:
```ts
export type AppTabParamList = {
  HomeTab: undefined;
  DependentsTab: undefined;
  UnitsTab: undefined;        // NOVO
  ExamsTab: undefined;
  ProfileTab: undefined;
};
```
- `isProfessional = getLogicalRole(user) === 'PROFESSIONAL'`.
- Novo `Tab.Screen name="UnitsTab" component={AttendedUnitsScreen}` renderizado **apenas** quando `isProfessional` (mesmo padrão condicional já usado para `DependentsTab`/`ExamsTab`), com ícone `Building2` (já importado em `InstitutionDashboard.tsx`, reaproveitar).
- Resultado: Profissional passa a ter exatamente as 4 abas pedidas — **Início, Exames, Unidades de Atendimento, Perfil**.

### 3.2 `AttendedUnitsScreen` (nova, `src/screens/Institutions/AttendedUnitsScreen.tsx`)

- Lista as instituições/unidades que o profissional atende: cards com nome, tipo (`school`/`clinic`/`health_center` — já existe como enum no backend, `institution_type_enum`), endereço/contato.
- Novo `src/services/professionalService.ts`:
  ```ts
  export interface AttendedUnit { id: string; name: string; type: string; address: string; }
  export const getAttendedUnits = async (): Promise<AttendedUnit[]> => { /* GET /professional/units, fallback mock */ };
  ```
- Mesmo padrão de `EmptyState`/`ErrorState`/`ActivityIndicator` das outras listas (`DependentsListScreen`, `AlertsScreen`).

### 3.3 `ProfessionalDashboard.tsx` — revisão da Home

Adicionar, na ordem:
1. Header (mantido).
2. **Novo card CTA** "Iniciar Exame" (mesmo estilo do card verde do `PatientDashboard`/roxo do `InstitutionDashboard`) → abre `PatientPickerScreen` (novo, dentro do `ExamStack` ou stack próprio) em vez de ir direto para a Anamnese.
3. **Nova seção "Minhas Unidades"** — prévia horizontal (`ScrollView horizontal`, mesmo padrão da prévia de dependentes do `PatientDashboard`) com até 3 unidades + "Ver todas" → `UnitsTab`.
4. **Novo metric card "Alertas"** (mesmo componente `MetricCard` do `InstitutionDashboard.tsx`, pode ser extraído para `src/components/MetricCard.tsx` e reaproveitado nos dois dashboards) → navega para `Alerts`.
5. Seção "Exames Compartilhados" existente, renomeada para "Exames para Avaliar" — ao tocar num exame, vai para o fluxo de avaliação (3.5), não mais um card estático.

### 3.4 `PatientPickerScreen` (novo, `src/screens/Exam/PatientPickerScreen.tsx`)

- Busca (`Input` com ícone de lupa) + lista de pacientes vinculados às unidades do profissional.
- Novo `src/services/patientsService.ts`:
  ```ts
  export interface Patient { id: string; name: string; age: number; sex: 'M' | 'F' | 'O'; unitId: string; }
  export const searchPatients = async (query: string): Promise<Patient[]> => { /* GET /professional/patients?q=..., fallback mock */ };
  ```
- Ao selecionar um paciente, navega para `HealthHistoryScreen` com `{ patientId, age, sex }` em vez de `{ dependentId, age, sex }` — **`ExamStackParamList.HealthHistory` ganha `patientId?: string` opcional**, e `examService.createExamDraft` ganha um `patient_id?: string` opcional no payload (documentar como TODO de backend — ver Riscos, item R1).

### 3.5 Avaliação/parecer do exame

- Em `src/screens/Exam/ReportScreen.tsx`, adicionar um bloco condicional (`logicalRole === 'PROFESSIONAL'`) **após** a seção "Conclusão da Inteligência Artificial":
  - `Input` multilinha "Parecer do profissional".
  - Botões "Confirmar diagnóstico da IA" / "Divergir e justificar".
  - Botão "Enviar Avaliação" (`Button` primary), chamando novo `evaluateExam(examId, payload)` em `examService.ts` (mesmo padrão *fallback* mock).
- Resultado fica registrado localmente no `examStore` (novo campo `evaluation` no `ExamResponse`) para já refletir na UI sem precisar do backend.

### 3.6 Tela de Alertas do Profissional

- Reaproveitar 100% o componente `AlertsScreen.tsx` — ele já é agnóstico de layout, só depende do `service` injetado.
- Generalizar `src/services/alertsService.ts`: hoje só tem `getInstitutionAlerts`; adicionar `getProfessionalAlerts()` com a mesma forma de retorno (`InstitutionAlert[]`), mock com pacientes das unidades do profissional.
- `AlertsScreen.tsx` passa a escolher a função certa via `useAuthStore` + `getLogicalRole` (mesmo helper já usado em `AppStack.tsx` — vale extrair `getLogicalRole` para `src/utils/role.ts` para ser importado dos dois lugares sem duplicar).

---

## 4. Perfil "Pesquisador"

`ResearcherDashboard.tsx` **já atende** os 3 pontos pedidos:

| Requisito | Onde já está |
|---|---|
| Dashboard com métricas de positivos/negativos | Cards "Testes Realizados"/"Taxa de Positividade" + gráfico de pizza "Distribuição de Resultados" |
| Acesso a download | Botão "Exportar Dataset" (modal CSV/JSON) via `datasetExportService.ts` |
| Aprofundar métricas com filtro | Filtros de período, faixa etária e resultado, todos re-disparando `getResearchStats`/`getResearchDataset` |

**Ação neste plano:** nenhuma mudança estrutural — apenas um passe de QA manual (ver seção de Testes) para confirmar que nada quebrou com as mudanças de navegação (`getLogicalRole`/abas) feitas para os outros perfis, já que os três dashboards compartilham o mesmo `AppStack.tsx`.

---

## 5. Novos arquivos e serviços — resumo

| Arquivo | Tipo | Perfil |
|---|---|---|
| `src/screens/Exam/SelectTesteeScreen.tsx` | Tela | Usuário |
| `src/screens/Exam/HealthHistoryScreen.tsx` | Tela (substitui `AnamnesisScreen.tsx`) | Usuário |
| `src/screens/Auth/ConsentTermsScreen.tsx` | Tela | Usuário (cadastro, todos os perfis) |
| `src/components/ConsentCheckbox.tsx` | Componente | Usuário (cadastro) |
| `src/screens/Institutions/AttendedUnitsScreen.tsx` | Tela | Profissional |
| `src/screens/Exam/PatientPickerScreen.tsx` | Tela | Profissional |
| `src/services/professionalService.ts` | Service (mock-first) | Profissional |
| `src/services/patientsService.ts` | Service (mock-first) | Profissional |
| `src/components/MetricCard.tsx` | Componente (extraído de `InstitutionDashboard.tsx`) | Profissional/Instituição |
| `src/utils/role.ts` | Util (`getLogicalRole` centralizado) | Todos |

**Arquivos alterados (principais):** `AppStack.tsx`, `ExamStack.tsx`, `ProfileSelectScreen.tsx`, `RegisterScreen.tsx`, `ProfileScreen.tsx`, `ProfessionalDashboard.tsx`, `AlertsScreen.tsx`, `alertsService.ts`, `examService.ts`, `dependentsService.ts` (sem mudança de contrato, só consumido pela nova tela), `store/slices/types.ts`, `store/slices/userSlice.ts`, `store/slices/authSlice.ts`.

---

## Matriz de endpoints novos (todos com fallback mock)

| Endpoint (esperado) | Usado por | Status hoje | Comportamento sem backend |
|---|---|---|---|
| `PATCH /users/me` | Edição de perfil (2.2) | Não existe | Atualiza só o estado local do `authStore` |
| `POST /users/me/terms-acceptance` ou campo `terms_accepted` no `POST /auth/register` | RNF10 (2.3) | Coluna existe no backend, endpoint não aceita o campo ainda | Registro segue funcionando; aceite fica só validado no front |
| `GET /professional/units` | `AttendedUnitsScreen` (3.2) | Não existe | Lista mockada de 2–3 unidades fixas |
| `GET /professional/patients?q=` | `PatientPickerScreen` (3.4) | Não existe | Lista mockada filtrável em memória |
| `POST /exams` com `patient_id` | Exame por paciente (3.4) | Backend só aceita `dependent_id` | Front envia o payload mesmo assim; em caso de rejeição, cai no mock de `createExamDraft` já existente |
| `POST /exams/:id/evaluation` | Parecer do profissional (3.5) | Não existe | Grava só no estado local (`examStore`) |
| `GET /professional/alerts` | Alertas do Profissional (3.6) | Não existe | Reaproveita mock de `getInstitutionAlerts`, trocando nomes |

---

## Ordem de implementação

1. **Fase 0 — Base compartilhada:** extrair `getLogicalRole` para `src/utils/role.ts`; extrair `MetricCard` para `src/components/`; ajustar `User`/`RegisterData` (`types.ts`) com os campos novos. *(Desbloqueia as fases seguintes sem conflito de merge.)*
2. **Fase 1 — Usuário / fluxo de exame:** `SelectTesteeScreen` + `HealthHistoryScreen` + ajuste do `ExamStack.tsx` + pontos de entrada (`UserDashboard`, `DependentsListScreen` se aplicável). Cobre os requisitos 1, 2 e 3 do enunciado.
3. **Fase 2 — Usuário / perfil e cadastro:** edição de perfil (2.2) + Termo de Consentimento (2.3), em paralelo à Fase 1 (arquivos não se sobrepõem).
4. **Fase 3 — Profissional:** 4ª aba, `AttendedUnitsScreen`, revisão da `ProfessionalDashboard`, `PatientPickerScreen`, avaliação no `ReportScreen`, Alertas do Profissional.
5. **Fase 4 — Rename global + QA do Pesquisador:** trocar "Paciente" → "Usuário" nos textos restantes; rodar a checklist de testes manuais completa, incluindo o Pesquisador (sem código novo esperado ali).

---

## Testes manuais

| # | Cenário | Resultado esperado |
|---|---------|---------------------|
| 1 | Usuário sem dependentes toca "Iniciar Novo Exame" | Cai direto no formulário de novo dependente; ao salvar, entra automaticamente no exame já com esse dependente selecionado |
| 2 | Usuário com dependentes toca "Iniciar Novo Exame" | Vê `SelectTesteeScreen` com a lista + opção "Eu mesmo" + "+ Novo dependente" |
| 3 | Usuário seleciona um dependente | `HealthHistoryScreen` não mostra campos de idade/sexo; ao concluir, `POST /exams` recebe `age`/`sex` corretos derivados do dependente |
| 4 | Usuário seleciona "Eu mesmo" | Mesmo resultado do item 3, usando dados do usuário logado |
| 5 | Cadastro sem marcar o Termo de Consentimento | Botão "Criar conta" mostra erro inline e não dispara a requisição |
| 6 | Editar perfil, alterar telefone, salvar | Tela volta ao modo leitura com o novo valor persistido (local, se o backend ainda não aceitar) |
| 7 | Login como Profissional | Vê exatamente 4 abas: Início, Exames, Unidades de Atendimento, Perfil (sem aba Dependentes) |
| 8 | Profissional toca "Iniciar Exame" | Abre busca de paciente (não de dependente); ao escolher um paciente, segue o mesmo fluxo de anamnese/câmera/resultado |
| 9 | Profissional abre um exame concluído | Vê o laudo de IA + seção de "Parecer do profissional" para preencher e enviar |
| 10 | Profissional abre "Alertas" | Vê alertas referentes aos pacientes das unidades dele (não os da Instituição) |
| 11 | Login como Pesquisador | Dashboard, filtros e exportação continuam funcionando como antes (regressão) |

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| **R1 — Backend não modela "Profissional atende Paciente"** (schema atual de `draft_exams`/`dependents` só liga exame a `id_user` (dono) e opcionalmente a um `dependent` do próprio dono) | Fora do escopo deste plano (só frontend). Serviços novos (`patientsService.ts`, `POST /exams` com `patient_id`) ficam 100% em modo mock até o backend expor a relação profissional↔instituição↔paciente. Documentar como item de backlog de backend. |
| **R2 — Descasamento de caixa no enum de gênero** (frontend usa minúsculo, backend usa maiúsculo em `gender_enum`) | Centralizar toda conversão em um único mapa (reaproveitar o já existente em `dependentsService.ts`) em vez de duplicar em `examService.ts`/nova tela "Eu mesmo". |
| **R3 — Duas fontes de verdade para "Instituição atendida"** (backend tem `institution_profiles` para a própria instituição logar, mas não uma tabela de vínculo profissional↔instituição) | `AttendedUnitsScreen` nasce 100% mockada; ao integrar de verdade, validar com o time de backend se o vínculo será N:N (profissional pode atender +1 unidade). |
| **R4 — Aba nova pode quebrar layout em telas pequenas** (5 abas possíveis para Profissional: Início/Exames/Unidades/Perfil — hoje são 3) | Testar em largura mínima suportada (ver breakpoints já usados nos dashboards com `useWindowDimensions`); `tabBarLabel` deve caber sem quebrar linha. |

---

## Estrutura de pastas impactada

```
src/
  ├── components/
  │   ├── ConsentCheckbox.tsx        (novo)
  │   └── MetricCard.tsx             (novo, extraído)
  ├── navigation/
  │   ├── AppStack.tsx               (4ª aba do Profissional)
  │   └── ExamStack.tsx              (SelectTestee + HealthHistory no lugar de Anamnesis)
  ├── screens/
  │   ├── Auth/
  │   │   ├── ConsentTermsScreen.tsx (novo)
  │   │   └── RegisterScreen.tsx     (checkbox de termos)
  │   ├── Dashboard/
  │   │   └── ProfessionalDashboard.tsx (CTA de exame por paciente, unidades, alertas)
  │   ├── Exam/
  │   │   ├── SelectTesteeScreen.tsx (novo)
  │   │   ├── HealthHistoryScreen.tsx (novo, substitui AnamnesisScreen.tsx)
  │   │   ├── PatientPickerScreen.tsx (novo)
  │   │   └── ReportScreen.tsx       (seção de avaliação do profissional)
  │   ├── Institutions/
  │   │   └── AttendedUnitsScreen.tsx (novo)
  │   └── Profile/
  │       └── ProfileScreen.tsx      (modo de edição)
  ├── services/
  │   ├── professionalService.ts     (novo)
  │   ├── patientsService.ts         (novo)
  │   └── alertsService.ts           (getProfessionalAlerts)
  ├── store/
  │   └── slices/
  │       ├── types.ts               (User + RegisterData ampliados)
  │       └── userSlice.ts           (updateProfile)
  └── utils/
      └── role.ts                    (novo, getLogicalRole centralizado)
```
