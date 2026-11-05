// Regras do fluxo de perguntas, sem DOM: onde retomar, quando avançar e como cada clique muda as respostas.
import { visibleQuestions, isAnswered } from './questions.js';

// Devolve os argumentos de show(): a primeira pergunta visível sem resposta, ou a revisão se todas estão respondidas.
export function resumePoint(answers) {
  const i = visibleQuestions(answers).findIndex((q) => !isAnswered(q, answers));
  return i === -1 ? ['review'] : ['question', i];
}

export const canAdvance = (q, answers) => !q.required || isAnswered(q, answers);

const choiceOf = (answers, q) => answers[q.id] ?? { choices: [], other: '' };

// single: a opção clicada substitui tudo (inclusive "outra"); multi: marca/desmarca e mantém "outra".
export function toggleChoice(answers, q, value) {
  if (q.type === 'single') return { ...answers, [q.id]: { choices: [value], other: '' } };
  const { choices, other } = choiceOf(answers, q);
  const next = choices.includes(value) ? choices.filter((c) => c !== value) : [...choices, value];
  return { ...answers, [q.id]: { choices: next, other } };
}

// Em single, escrever em "outra" desmarca as opções.
export function setOther(answers, q, text) {
  const { choices } = choiceOf(answers, q);
  return { ...answers, [q.id]: { choices: q.type === 'single' ? [] : choices, other: text } };
}

export const setText = (answers, q, text) => ({ ...answers, [q.id]: text });

export function addExample(answers, q, example) {
  if (q.type === 'text') return setText(answers, q, example);
  if (q.type === 'long') {
    const cur = (answers[q.id] ?? '').trim();
    return setText(answers, q, cur ? `${cur}\n${example}` : example);
  }
  return setOther(answers, q, example);
}
