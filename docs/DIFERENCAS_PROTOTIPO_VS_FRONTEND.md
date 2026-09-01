# Diferenças: `prototipo-sade` vs. `frontend-sade` (branch `dev`)

> **Como este documento foi gerado:** `prototipo-sade` nasceu como um snapshot exato do `frontend-sade` (branch `dev`) — commit `59cc83e`, "snapshot inicial a partir do frontend-sade". A partir daí, 23 commits implementaram uma reformulação de produto (multi-perfil: Usuário, Profissional, Instituição, Pesquisador). Este documento é o `git diff` entre esse snapshot e o `HEAD` atual, traduzido em termos de produto — cada linha aqui corresponde a uma mudança de comportamento real no código, não a uma suposição.
>
> **Objetivo:** servir de insumo para a equipe de frontend redefinir milestones e issues do projeto, já que o protótipo representa o comportamento-alvo do novo backend.
>
> **Atualização:** a seção 5 (Profissional), a seção 10 (endpoints) e a seção 12 (épicos) incluem também a funcionalidade **"Refazer Exame"**, implementada diretamente neste protótipo após a análise inicial dos 23 commits — ainda não commitada no repositório.

---

## 1. Resumo executivo

- **Fluxo de exame do Usuário foi reestruturado em 3 passos** (escolher dependente → anamnese completa → tutorial), substituindo a tela única `AnamnesisScreen`. A anamnese passou a exigir peso, altura e doenças pré-existentes (RF04) — **campos que o backend ainda não aceita em `POST /exams`**.
- **Profissional ganhou identidade própria no produto**: 4ª aba "Unidades de Atendimento", fluxo de exame por *paciente* (não por dependente), parecer clínico sobre o laudo da IA, e a tela de Alertas (que antes era da Instituição). **Nenhuma dessas relações (profissional↔unidade↔paciente) existe no backend hoje** — tudo roda em mock.
- **Instituição perdeu a tela de Alertas** (migrou 100% para o Profissional) e não testa mais em si mesma — passou a cadastrar pacientes. Também deixou de exigir CPF/nascimento/gênero no cadastro (não é pessoa física), o que **hoje é contornado com um fallback que trata erro do backend como sucesso silencioso**.
- **Pesquisador ganhou uma 4ª aba** de monitoramento de instituições, substituindo um card estático desconectado por dados reais.
- **Login/sessão mockados para 5 contas demo** quando o backend não responde, viabilizando deploy estático sem API por trás.
- **🆕 Profissional pode pedir para o Usuário refazer o exame** (botão "Refazer Exame", vermelho, abaixo de "Enviar Avaliação"), com motivo obrigatório; o exame some da fila de avaliação e o Usuário vê o pedido no histórico dele, com atalho direto para um novo exame.
- **13 endpoints novos ou alterados** seriam necessários para tirar o protótipo do mock (lista completa na seção 10).
- **3 pontos merecem confirmação de produto antes de virar issue** (seção 9) — incluindo uma remoção de tela (reset de senha) que parece regressão não-intencional, não decisão de design.

---

## 2. Como usar este documento

Cada tabela abaixo tem uma coluna **"Novo contrato de backend?"**. Ela separa o trabalho em duas naturezas diferentes de issue:

- **Não** → issue é só de frontend (a lógica já existe no protótipo, é portar/ajustar).
- **Sim** → issue de frontend depende de um endpoint que ainda não existe; vale abrir a contraparte de backend em paralelo, ou aceitar que a feature continua em mock até lá.

A seção 10 já propõe um agrupamento em épicos com base nisso.

---

## 3. Mudanças transversais (Global)

| Área | Antes (`frontend-sade`) | Depois (`prototipo-sade`) | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| Rótulo de perfil | "Paciente" em toda a UI | "Usuário" (role técnica `PATIENT`/`role_code` **inalterada**) | Cosmético | Não |
| `getLogicalRole` | Duplicada em `AppStack.tsx` | Extraída para `src/utils/role.ts`, reusada em 5 pontos | Evita divergência de mapeamento de role | Não |
| Descrições dos perfis no cadastro | Textos originais e mais longos | Reescritos e encurtados | Ajuste de copy | Não |
| `Input.tsx` (label flutuante) | Só reagia a foco/blur | Reage também a mudanças de `value` setadas por código | Corrige sobreposição de label ao pré-preencher campos | Não |

