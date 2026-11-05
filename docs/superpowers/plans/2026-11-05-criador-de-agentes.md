# Criador de Agentes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático em português que guia uma pessoa sem experiência, pergunta por pergunta, e entrega um arquivo `.md` (respostas + prompt) para uma IA montar um agente bem detalhado.

**Architecture:** Lógica pura em módulos ES (`questions`, `state`, `builder`, `quality`) testados com `node --test`; uma camada de UI fina (`app.js`) renderiza o fluxo de uma pergunta por tela a partir dos dados de `questions.js`. Sem build, sem dependências, servido direto pelo GitHub Pages.

**Tech Stack:** HTML, CSS, JavaScript (módulos ES), `node:test` (Node ≥ 20) só para testes.

**Spec:** `docs/superpowers/specs/2026-11-05-criador-de-agentes-design.md`

## Global Constraints

- Só português (pt-BR) em toda a interface, sem internacionalização.
- Sem dependências npm, sem build, sem servidor, sem login, sem chamadas de rede.
- Hospedagem: GitHub Pages, conta `isaquesasse`, repositório `criador-de-agentes` (`isaquesasse.github.io/criador-de-agentes`).
- Saída: um único arquivo Markdown (`.md`) com prompt + respostas, que funciona colado ou anexado.
- Estilo visual "claro e suave": gradientes leves, cantos bem arredondados, tom amigável.
- Uma pergunta por tela, com barra de progresso; respostas por botões quando possível, com "Outra…" para texto livre; botão "Pular" nas opcionais.
- Progresso salvo em `localStorage` (chave `criador-agentes:v1`).
- Acessibilidade: teclado, foco visível, contraste adequado, botões grandes, funciona no celular.
- Linguagem sem jargão técnico: cada pergunta explica por que é feita, com exemplos clicáveis e uma dica de detalhamento.
- Seletor de IA (ChatGPT, Claude, Gemini, Genérico) altera só a frase de abertura do prompt.

## Review Focus

