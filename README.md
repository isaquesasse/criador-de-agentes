# Criador de Agentes

Site estático em português que guia a criação de um agente de IA. Você responde a um questionário simples e o site gera um arquivo `.md` com as suas respostas e um prompt pronto para uma IA montar o agente.

## Como funciona

1. **Responda as perguntas.** Uma por vez, com exemplos e dicas. Um medidor mostra se as respostas estão com detalhe suficiente.
2. **Revise e baixe o arquivo.** Você vê tudo o que escreveu antes de baixar o `.md`.
3. **Cole o arquivo em uma IA** (ChatGPT, Claude, Gemini ou outra). Ela usa as suas respostas para montar o agente.

## Rodar localmente

O projeto usa módulos ES, que não funcionam se o arquivo for aberto direto do disco (`file://`). Sirva a pasta com um servidor estático. Por exemplo, na pasta do projeto:

```sh
npx serve
```

Abra no navegador o endereço que aparecer no terminal (normalmente `http://localhost:3000`).

Você também pode usar a versão publicada: https://isaquesasse.github.io/criador-de-agentes/

## Testes

```sh
npm test
```

Usa o test runner nativo do Node (`node --test`). Requer Node 20 ou superior.

## Estrutura

- `index.html`: página única do site.
- `js/questions.js`: as perguntas do questionário.
- `js/builder.js`: monta o documento `.md` a partir das respostas.
- `js/quality.js`: medidor de nível de detalhe das respostas.
- `js/state.js`: salva as respostas no navegador (localStorage).
- `js/app.js`: a interface (telas de boas-vindas, perguntas e revisão).
- `css/styles.css`: estilos.
- `tests/`: testes automatizados.

## Publicação

O site é publicado com GitHub Pages a partir do ramo `main`, pasta raiz. Não há etapa de build: o que está no repositório é o que vai no ar.

Endereço: https://isaquesasse.github.io/criador-de-agentes/

## Privacidade

Tudo roda no seu navegador. As respostas ficam salvas só no seu navegador e nenhuma resposta é enviada a nenhum servidor.