---

## 4. Perfil Usuário (ex-Paciente)

| Área | Antes | Depois | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| 1ª etapa do exame | `AnamnesisScreen` única (idade + sexo + 3 perguntas digitadas), acessada direto do dashboard | 3 passos: **`SelectTesteeScreen`** (escolher dependente) → **`HealthHistoryScreen`** (anamnese completa) → `AdamsTutorial` | Separar "para quem é o teste" de "anamnese" | Não (rotas mockadas no front) |
| "Fazer teste para mim mesmo" | N/A | Implementada e depois **revertida** — exame só pode ser iniciado para um dependente | Decisão de produto revertida durante o protótipo | Não |
| Dependente vazio | Sem tratamento especial | Abre automaticamente `AddDependentBottomSheet`; ao salvar, já avança para a próxima etapa | Elimina passo manual extra | Não |
| Anamnese (RF04) | 3 perguntas + idade/sexo digitados | Idade/sexo **somente leitura** (vêm do dependente) + **peso (kg)** e **altura (cm)** obrigatórios + doenças pré-existentes (texto livre) + detalhe de cirurgia opcional — tudo refeito a cada exame | RF04 exige anamnese completa; peso/altura mudam com o crescimento da criança | **Sim** — `POST /exams` precisa aceitar `weight_kg`, `height_cm`, `pre_existing_conditions`, `surgery_detail` |
| Pré-preenchimento da anamnese | N/A | Busca o último exame do dependente e pré-preenche os campos (editáveis, com aviso para revisar) | Agiliza fluxo repetido | Não (usa histórico já mockado) |
| Histórico de exames | Mostrava todos os status (Positivo/Negativo/Inconclusivo/Falha) | Mostra só **Positivo/Negativo** (Inconclusivo/Falha somem da lista do Usuário) | Alinhado à regra "Profissional só recebe exame definitivo" | Não, filtro de front |
| Navegação Dependentes/Exames | Sem botão de voltar explícito | Botão "voltar para o Início" nas duas telas | UX | Não |
| Perfil (`ProfileScreen`) | Somente leitura | Modo de edição: nome e telefone editáveis; e-mail/CPF continuam read-only | Requisito de produto | **Sim** — `PATCH /users/me` não existe; fallback só atualiza estado local |
| Termo de Consentimento (RNF10) | Não existia | `ConsentCheckbox` + modal com texto placeholder no cadastro; `termsAccepted` enviado como `terms_accepted` | Exigência regulatória (imagens médicas + dados de menores) | **Sim** — coluna existe em `users`, endpoint de registro ainda não aceita o campo |
| **⚠️ Reset de senha** | `ResetPasswordScreen` + atalho dev no Login + rota de deep link | **Removidos por completo** | Tela não era alcançável fora do atalho dev (já removido) — **ver seção 9, item 3** | Não, mas é uma remoção de feature a confirmar |
| 🆕 Histórico de exames — repetição pedida | N/A | Card em destaque ("!" vermelho): "Profissional pediu para refazer o exame" + motivo + botão "Refazer", que leva direto para `SelectTesteeScreen` | Fecha o loop do "Refazer Exame" do Profissional (ver seção 5) | Não (usa o mesmo mock do exame) |

---

## 5. Perfil Profissional

