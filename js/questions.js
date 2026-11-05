// Perguntas do questionário. Resposta: string (text/long) ou { choices: string[], other: string } (single/multi).

const opts = (...pairs) => pairs.map(([value, label]) => ({ value, label }));
const picked = (answers, id, ...values) =>
  values.some((v) => Array.isArray(answers[id]?.choices) && answers[id].choices.includes(v));

export const QUESTIONS = [
  {
    id: 'nome',
    title: 'Como você quer chamar o seu agente?',
    why: 'Um nome curto ajuda a identificar o agente e a explicar para outras pessoas o que ele faz.',
    tip: 'Use o nome da tarefa principal, de um jeito que qualquer colega entenda.',
    examples: ['Leitor de currículos', 'Assistente de atendimento', 'Revisor de contratos', 'Resumidor de reuniões'],
    type: 'text',
    required: true,
  },
  {
    id: 'area',
    title: 'Em qual área de trabalho o agente vai ajudar?',
    why: 'A área nos ajuda a entender o vocabulário e o contexto em que o agente vai trabalhar.',
    tip: 'Escolha a que mais se aproxima. Se nenhuma servir, use "Outra" e escreva a sua.',
    examples: ['Logística', 'Recursos de pessoas e jurídico', 'Compras'],
    type: 'single',
    options: opts(
      ['rh', 'RH'],
      ['vendas', 'Vendas'],
      ['juridico', 'Jurídico'],
      ['financeiro', 'Financeiro'],
      ['atendimento', 'Atendimento ao cliente'],
      ['educacao', 'Educação'],
      ['marketing', 'Marketing'],
      ['saude', 'Saúde'],
      ['tecnologia', 'Tecnologia'],
    ),
    allowOther: true,
    required: true,
  },
  {
    id: 'objetivo',
    title: 'Qual é o objetivo do agente? O que ele deve resolver?',
    why: 'É a parte mais importante: quanto mais claro o objetivo, melhor o agente entende o que você espera dele.',
    tip: 'Conte qual problema existe hoje e como seria o mundo ideal depois que o agente estivesse funcionando.',
    examples: [
      'Ler currículos e dizer quais candidatos combinam com a vaga, para eu perder menos tempo na triagem.',
      'Responder dúvidas comuns de clientes sobre prazos de entrega e trocas.',
      'Ler contratos e apontar cláusulas que merecem atenção antes da assinatura.',
    ],
    type: 'long',
    required: true,
  },
  {
    id: 'publico',
    title: 'Quem vai usar o agente?',
    why: 'O agente conversa de um jeito diferente com um especialista e com alguém que está começando.',
    tip: 'Diga quem são essas pessoas e o quanto elas conhecem do assunto.',
    examples: [
      'A equipe de RH, que lê muitos currículos por dia.',
      'Clientes da loja, sem conhecimento técnico.',
      'Alunos do ensino médio.',
    ],
    type: 'long',
    required: false,
  },
  {
    id: 'entrada',
    title: 'O que o agente vai receber para trabalhar?',
    why: 'Saber o que chega até o agente nos ajuda a descrever como ele deve ler e entender o material.',
    tip: 'Marque tudo o que se aplica. Se for algo diferente, use "Outra".',
    examples: ['E-mails encaminhados', 'Gravações de reunião'],
    type: 'multi',
    options: opts(
      ['texto', 'Texto digitado ou colado'],
      ['arquivos', 'Arquivos (PDF, Word…)'],
      ['imagens', 'Imagens ou fotos'],
      ['planilhas', 'Planilhas (Excel…)'],
      ['links', 'Links de páginas da internet'],
      ['nada', 'Nada, ele só responde perguntas'],
    ),
    allowOther: true,
    required: true,
  },
  {
    id: 'formatos',
    title: 'Quais tipos de arquivo ele vai receber?',
    why: 'Cada tipo de arquivo tem suas particularidades, e isso muda a forma de o agente ler o conteúdo.',
    tip: 'Cite as extensões ou os nomes dos documentos e, se souber, como eles costumam vir organizados.',
    examples: ['PDF de currículos', 'Planilha Excel com vendas do mês', 'Contratos em Word'],
    type: 'text',
    required: false,
    showIf: (a) => picked(a, 'entrada', 'arquivos', 'planilhas'),
  },
  {
    id: 'tarefas',
    title: 'Passo a passo: o que o agente deve fazer?',
    why: 'Descrever as etapas na ordem em que você faria é o que mais deixa o agente parecido com o seu jeito de trabalhar.',
    tip: 'Imagine que está explicando a tarefa para um colega novo. Enumere as etapas: primeiro, depois, por fim.',
    examples: [
      '1) Ler o currículo. 2) Conferir se a pessoa tem os requisitos da vaga. 3) Listar pontos fortes e pontos de atenção.',
      '1) Entender a dúvida do cliente. 2) Procurar a resposta nas regras da loja. 3) Responder de forma simples.',
      '1) Ler o documento. 2) Marcar trechos importantes. 3) Escrever um resumo de 5 linhas.',
    ],
    type: 'long',
    required: true,
  },
  {
    id: 'saida',
    title: 'Como você quer receber o resultado?',
    why: 'Combinar o formato da resposta evita retrabalho: você recebe o resultado já pronto para usar.',
    tip: 'Marque todos os formatos que ajudam. Se precisar de algo específico, descreva em "Outra".',
    examples: ['E-mail pronto para enviar', 'Mensagem curta para WhatsApp'],
    type: 'multi',
    options: opts(
      ['texto', 'Texto corrido'],
      ['lista', 'Lista de itens'],
      ['tabela', 'Tabela'],
      ['relatorio', 'Relatório completo'],
      ['nota', 'Nota ou pontuação'],
      ['resumo', 'Resumo curto'],
    ),
    allowOther: true,
    required: true,
  },
  {
    id: 'criterios',
    title: 'Como a nota deve ser dada?',
    why: 'Sem regras claras, duas notas iguais podem significar coisas diferentes. Os critérios deixam a nota justa e repetível.',
    tip: 'Diga a escala (por exemplo, de 0 a 10) e o que faz a nota subir ou descer.',
    examples: [
      'De 0 a 10: experiência na área vale 5, formação vale 3 e idiomas valem 2.',
      'Nota de 1 a 5 pela clareza, educação e solução do problema.',
    ],
    type: 'long',
    required: false,
    showIf: (a) => picked(a, 'saida', 'nota'),
  },
  {
    id: 'tom',
    title: 'Em que tom o agente deve falar?',
    why: 'O jeito de escrever faz parte da imagem da sua equipe ou empresa.',
    tip: 'Pense em como você falaria com quem vai ler a resposta.',
    examples: ['Educado, mas sem enrolação', 'Divertido e próximo, com emojis'],
    type: 'single',
    options: opts(
      ['formal', 'Formal'],
      ['amigavel', 'Amigável'],
      ['direto', 'Direto ao ponto'],
      ['tecnico', 'Técnico'],
    ),
    allowOther: true,
    required: false,
  },
  {
    id: 'conhecimento',
    title: 'O que o agente precisa saber para fazer um bom trabalho?',
    why: 'O agente só conhece o que você contar. Regras, produtos e termos da sua empresa precisam ser informados.',
    tip: 'Liste políticas, nomes de produtos, siglas ou onde ficam as informações importantes.',
    examples: [
      'A troca é aceita em até 30 dias com nota fiscal.',
      'A vaga exige 3 anos de experiência e inglês intermediário.',
      'Chamamos os clientes de "parceiros" e a sigla OS significa ordem de serviço.',
    ],
    type: 'long',
    required: false,
  },
  {
    id: 'exemplos',
    title: 'Pode dar um exemplo real do que entra e do resultado ideal?',
    why: 'Um exemplo vale mais que várias explicações: mostra exatamente o que você espera receber.',
    tip: 'Cole um caso verdadeiro (sem dados pessoais) e escreva como seria a resposta perfeita.',
    examples: [
      'Entrada: um currículo de analista com 4 anos de experiência. Resultado: três pontos fortes e um ponto de atenção.',
      'Entrada: "Meu pedido não chegou". Resultado: pedido de desculpas e o prazo atualizado.',
    ],
    type: 'long',
    required: false,
  },
  {
    id: 'regras',
    title: 'O que o agente nunca deve fazer?',
    why: 'Limites claros protegem você de respostas inadequadas ou arriscadas.',
    tip: 'Pense em erros que já aconteceram ou que você teria medo de ver acontecer.',
    examples: [
      'Nunca inventar informações; se não souber, avisar.',
      'Nunca compartilhar dados pessoais de candidatos.',
      'Nunca prometer descontos ou prazos.',
    ],
    type: 'long',
    required: false,
  },
];

export function visibleQuestions(answers) {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

export function isAnswered(q, answers) {
  const a = answers[q.id];
  if (typeof a === 'string') return a.trim() !== '';
  if (!a) return false;
  return (Array.isArray(a.choices) && a.choices.length > 0) || (typeof a.other === 'string' && a.other.trim() !== '');
}

// Respostas salvas vêm de fora (localStorage antigo ou editado): mantém só o que tem o formato certo.
export function sanitizeAnswers(answers) {
  const clean = {};
  for (const q of QUESTIONS) {
    const a = answers?.[q.id];
    if (q.type === 'text' || q.type === 'long') {
      if (typeof a === 'string') clean[q.id] = a;
    } else if (a && typeof a === 'object' && Array.isArray(a.choices)) {
      clean[q.id] = {
        choices: a.choices.filter((c) => typeof c === 'string'),
        other: typeof a.other === 'string' ? a.other : '',
      };
    }
  }
  return clean;
}
