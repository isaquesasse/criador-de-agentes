import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, visibleQuestions } from '../js/questions.js';
import { assessDetail } from '../js/quality.js';

const q = (id) => QUESTIONS.find((x) => x.id === id);
const LONG_TEXT = 'uma resposta bem detalhada com mais de doze palavras para passar do limite mínimo exigido';
const answer = (x) =>
  x.type === 'text' || x.type === 'long'
    ? LONG_TEXT
    : { choices: [x.options[0].value], other: '' };

// Respostas completas, com "arquivos" e "nota" marcados para tornar as 14 perguntas visíveis.
function fullAnswers() {
  const a = {};
  for (const x of QUESTIONS) a[x.id] = answer(x);
  a.entrada = { choices: ['arquivos'], other: '' };
  a.saida = { choices: ['nota'], other: '' };
  return a;
}

test('respostas vazias: score 0, nível basico', () => {
  const r = assessDetail({});
  assert.equal(r.score, 0);
  assert.equal(r.level, 'basico');
});

test('só obrigatórias respondidas com textos curtos: nível basico ou bom e dicas para as opcionais', () => {
  const a = {
    nome: 'Leitor',
    area: { choices: ['rh'], other: '' },
    objetivo: 'Ler currículos',
    entrada: { choices: ['texto'], other: '' },
    tarefas: 'Ler e resumir',
    saida: { choices: ['lista'], other: '' },
  };
  const r = assessDetail(a);
  // 12 visíveis (com "variavel"); 4 respondidas + 2 long curtas (0,5) = 5 de 12 = 41,7 -> 42
  assert.equal(r.score, 42);
  assert.equal(r.level, 'basico');
  const ids = r.tips.map((t) => t.questionId);
  for (const id of ['publico', 'variavel', 'tom', 'conhecimento', 'exemplos', 'regras']) assert.ok(ids.includes(id));
  assert.equal(r.tips.length, 8);
});

test('todas as visíveis respondidas com 12+ palavras: score 100, excelente, sem dicas', () => {
  const a = fullAnswers();
  assert.equal(visibleQuestions(a).length, QUESTIONS.length);
  assert.deepEqual(assessDetail(a), { score: 100, level: 'excelente', tips: [] });
});

test('long com menos de 12 palavras gera dica "Dá para detalhar mais. ..."', () => {
  const a = { ...fullAnswers(), regras: 'Nunca inventar' };
  const r = assessDetail(a);
  assert.deepEqual(r.tips, [{ questionId: 'regras', text: 'Dá para detalhar mais. ' + q('regras').tip }]);
  assert.equal(r.score, 96); // 13,5 de 14
  assert.equal(r.level, 'excelente');
});

test('resposta só com espaços não conta', () => {
  const a = { ...fullAnswers(), tom: { choices: [], other: '   ' }, publico: '   ' };
  const r = assessDetail(a);
  assert.deepEqual(r.tips.map((t) => t.questionId).sort(), ['publico', 'tom']);
  assert.equal(r.score, 86); // 12 de 14
  assert.equal(r.level, 'excelente');
});

test('pergunta oculta não entra no cálculo', () => {
  const a = fullAnswers();
  a.entrada = { choices: ['texto'], other: '' };
  delete a.formatos;
  const r = assessDetail(a);
  assert.equal(r.score, 100);
  assert.ok(!r.tips.some((t) => t.questionId === 'formatos'));
  // marcar "arquivos" sem preencher "formatos" passa a gerar dica
  a.entrada = { choices: ['arquivos'], other: '' };
  assert.ok(assessDetail(a).tips.some((t) => t.questionId === 'formatos'));
});

test('dicas de resposta curta não repetem o verbo da dica da pergunta', () => {
  const a = { ...fullAnswers(), objetivo: 'Ler', publico: 'RH', tarefas: 'Ler e resumir' };
  const texts = assessDetail(a).tips.map((t) => t.text);
  assert.equal(texts.length, 3);
  for (const t of texts) {
    assert.ok(t.startsWith('Dá para detalhar mais. '), t);
    assert.ok(!/^Conte um pouco mais/.test(t), t);
  }
});