| Área | Antes | Depois | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| Abas | 3: Início, Exames, Perfil | 4: Início, Exames, **Unidades de Atendimento**, Perfil | Nova identidade de perfil | Não |
| Dashboard | Lista estática mockada "Exames Compartilhados", sem CTA | CTA "Iniciar Exame" → seleção de paciente; seção "Minhas Unidades"; métricas de alertas e taxa de positividade; lista "Exames para Avaliar" ligada a dados reais | Home funcional do perfil | Não (tudo com fallback mock) |
| `AttendedUnitsScreen` (nova) | N/A | Lista/adiciona/remove unidades atendidas (nome, tipo, endereço, filtro Estado→Cidade) | Modela vínculo profissional↔unidade | **Sim** — `GET/POST/DELETE /professional/units` não existem |
| Exame por paciente | Não existia fluxo próprio | `PatientPickerScreen`: busca ou cadastra paciente, filtrado pelas unidades atendidas | Profissional não tem "dependentes" | **Sim** — `GET/POST /professional/patients`; `POST /exams` com `patient_id` (backend só aceita `dependent_id` hoje) |
| Avaliação/parecer do exame | Não existia | Seção "Parecer do Profissional" no `ReportScreen`: confirmar/divergir do diagnóstico da IA + texto livre + enviar | Papel clínico do profissional sobre o laudo de IA | **Sim** — `POST /exams/:id/evaluation` não existe; grava só em estado local |
| Regra de recebimento de exames | N/A | Profissional só recebe exames **Positivo/Negativo**; Inconclusivo/Falha ficam só com o Usuário | Regra de negócio nova, não estava no plano original — formalizar como requisito | Não, mas é regra de negócio a documentar |
| Tela de Exames | Lista única | Abas "Histórico" / "Exames para avaliar" | Organização do trabalho clínico | Não |
| Alertas | Não existia para o Profissional | `AlertsScreen` migrada 100% para cá; só exames `POSITIVE` geram alerta | Mudança de dono da feature (era da Instituição) | **Sim** — `GET/POST /professional/alerts*` substitui `/institution/alerts*` |
| Ação "Resolver" alerta | Resolvia inline na própria tela | Navega para o laudo; alerta só é resolvido **depois** do parecer enviado | Muda o momento da resolução | **Sim** — endpoint `resolve-by-exam/:examId` |
| Bug de loading infinito ao abrir alerta | `ReportScreen` travava se o exame não estivesse pré-carregado | Busca o histórico sob demanda | Correção de bug | Não |
| Botão voltar sem histórico local | `goBack()` não fazia nada (ex.: refresh direto na rota) | Cai para a tela inicial | Correção de bug | Não |
| 🆕 Refazer Exame | Não existia — só era possível emitir parecer sobre o resultado atual | Botão vermelho "Refazer Exame" no `ReportScreen`, abaixo de "Enviar Avaliação"; abre modal pedindo o motivo (obrigatório), depois exibe "Repetição do exame solicitada" no lugar do formulário de parecer | Cobre o caso de foto ruim/ângulo incorreto, em que o parecer não faz sentido — o exame precisa ser refeito do zero | **Sim** — `POST /exams/:id/retake` não existe; fica só no mock local (mesmo padrão de `evaluation`) |
| 🆕 Fila "Exames para avaliar" após repetição | N/A | Exame com repetição pedida some da fila (tanto na tela de Exames quanto na prévia da Home) — mesma regra já aplicada a exames avaliados | Evita que o profissional veja de novo um exame que já tratou | Não, filtro de front |

---

## 6. Perfil Instituição

| Área | Antes | Depois | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| "Realizar Triagem" | Ia direto para a anamnese — instituição testava em si mesma | Vai para busca/cadastro de paciente | Instituição não é o sujeito do teste | Não |
| Cadastro de paciente pela Instituição | N/A | Reusa o mesmo componente do Profissional, mas sem seletor de unidade — paciente fica implicitamente vinculado à própria instituição logada | Atalho de modelagem no protótipo | **Sim** — mesmo gap de vínculo paciente↔instituição do lado Profissional |
| Alertas | Tela própria (`getInstitutionAlerts`) + card no dashboard | **Removida por completo** — feature migrou 100% para o Profissional | Alerta é responsabilidade clínica do profissional, não da instituição | Endpoint antigo `/institution/alerts*` fica órfão |
| Filtro do dashboard | Por "turma" (`InstitutionGroup`), afetando volume e distribuição etária | **Removido inteiramente** — dashboard mostra todos os dados, só com filtro de período | "Turma"/especialidade não fazem sentido num app de triagem de escoliose | **Simplifica** o contrato — `group_id` não é mais necessário |
| Tela de Exames | Lista única | Abas "Histórico" / "Exames em aberto" (abre em `Result`, não `Report` — parecer é exclusivo do Profissional) | Paridade com a tela do Profissional | Não |
| Cadastro de Instituição | Pedia CPF, nascimento, gênero (campos de pessoa física) | Sem esses campos; pede **Tipo de Instituição** (Hospital/Posto de Saúde/Clínica) e **Endereço** | Instituição não é pessoa física | **Sim** — `authSlice.register` hoje trata erro do backend (que ainda exige CPF) como sucesso silencioso, um contorno temporário |
| Tipos de instituição | Campo não existia | Restrito a Hospital / Posto de Saúde / Clínica (sem "Escola") | Só entram instituições que de fato realizam o teste com profissional responsável | Não |
| Perfil da Instituição | Mostrava CPF mascarado | Mostra **CNPJ** formatado | Identidade correta para pessoa jurídica | Requer que o backend retorne `cnpj` para contas de instituição |