- Resposta só com espaços em branco conta como não respondida (Task 2, 5).
- Texto da pessoa começando com `#`, ``` ou `---` não pode quebrar a estrutura do documento gerado (Task 4).
- `localStorage` com JSON corrompido ou indisponível (modo privado) não pode travar o site (Task 3).
- Mudar uma resposta que esconde uma pergunta condicional (ex.: desmarcar "Arquivos") não pode deixar a resposta antiga no documento (Task 4).
- Nome do agente com acentos, símbolos ou vazio gera nome de arquivo válido, com fallback `meu-agente.md` (Task 4).

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Casca da página, carrega `css/styles.css` e `js/app.js` |
| `css/styles.css` | Tokens visuais e estilos do tema "claro e suave" |
| `js/questions.js` | Dados das perguntas + `visibleQuestions` + `isAnswered` |
| `js/state.js` | Persistência das respostas em `localStorage` |
| `js/builder.js` | Monta o documento Markdown, nome do arquivo, alvos de IA |
| `js/quality.js` | Medidor de detalhe e dicas de melhoria |
| `js/app.js` | Fluxo da interface: boas-vindas, perguntas, revisão, download/cópia |
| `tests/*.test.mjs` | Testes dos módulos de lógica |
| `README.md` | Como rodar localmente e publicar |

**Modelo de resposta (usado por todos os módulos):** `answers` é um objeto `{ [questionId]: Answer }`, onde `Answer` é `string` para perguntas `text`/`long` e `{ choices: string[], other: string }` para `single`/`multi`. `choices` guarda os `value` das opções; `other` é o texto da opção "Outra…" (vazio se não usada).

**Modelo de pergunta:** `Question = { id, title, why, tip, examples: string[], type: 'text'|'long'|'single'|'multi', options?: {value,label}[], allowOther?: boolean, required: boolean, showIf?: (answers) => boolean }`. `why` explica por que a pergunta é feita; `tip` é a dica de como detalhar melhor (também usada como sugestão quando a pergunta opcional não foi respondida).

---

### Task 1: Esqueleto do projeto

**Files:**
- Create: `package.json`, `.gitignore`, `README.md` (versão mínima)
- Commit existente: `docs/superpowers/specs/...-design.md`

**Interfaces:**
- Produces: comando `npm test` (= `node --test tests/`) usado em todas as tasks seguintes.

- [ ] **Step 1: Criar `package.json`** com `"name": "criador-de-agentes"`, `"private": true`, `"type": "module"`, `"scripts": { "test": "node --test tests/" }` e sem dependências.
- [ ] **Step 2: Criar `.gitignore`** com `node_modules/` e `.superpowers/`.
- [ ] **Step 3: Criar `README.md` mínimo** (uma frase do objetivo e `npm test`; será completado na Task 8).
- [ ] **Step 4: `git init` e commit** do spec, do plano e dos arquivos acima.
  Run: `git init && git add . && git commit -m "chore: esqueleto do projeto, design e plano"`
  Expected: commit criado.

---

### Task 2: Perguntas e regras de visibilidade

**Files:**
- Create: `js/questions.js`
- Test: `tests/questions.test.mjs`

**Interfaces:**
- Produces: `export const QUESTIONS: Question[]`; `export function visibleQuestions(answers): Question[]` (mantém a ordem de `QUESTIONS`, filtra por `showIf`); `export function isAnswered(q: Question, answers): boolean` (texto: `trim()` não vazio; escolha: `choices.length > 0` ou `other.trim() !== ''`).

**Perguntas (ordem fixa, ids exatos):** `nome` (text, obrigatória), `area` (single + outra, obrigatória; opções RH, Vendas, Jurídico, Financeiro, Atendimento ao cliente, Educação, Marketing, Saúde, Tecnologia), `objetivo` (long, obrigatória), `publico` (long, opcional: quem vai usar o agente), `entrada` (multi + outra, obrigatória; opções `texto`, `arquivos`, `imagens`, `planilhas`, `links`, `nada`), `formatos` (text, opcional; `showIf`: `entrada` contém `arquivos` ou `planilhas`), `tarefas` (long, obrigatória: passo a passo do que o agente deve fazer), `saida` (multi + outra, obrigatória; opções `texto`, `lista`, `tabela`, `relatorio`, `nota`, `resumo`), `criterios` (long, opcional; `showIf`: `saida` contém `nota`), `tom` (single + outra, opcional; opções formal, amigavel, direto, tecnico), `conhecimento` (long, opcional: informações que o agente precisa saber), `exemplos` (long, opcional: um exemplo real de entrada e do resultado ideal), `regras` (long, opcional: o que o agente nunca deve fazer). Textos de `title`, `why`, `tip` e `examples` (2 a 4 exemplos por pergunta, em linguagem simples) são redigidos pelo construtor, sem jargão.

- [ ] **Step 1: Escrever os testes** em `tests/questions.test.mjs`:
  - `todas as perguntas têm id único, title, why e tip não vazios`
  - `perguntas single/multi têm options; text/long não têm`
  - `isAnswered: "   " é falso, "RH" é verdadeiro` (text)
  - `isAnswered: choices vazio + other "  " é falso; other "Logística" é verdadeiro`
  - `formatos só aparece quando entrada contém arquivos ou planilhas`
  - `criterios só aparece quando saida contém nota`
  - `visibleQuestions({}) tem 11 perguntas e mantém a ordem de QUESTIONS`
- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test` — Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implementar `js/questions.js`** conforme a interface e a lista acima.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git add js tests && git commit -m "feat: perguntas e visibilidade condicional"`

---

### Task 3: Persistência local

**Files:**
- Create: `js/state.js`
- Test: `tests/state.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: `export const STORAGE_KEY = 'criador-agentes:v1'`; `export function loadAnswers(storage = globalThis.localStorage): object`; `export function saveAnswers(answers: object, storage = globalThis.localStorage): void`; `export function clearAnswers(storage = globalThis.localStorage): void`. Nenhuma lança exceção.

- [ ] **Step 1: Escrever os testes** com um `storage` falso (objeto com `getItem/setItem/removeItem` sobre um `Map`):
  - `salva e carrega as mesmas respostas`
  - `JSON corrompido devolve {}`
  - `valor que não é objeto (ex.: "[1,2]" ou "null") devolve {}`
  - `storage que lança exceção em getItem/setItem não derruba (load devolve {}, save não lança)`
  - `clearAnswers remove a chave`
- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test` — Expected: FAIL.
- [ ] **Step 3: Implementar `js/state.js`**; envolver cada acesso em `try/catch` e validar que o parse é objeto simples (não array, não null).
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: persistência segura das respostas"`

---

### Task 4: Montagem do documento Markdown

**Files:**
- Create: `js/builder.js`
- Test: `tests/builder.test.mjs`

**Interfaces:**
- Consumes: `QUESTIONS`, `visibleQuestions`, `isAnswered` de `js/questions.js`.
- Produces:
  - `export const TARGETS: {id:'chatgpt'|'claude'|'gemini'|'generico', label:string, opening:string}[]` (aberturas: "Olá, ChatGPT.", "Olá, Claude.", "Olá, Gemini.", "Olá!")
  - `export function answerText(q: Question, answers): string` — texto legível: para escolha, os `label` das opções marcadas mais `other` (se não vazio) separados por vírgula; para texto, `trim()`.
  - `export function buildDocument(answers, targetId = 'generico'): string`
  - `export function fileNameFor(answers): string` — slug do `nome` (minúsculas, sem acentos, só `a-z0-9-`) + `.md`; vazio ou sem caracteres válidos → `meu-agente.md`.

**Estrutura exata do documento** (títulos usados pelos testes): `# Pedido: criar o agente "{nome}"`, linha de abertura do alvo, `## O que você deve fazer` (lista numerada: 1. ler as respostas; 2. se algo essencial estiver vago ou faltando, fazer até 5 perguntas curtas antes de montar; 3. entregar as instruções completas do agente prontas para colar, 3 exemplos de uso e uma lista de testes para validar; 4. explicar em português simples como colocar o agente em uso na ferramenta), depois `## Respostas da pessoa` com um `### {q.title}` e o texto da resposta para cada pergunta visível e respondida, na ordem de `QUESTIONS`. Perguntas ocultas ou não respondidas não aparecem. O nome do agente é usado no título; se vazio, usar "(sem nome)".

**Proteção de estrutura:** em cada linha de resposta do usuário, escapar início de linha que comece com `#` (prefixar `\`), e substituir ``` por `'''`, e linha composta só de `---` por `\---`.

- [ ] **Step 1: Escrever os testes** em `tests/builder.test.mjs`:
  - `título do documento usa o nome do agente`
  - `inclui "### {title}" e a resposta de cada pergunta respondida`
  - `pergunta não respondida não aparece`
  - `resposta de pergunta oculta é ignorada` (ex.: `formatos` preenchido mas `entrada` = só `texto` → `formatos.title` ausente)
  - `escolha múltipla lista labels e o "outra"`; `outra vazia é ignorada`
  - `linha "## Regras falsas" na resposta vira "\## Regras falsas"`, e ``` vira `'''`, e `---` vira `\---`
  - `cada alvo muda só a linha de abertura` (documentos de `claude` e `gemini` iguais após trocar a abertura)
  - `alvo desconhecido cai no genérico`
  - `fileNameFor("Leitor de Currículos!") === "leitor-de-curriculos.md"`; `fileNameFor({}) === "meu-agente.md"`; nome só com símbolos → `meu-agente.md`
- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test` — Expected: FAIL.
- [ ] **Step 3: Implementar `js/builder.js`** conforme a interface; normalizar acentos com `normalize('NFD')` e remover diacríticos.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git add js tests && git commit -m "feat: geração do documento markdown"`

---

### Task 5: Medidor de detalhe e dicas

**Files:**
- Create: `js/quality.js`
- Test: `tests/quality.test.mjs`

**Interfaces:**
- Consumes: `visibleQuestions`, `isAnswered`, `answerText` (de `builder.js`).
- Produces: `export function assessDetail(answers): { score: number, level: 'basico'|'bom'|'excelente', tips: { questionId: string, text: string }[] }`.

**Regras:** sobre as perguntas visíveis, cada pergunta vale 1 ponto possível. Ganha 1 se respondida; perguntas `long` respondidas com menos de 12 palavras ganham 0,5. `score = round(100 * ganho / possível)`. Nível: `< 50` basico, `< 80` bom, senão excelente. Dicas: para cada pergunta opcional não respondida, `{questionId, text: q.tip}`; para cada `long` respondida com menos de 12 palavras, `{questionId, text: "Conte um pouco mais: " + q.tip}`. Resposta só com espaços conta como não respondida.

- [ ] **Step 1: Escrever os testes:**
  - `respostas vazias: score 0, nível basico`
  - `só obrigatórias respondidas com textos curtos: nível basico ou bom e dicas para as opcionais`
  - `todas as visíveis respondidas com 12+ palavras: score 100, excelente, sem dicas`
  - `long com menos de 12 palavras gera dica "Conte um pouco mais: ..."`
  - `resposta só com espaços não conta`
  - `pergunta oculta não entra no cálculo` (sem `arquivos`, `formatos` não gera dica)
- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test` — Expected: FAIL.
- [ ] **Step 3: Implementar `js/quality.js`** com as regras acima.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git add js tests && git commit -m "feat: medidor de nível de detalhe"`

---

### Task 6: Interface — boas-vindas e fluxo de perguntas

**Files:**
- Create: `index.html`, `css/styles.css`, `js/app.js`

**Interfaces:**
- Consumes: `visibleQuestions`, `isAnswered` (questions.js); `loadAnswers/saveAnswers/clearAnswers` (state.js); `assessDetail` (quality.js).
- Produces: `js/app.js` exporta `renderReview(container, answers, goToQuestion)` stub nesta task (implementado na Task 7); `app.js` mantém o estado `{ screen: 'welcome'|'question'|'review', index: number, answers }`.

**Comportamento obrigatório:**
- `index.html` tem `lang="pt-BR"`, `<main id="app">`, carrega `js/app.js` com `type="module"`.
- **Boas-vindas:** título, 3 passos ilustrados ("Responda perguntas simples" → "Baixe o arquivo" → "Cole na sua IA e ela monta o agente"), tempo estimado, botão "Começar" (e "Continuar de onde parei" se houver respostas salvas, mais "Recomeçar do zero").
- **Pergunta:** barra e texto de progresso ("Pergunta 3 de 11"); `title` como `<h1>`; o `why` logo abaixo em texto menor ("Por que perguntamos isso?"); campo conforme o tipo (botões grandes para `single`/`multi`, `input` para `text`, `textarea` para `long`, campo "Outra…" quando `allowOther`); **exemplos clicáveis** que preenchem o campo (em `long`, acrescentam ao texto existente); caixa de dica com `q.tip`; **medidor "Nível de detalhe: Básico/Bom/Excelente"** atualizado a cada resposta; botões "Voltar", "Continuar" (desabilitado enquanto obrigatória não respondida) e "Pular" (só nas opcionais).
- Progresso e total se recalculam com `visibleQuestions(answers)` a cada mudança; salvar em `localStorage` a cada alteração.
- Após a última pergunta vai para `review`.
- Acessibilidade: foco vai para o título a cada troca de tela, `Enter` avança em campos de uma linha, rótulos `<label>` em todos os campos, foco visível, alvos de toque ≥ 44px.
- Estilo "claro e suave": fundo em gradiente indigo→rosa muito claro, cartão branco com cantos de 20px e sombra suave, destaque indigo (`#6366f1`) e rosa (`#ec4899`), fonte do sistema.

- [ ] **Step 1: Criar `index.html` e `css/styles.css`** com tokens CSS (`--cor-destaque`, `--raio`, `--sombra`) e layout responsivo (cartão único centralizado, funciona a partir de 320px).
- [ ] **Step 2: Implementar `js/app.js`** (renderização por funções `renderWelcome`, `renderQuestion`, helpers que atualizam medidor/progresso sem recriar o campo digitado).
- [ ] **Step 3: Verificar no navegador.** Run: `python -m http.server 8000` e abrir `http://localhost:8000`. Expected: boas-vindas aparece; "Começar" leva à pergunta 1; "Continuar" só habilita após responder obrigatória; escolher só `texto` em "O que o agente recebe" não mostra a pergunta de formatos, escolher `arquivos` mostra; recarregar a página mantém as respostas; clicar num exemplo preenche o campo; medidor sobe conforme se responde mais.
- [ ] **Step 4: Verificar acessibilidade e celular.** Tab percorre tudo com foco visível; largura 375px sem rolagem horizontal.
- [ ] **Step 5: Commit** — `git add index.html css js && git commit -m "feat: fluxo de perguntas com ajuda e medidor de detalhe"`

---

### Task 7: Interface — revisão, download e próximos passos

**Files:**
- Modify: `js/app.js` (implementa `renderReview`)
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `buildDocument`, `fileNameFor`, `TARGETS` (builder.js); `assessDetail` (quality.js); `visibleQuestions`, `isAnswered` (questions.js).
- Produces: tela `review` completa.

**Comportamento obrigatório:**
- Mostra o **medidor de detalhe** e a lista de dicas de `assessDetail`; cada dica tem botão "Melhorar" que volta à pergunta correspondente.
- Resumo das respostas, cada item com botão "Editar" que leva à pergunta.
- **Seletor de IA** (`TARGETS`, padrão `generico`) que atualiza a prévia do documento.
- **Prévia** do documento em área rolável (somente leitura, `<pre>`).
- Botões "Baixar arquivo (.md)" (usa `Blob` + `fileNameFor`) e "Copiar tudo" (usa `navigator.clipboard.writeText`, com aviso "Copiado!" ou, se falhar, seleciona o texto da prévia e pede "Use Ctrl+C").
- Seção **"E agora? Próximos passos"**, em 4 passos numerados e simples: 1) baixe ou copie; 2) abra a sua IA (ChatGPT, Claude ou Gemini); 3) cole o texto na conversa ou anexe o arquivo; 4) responda às perguntas que a IA fizer e peça o agente pronto.
- Botão "Voltar às perguntas" e "Começar outro agente" (confirma antes, chama `clearAnswers`).

- [ ] **Step 1: Implementar `renderReview`** conforme acima, regenerando prévia e dicas quando o seletor ou as respostas mudam.
- [ ] **Step 2: Verificar no navegador.** Run: `python -m http.server 8000`; responder tudo e chegar à revisão. Expected: prévia começa com `# Pedido: criar o agente "…"`; trocar o seletor muda só a linha de abertura; "Baixar" salva `<nome-do-agente>.md` com o mesmo conteúdo da prévia; "Copiar tudo" mostra "Copiado!"; "Melhorar" volta à pergunta certa e, ao voltar para a revisão, a dica some se a resposta foi enriquecida; "Começar outro agente" pede confirmação e zera.
- [ ] **Step 3: Verificar o caso de agente sem nada opcional respondido** (só obrigatórias). Expected: medidor "Básico", dicas listadas, documento ainda válido.
- [ ] **Step 4: Commit** — `git commit -am "feat: tela de revisão, download e próximos passos"`

---

### Task 8: README e publicação no GitHub Pages

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: projeto completo.

- [ ] **Step 1: Completar o `README.md`:** o que é, como rodar localmente (`python -m http.server 8000`), como testar (`npm test`), e o endereço público.
- [ ] **Step 2: Rodar a suíte inteira.** Run: `npm test` — Expected: todos passam.
- [ ] **Step 3: Confirmar com o usuário antes de publicar** (ação pública, visível a todos).
- [ ] **Step 4: Criar o repositório e publicar.** Run: `gh repo create isaquesasse/criador-de-agentes --public --source . --push` e `gh api -X POST repos/isaquesasse/criador-de-agentes/pages -f "source[branch]=main" -f "source[path]=/"` — Expected: Pages habilitado. Se a branch local não se chamar `main`, renomear antes (`git branch -M main`).
- [ ] **Step 5: Verificar o site no ar.** Aguardar o deploy e abrir `https://isaquesasse.github.io/criador-de-agentes/`. Expected: fluxo completo funciona e o download gera o `.md`.
