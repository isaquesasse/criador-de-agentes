import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, visibleQuestions, isAnswered, sanitizeAnswers } from '../js/questions.js';

const q = (id) => QUESTIONS.find((x) => x.id === id);
const ids = (a) => visibleQuestions(a).map((x) => x.id);

test('todas as perguntas têm id único, title, why e tip não vazios', () => {
  assert.equal(new Set(QUESTIONS.map((x) => x.id)).size, QUESTIONS.length);
  for (const x of QUESTIONS) {
    for (const k of ['title', 'why', 'tip']) assert.ok(x[k].trim(), `${x.id}.${k}`);
    assert.ok(Array.isArray(x.examples), `${x.id}.examples`);
  }
});

test('perguntas single/multi têm options; text/long não têm', () => {
  for (const x of QUESTIONS) {
    if (x.type === 'single' || x.type === 'multi') assert.ok(x.options?.length > 0, x.id);
    else assert.equal(x.options, undefined, x.id);
  }
});

test('isAnswered: "   " é falso, "RH" é verdadeiro', () => {
  assert.equal(isAnswered(q('nome'), { nome: '   ' }), false);
  assert.equal(isAnswered(q('nome'), {}), false);
  assert.equal(isAnswered(q('nome'), { nome: 'RH' }), true);
});

test('isAnswered: choices vazio + other "  " é falso; other "Logística" é verdadeiro', () => {
  assert.equal(isAnswered(q('area'), { area: { choices: [], other: '  ' } }), false);
  assert.equal(isAnswered(q('area'), { area: { choices: [] } }), false);
  assert.equal(isAnswered(q('area'), { area: { choices: [], other: 'Logística' } }), true);
  assert.equal(isAnswered(q('area'), { area: { choices: ['rh'], other: '' } }), true);
});

test('formatos só aparece quando entrada contém arquivos ou planilhas', () => {
  const e = (choices) => ({ entrada: { choices, other: '' } });
  assert.ok(!ids({}).includes('formatos'));
  assert.ok(!ids(e(['texto'])).includes('formatos'));
  assert.ok(ids(e(['arquivos'])).includes('formatos'));
  assert.ok(ids(e(['planilhas'])).includes('formatos'));
});

test('criterios aparece quando saida contém nota ou relatorio, não só texto', () => {
  const s = (choices) => ({ saida: { choices, other: '' } });
  assert.ok(!ids({}).includes('criterios'));
  assert.ok(!ids(s(['lista'])).includes('criterios'));
  assert.ok(!ids(s(['texto'])).includes('criterios'));
  assert.ok(ids(s(['nota'])).includes('criterios'));
  assert.ok(ids(s(['relatorio'])).includes('criterios'));
});

test('visibleQuestions({}) tem 12 perguntas e mantém a ordem de QUESTIONS', () => {
  const v = visibleQuestions({});
  assert.equal(v.length, 12);
  const order = QUESTIONS.map((x) => x.id);
  const pos = v.map((x) => order.indexOf(x.id));
  assert.deepEqual(pos, [...pos].sort((a, b) => a - b));
});

test('isAnswered e visibleQuestions não quebram com choices em formato errado', () => {
  assert.equal(isAnswered(q('area'), { area: { choices: 'rh' } }), false);
  assert.equal(isAnswered(q('area'), { area: 123 }), false);
  assert.doesNotThrow(() => visibleQuestions({ entrada: { choices: 'arquivos' }, saida: { choices: 5 } }));
  assert.ok(!ids({ entrada: { choices: 'arquivos' } }).includes('formatos'));
});

test('sanitizeAnswers: respostas válidas ficam iguais', () => {
  const a = { nome: 'Leitor', objetivo: 'Ler\ncurrículos', area: { choices: ['rh'], other: '' }, entrada: { choices: [], other: 'Áudios' } };
  assert.deepEqual(sanitizeAnswers(a), a);
});

test('sanitizeAnswers: tipos errados e ids desconhecidos são descartados', () => {
  const a = { nome: 123, entrada: 'texto', area: { choices: 'rh' }, tom: ['formal'], saida: null, publico: { choices: [] }, xyz: 'oi' };
  assert.deepEqual(sanitizeAnswers(a), {});
  assert.deepEqual(sanitizeAnswers(null), {});
});

test('sanitizeAnswers: choices só com strings e other padrão ""', () => {
  assert.deepEqual(sanitizeAnswers({ entrada: { choices: ['texto', 1, null, 'links'], other: 7 } }), { entrada: { choices: ['texto', 'links'], other: '' } });
  assert.deepEqual(sanitizeAnswers({ area: { choices: ['rh'] } }), { area: { choices: ['rh'], other: '' } });
});

test('variavel é opcional, long e fica entre tarefas e saida', () => {
  const order = QUESTIONS.map((x) => x.id);
  assert.equal(q('variavel').required, false);
  assert.equal(q('variavel').type, 'long');
  assert.equal(order.indexOf('variavel'), order.indexOf('tarefas') + 1);
  assert.equal(order.indexOf('saida'), order.indexOf('variavel') + 1);
  assert.ok(q('variavel').examples.length >= 2 && q('variavel').examples.length <= 4);
  assert.ok(!/^(Conte|Diga|Imagine)/.test(q('variavel').tip));
  assert.ok(ids({}).includes('variavel'));
});

test('dica de regras cobre dados pessoais', () => {
  assert.match(q('regras').tip, /dados pessoais/);
  assert.ok(q('regras').examples.length >= 4);
});