---

## 7. Perfil Pesquisador

| Área | Antes | Depois | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| Card "Regiões Monitoradas" | Estático, não clicável, valor mockado desconectado | Renomeado "Instituições Monitoradas", clicável, com contagem real | Conectar métrica a dado real | `regionsMonitored` **removido** do contrato de `GET /research/stats` |
| Nova aba "Monitoramentos" | N/A | Lista de instituições monitoradas + adicionar (filtro Estado/Cidade) + remover | Nova funcionalidade do perfil | **Sim** — `GET/POST/DELETE /research/institutions` não existem |
| Filtros, exportação CSV/JSON, gráficos | Já completos | Sem mudança estrutural | Confirmado por QA manual — sem regressão | — |

---

## 8. Autenticação (Login/Registro)

| Área | Antes | Depois | Motivo | Novo contrato de backend? |
|---|---|---|---|---|
| Login sem backend acessível | Erro de conexão | 5 contas demo fixas (Admin/Usuário/Profissional/Instituição/Pesquisador, senha `Senha123!`) autenticam localmente | Viabiliza deploy estático (ex. GitHub Pages) sem API por trás | Não — bypass só de frontend |
| Sessão sem backend | Deslogava em qualquer erro | Mantém sessão se o token for de conta mock | Mesma motivação acima | Não |
| Campos de registro | `cpf`/`birthDate`/`gender` sempre obrigatórios; `responsibleName` para Instituição | Campos de pessoa física opcionais e condicionais a `!isInstitution`; Instituição ganha `institutionType`/`institutionAddress`; `responsibleName` mapeado para `fullName` | Bifurcação pessoa física / pessoa jurídica | Ver seção 6 |

---

## 9. Pontos que precisam de confirmação de produto antes de virar issue

1. **Consentimento informado (RNF10) está com a validação desligada no código atual.** O checkbox existe na tela, mas não bloqueia o envio do cadastro — divergindo do que o plano original previa (`handleRegister` deveria impedir o registro sem aceite). Confirmar se isso é intencional (protótipo permite testar telas livremente) antes de tratá-lo como bug.
2. **Cadastro de Instituição sem CPF é aceito via fallback que trata erro do backend como sucesso local**, mascarando que o backend real rejeitaria essa conta hoje. Vale abrir como issue de backend explícita, não só "ajuste de frontend".
3. **Remoção do fluxo de reset de senha (tela + rota) parece regressão, não decisão de produto documentada** — a tela só ficou inacessível porque um atalho de desenvolvimento foi removido, e o fluxo real correspondente nunca existiu de outra forma. Confirmar se a equipe quer reimplementar o fluxo completo (solicitação → e-mail → token → nova senha) ou se `ForgotPasswordScreen` (só envio de e-mail) é considerado suficiente por ora.

---

## 10. Inventário completo de endpoints novos/alterados (mock hoje)

