# Criador de Agentes — Design

Data: 2026-11-05

## Intenção
Qualquer pessoa, sem conhecimento técnico, quer um agente de IA que ajude no seu trabalho. O site faz perguntas simples e guiadas (área, objetivo, o que o agente recebe e entrega etc.) e, no fim, entrega um **arquivo** com as respostas e um **prompt pronto**. A pessoa cola ou anexa esse arquivo em uma IA (ChatGPT, Claude, Gemini…), e a IA monta o agente. O site não executa agente nenhum.

## Objetivos
- Fluxo guiado, prático e intuitivo; a pessoa termina em poucos minutos.
- Serve para tipos variados de agente: de assistente de conversa a ferramenta (ex.: leitor de currículos que recebe arquivos e devolve análise).
- Saída funciona colada ou anexada, e com as principais IAs.
- UX bonita e agradável (estilo escolhido: "claro e suave").

- **Clareza total e ajuda a quem não tem experiência (exigência do usuário, 2026-11-05):** cada pergunta explica em linguagem simples por que é feita, traz exemplos clicáveis e uma dica de como detalhar melhor; um medidor de "nível de detalhe" e dicas de melhoria guiam a pessoa a um agente bem detalhado; a tela final explica passo a passo o que fazer com o arquivo; o prompt gerado manda a IA fazer perguntas de esclarecimento se algo essencial estiver vago e entregar o agente completo (instruções, exemplos de uso e testes).

## Não-objetivos
- Sem login, banco de dados, servidor ou chamadas a APIs de IA.
- Sem executar nem hospedar o agente criado.
- Só português (sem internacionalização por enquanto).
- Sem salvar respostas fora do navegador da pessoa.

## Anti-objetivos (seria falha mesmo funcionando)
- Formulário longo, burocrático ou cheio de jargão técnico.
- Arquivo final genérico, que não reflete as respostas da pessoa.
- Visual frio ou intimidador para quem não é técnico.

## Decisões do usuário
- Saída: arquivo com as respostas + prompt para a IA montar o agente.
- Hospedagem: GitHub Pages, conta `isaquesasse`.
- Tipo de agente é livre (definido pelo usuário final).
- Prompt específico por IA para as principais, se necessário; se um único funcionar em todas, tudo bem.
- Fluxo: **uma pergunta por tela**, com barra de progresso.
- Estilo visual: **claro e suave** (gradientes leves, cantos bem arredondados, tom amigável).
- Idioma: apenas português.

## Minhas decisões (a confirmar)
- Tecnologia: HTML, CSS e JavaScript puros, sem build nem dependências. Os arquivos são servidos direto pelo GitHub Pages.
- Repositório: `criador-de-agentes`; endereço final `isaquesasse.github.io/criador-de-agentes`.
- Formato do arquivo: Markdown (`.md`), texto simples que funciona colado ou anexado.
- Perguntas base: (1) nome do agente, (2) área de atuação, (3) objetivo principal, (4) o que o agente recebe (texto, arquivos, dados…), (5) o que ele entrega, (6) tom/estilo de resposta, (7) regras e limites (o que nunca fazer). Perguntas extras condicionais, por exemplo: se recebe arquivos, perguntar formatos e como avaliar; se é conversa, perguntar público e exemplos de perguntas.
- Respostas por botões de escolha sempre que possível, com "Outra…" para texto livre; botão "pular" nas perguntas opcionais.
- Tela de revisão ao final, mostrando o arquivo montado (como a opção B do mockup) antes de baixar, com botões "Baixar .md" e "Copiar prompt".
- Variantes por IA: um seletor opcional na tela final (ChatGPT, Claude, Gemini, "Outra / genérico") que só ajusta a frase de abertura do prompt. O núcleo do prompt é o mesmo para todas.
- Progresso salvo em `localStorage` para a pessoa não perder o que respondeu ao recarregar.
- Acessibilidade: navegação por teclado, foco visível, contraste adequado, botões grandes, funciona no celular.
- Teste: um teste simples (script Node ou página de teste) para a função que monta o Markdown a partir das respostas.

## Deixado ao construtor
- Textos exatos de cada pergunta e das opções de botão.
- Animações e microinterações dentro do estilo "claro e suave".
- Estrutura de pastas e nomes de arquivos.
- Redação detalhada do prompt-base, mantendo-o claro para qualquer IA.

## Fora de escopo agora (ideias futuras)
Outros idiomas, galeria de modelos prontos de agente, exportar para outros formatos, contas e histórico.
