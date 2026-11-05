export const STORAGE_KEY = 'criador-agentes:v1';

// Nunca lança: modo privado, cota cheia ou JSON ruim não podem derrubar o site.
export function loadAnswers(storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY));
    return data !== null && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

export function saveAnswers(answers, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // sem persistência: o questionário segue funcionando em memória
  }
}

export function clearAnswers(storage = globalThis.localStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignorado de propósito
  }
}
