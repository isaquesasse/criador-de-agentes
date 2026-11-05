import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, visibleQuestions } from '../js/questions.js';
import { resumePoint, canAdvance, toggleChoice, setOther, setText, addExample } from '../js/flow.js';

const q = (id) => QUESTIONS.find((x) => x.id === id);
const ids = (a) => visibleQuestions(a).map((x) => x.id);

test('toggleChoice: single substitui a escolha e limpa "outra"', () => {
  let a = toggleChoice({}, q('area'), 'rh');
  assert.deepEqual(a.area, { choices: ['rh'], other: '' });
  a = toggleChoice({ area: { choices: [], other: 'Logística' } }, q('area'), 'vendas');
  assert.deepEqual(a.area, { choices: ['vendas'], other: '' });
});

test('toggleChoice: multi marca e desmarca, mantendo "outra"; não altera o original', () => {
  const start = { entrada: { choices: ['texto'], other: 'Áudios' } };
  const on = toggleChoice(start, q('entrada'), 'imagens');
  assert.deepEqual(on.entrada, { choices: ['texto', 'imagens'], other: 'Áudios' });
  const off = toggleChoice(on, q('entrada'), 'texto');
  assert.deepEqual(off.entrada, { choices: ['imagens'], other: 'Áudios' });
  assert.deepEqual(start.entrada, { choices: ['texto'], other: 'Áudios' });
});

test('toggleChoice em "arquivos" mostra e esconde a pergunta de formatos', () => {
  const on = toggleChoice({}, q('entrada'), 'arquivos');
  assert.ok(ids(on).includes('formatos'));
  assert.ok(!ids(toggleChoice(on, q('entrada'), 'arquivos')).includes('formatos'));
});

test('setOther: single limpa as escolhas; multi mantém', () => {
  assert.deepEqual(setOther({ area: { choices: ['rh'], other: '' } }, q('area'), 'Logística').area, { choices: [], other: 'Logística' });
  assert.deepEqual(setOther({ entrada: { choices: ['texto'], other: '' } }, q('entrada'), 'Áudios').entrada, { choices: ['texto'], other: 'Áudios' });
  assert.deepEqual(setOther({}, q('entrada'), 'x').entrada, { choices: [], other: 'x' });
});

test('setText guarda o texto como digitado', () => {
  assert.deepEqual(setText({ nome: 'a' }, q('nome'), ' Leitor '), { nome: ' Leitor ' });
});

test('addExample: long acrescenta em nova linha; text substitui; escolha preenche "outra"', () => {
  assert.equal(addExample({}, q('objetivo'), 'Ex').objetivo, 'Ex');
  assert.equal(addExample({ objetivo: 'Meu texto  ' }, q('objetivo'), 'Ex').objetivo, 'Meu texto\nEx');
  assert.equal(addExample({ objetivo: '   ' }, q('objetivo'), 'Ex').objetivo, 'Ex');
  assert.equal(addExample({ nome: 'Antigo' }, q('nome'), 'Novo').nome, 'Novo');
  assert.deepEqual(addExample({ area: { choices: ['rh'], other: '' } }, q('area'), 'Logística').area, { choices: [], other: 'Logística' });
});

test('resumePoint: nada respondido, primeira respondida, todas respondidas', () => {
  assert.deepEqual(resumePoint({}), ['question', 0]);
  assert.deepEqual(resumePoint({ nome: 'Leitor' }), ['question', 1]);
  const all = {};
  for (const x of visibleQuestions({})) all[x.id] = x.type === 'text' || x.type === 'long' ? 'ok' : { choices: [x.options[0].value], other: '' };
  assert.deepEqual(resumePoint(all), ['review']);
});

test('canAdvance: opcional sempre; obrigatória só com resposta que não seja só espaços', () => {
  assert.equal(canAdvance(q('publico'), {}), true);
  assert.equal(canAdvance(q('objetivo'), {}), false);
  assert.equal(canAdvance(q('objetivo'), { objetivo: '   \n ' }), false);
  assert.equal(canAdvance(q('objetivo'), { objetivo: 'Ler' }), true);
});
