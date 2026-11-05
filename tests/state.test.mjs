import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, loadAnswers, saveAnswers, clearAnswers } from '../js/state.js';

const fakeStorage = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    has: (k) => m.has(k),
  };
};
const throwing = () => {
  const boom = () => { throw new Error('boom'); };
  return { getItem: boom, setItem: boom, removeItem: boom };
};

test('salva e carrega as mesmas respostas', () => {
  const s = fakeStorage();
  const a = { nome: 'x', lista: [1, 2] };
  saveAnswers(a, s);
  assert.deepEqual(loadAnswers(s), a);
});

test('JSON corrompido devolve {}', () => {
  assert.deepEqual(loadAnswers(fakeStorage({ [STORAGE_KEY]: '{oops' })), {});
});

test('valor que não é objeto (ex.: "[1,2]" ou "null") devolve {}', () => {
  for (const v of ['[1,2]', 'null', '5', '"s"', 'true']) {
    assert.deepEqual(loadAnswers(fakeStorage({ [STORAGE_KEY]: v })), {}, v);
  }
});

test('storage que lança exceção em getItem/setItem não derruba (load devolve {}, save não lança)', () => {
  const s = throwing();
  assert.deepEqual(loadAnswers(s), {});
  assert.doesNotThrow(() => saveAnswers({ a: 1 }, s));
  assert.doesNotThrow(() => clearAnswers(s));
});

test('sem storage disponível (null) nada lança', () => {
  assert.deepEqual(loadAnswers(null), {});
  assert.doesNotThrow(() => saveAnswers({ a: 1 }, null));
  assert.doesNotThrow(() => clearAnswers(null));
});

test('clearAnswers remove a chave', () => {
  const s = fakeStorage({ [STORAGE_KEY]: '{"a":1}' });
  clearAnswers(s);
  assert.equal(s.has(STORAGE_KEY), false);
});
