# Documentação de Mocks e Testes Visuais

Este documento registra os mocks temporários implementados no frontend para permitir testes de fluxo e UI enquanto a integração com o Backend ou modelos de Inteligência Artificial ainda não estão 100% finalizados.

## Fluxo de Exames (ResultScreen - Issues #39 e #40)

Para testar as diferentes telas de Resultado do Exame (`ResultScreen.tsx`), implementamos um sorteio aleatório no carregamento da IA.

### Como funciona:
No arquivo `src/screens/Exam/AILoadingScreen.tsx`, ao final dos 2.5 segundos de carregamento, o aplicativo seleciona aleatoriamente um dos 4 estados abaixo e salva no `useExamStore` antes de redirecionar para a `ResultScreen`:

1. **POSITIVE**: Representa que a IA detectou indícios de escoliose. A tela fica vermelha e mostra o alerta para consultar um médico.
2. **NEGATIVE**: Representa que a IA não encontrou anomalias. A tela fica verde com ícone de sucesso.
3. **INCONCLUSIVE**: Representa um problema com a qualidade da foto. A tela fica laranja e exibe um botão para "Tentar Novamente", redirecionando o usuário de volta para a Câmera.
4. **FAILED**: Simula uma falha de servidor (Erro 500, Timeout, etc). Exibe um erro vermelho pedindo para tentar novamente, redirecionando o fluxo de volta para o `AILoadingScreen` (que re-sorteará o estado).

**Nota de Remoção:** Quando a integração final (Issue #43) for feita conectando a `examService.ts` com a verdadeira resposta do Backend, este bloco demarcado como `// --- MOCK TEMPORÁRIO PARA TESTES ---` no `AILoadingScreen.tsx` deverá ser deletado, e o fluxo passará a consumir a variável real retornada pelo servidor.