| Endpoint esperado | Usado por | Status no backend hoje | Comportamento sem backend |
|---|---|---|---|
| `POST /exams` com `weight_kg`, `height_cm`, `pre_existing_conditions`, `surgery_detail` | Anamnese completa (RF04) | Campos não existem em `draft_exams` | Enviado mesmo assim; sobrevive só no mock |
| `PATCH /users/me` | Edição de perfil do Usuário | Não existe | Atualiza só estado local |
| `terms_accepted` no `POST /auth/register` | Consentimento (RNF10) | Coluna existe em `users`, endpoint não aceita ainda | Enviado, ignorado pelo backend |
| `GET/POST/DELETE /professional/units` | Unidades de Atendimento | Não existe | Catálogo fixo de 6 unidades em memória |
| `GET/POST /professional/patients` | Busca/cadastro de paciente pelo Profissional | Não existe | Lista mockada filtrável em memória |
| `POST /exams` com `patient_id` | Exame por paciente (Profissional/Instituição) | Backend só aceita `dependent_id` | Sempre cai no mock, nunca tenta a chamada real |
| `POST /exams/:id/evaluation` | Parecer do Profissional | Não existe | Grava só em estado local (`examStore`) |
| `GET/POST /professional/alerts`, `POST /professional/alerts/resolve-by-exam/:examId` | Alertas do Profissional | Não existe (substitui `/institution/alerts*`, agora órfão) | Mock com 2 alertas |
| 🆕 `POST /exams/:id/retake` | Botão "Refazer Exame" do Profissional | Não existe | Grava só em estado local (mesmo padrão de `evaluation`); resolve o alerta correspondente, se houver |
| `POST /auth/register` sem exigir CPF para Instituição | Cadastro de Instituição | Backend exige CPF hoje | Erro tratado como sucesso local |
| `GET /users/me` retornando `cnpj` | Perfil da Instituição | Não confirmado | Não teria como exibir CNPJ real |
| `GET/POST/DELETE /research/institutions` | Monitoramentos do Pesquisador | Não existe | Reusa catálogo de unidades do Profissional |
| `GET /research/stats` sem `regionsMonitored` | Dashboard do Pesquisador | Campo pode ser descontinuado | Front já não depende mais dele |

---

## 11. Removido por completo (não existe mais no protótipo)

- **`AnamnesisScreen.tsx`** — substituída por `SelectTesteeScreen` + `HealthHistoryScreen`.
- **`ResetPasswordScreen.tsx`** + rota de deep link + atalho dev — ver seção 9, item 3.
- **Filtro de turma/grupo na Instituição** (`InstitutionGroup`, `groupId`) — dashboard não segmenta mais por turma.
- **Tela/card de Alertas da Instituição** — feature migrou 100% para o Profissional.
- **Opção "Fazer teste para mim mesmo"** no fluxo do Usuário — implementada e depois revertida.
- **Card "Regiões Monitoradas"** — substituído por "Instituições Monitoradas" com dado real.
- **Campo `responsibleName`** — Instituição agora usa `fullName` para o nome do responsável.

---

## 12. Proposta de agrupamento em épicos/milestones

Sugestão de organização para a equipe de frontend, separando trabalho que pode andar imediatamente (Não precisa de backend) do que depende de coordenação com o backend:

**Épicos só de frontend (podem começar já):**
- **E1 — Fluxo de exame do Usuário em 3 passos**: `SelectTesteeScreen`, `HealthHistoryScreen`, pré-preenchimento, filtro de status no histórico.
- **E2 — Identidade do perfil Profissional**: 4ª aba, dashboard revisado, tela de Unidades (UI), tela de busca de paciente (UI), abas de Exames.
- **E3 — Ajustes de cadastro da Instituição (UI)**: tipo de instituição, endereço, remoção de campos de pessoa física, exibição de CNPJ.
- **E4 — Monitoramento do Pesquisador (UI)**: nova aba, listagem, filtros.
- **E5 — Login/sessão mock para deploy estático**: já implementado no protótipo, avaliar se entra como feature permanente ou só de ambiente de demo.

**Épicos que dependem de backend (abrir em paralelo com a equipe de backend):**
- **E6 — Anamnese completa (RF04) em `POST /exams`**: 4 campos novos, é o contrato mais simples de formalizar primeiro.
- **E7 — Vínculo Profissional ↔ Unidade ↔ Paciente**: os 3 endpoints de `professional/*` — maior peça de dívida técnica identificada.
- **E8 — Parecer clínico e Alertas do Profissional**: `evaluation` + migração de `/institution/alerts` para `/professional/alerts`.
- **E9 — Cadastro de Instituição sem CPF**: remover a exigência no backend em vez de manter o contorno de frontend.
- **E10 — Consentimento informado (RNF10)**: decidir se valida no frontend, no backend, ou nos dois; endpoint/campo para persistir o aceite.
- **E11 — Monitoramento de instituições do Pesquisador**: 3 endpoints de `research/institutions`.
- **E12 — Refazer Exame**: já implementado no protótipo (botão, modal de motivo, exclusão da fila, aviso no histórico do Usuário); falta `POST /exams/:id/retake` para deixar de ser só mock local.

**Para decidir com o time (não vira issue sozinho, ver seção 9):**
- Reimplementar ou não o fluxo completo de reset de senha.
