// Medidor de nível de detalhe: pontua as respostas e sugere o que melhorar.

import { visibleQuestions, isAnswered } from './questions.js';
import { answerText } from './builder.js';

const MIN_WORDS = 12;

export function assessDetail(answers) {
  const visible = visibleQuestions(answers);
  const tips = [];
  let earned = 0;
  for (const q of visible) {
    if (!isAnswered(q, answers)) {
      if (!q.required) tips.push({ questionId: q.id, text: q.tip });
      continue;
    }
    const words = answerText(q, answers).split(/\s+/).filter(Boolean).length;
    if (q.type === 'long' && words < MIN_WORDS) {
      earned += 0.5;
      tips.push({ questionId: q.id, text: 'Dá para detalhar mais. ' + q.tip });
    } else {
      earned += 1;
    }
  }
  const score = Math.round((100 * earned) / visible.length);
  const level = score < 50 ? 'basico' : score < 80 ? 'bom' : 'excelente';
  return { score, level, tips };
}
