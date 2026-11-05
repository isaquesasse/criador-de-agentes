export const STORAGE_KEY = 'criador-agentes:v1';

// Nunca lança: modo privado, cota cheia, iframe sandbox (ler localStorage já lança) ou JSON ruim
// não podem derrubar o site. undefined = usa o localStorage global; null = sem storage.
function resolve(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadAnswers(storage) {
  try {
    const data = JSON.parse(resolve(storage).getItem(STORAGE_KEY));
    return data !== null && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

export function saveAnswers(answers, storage) {
  try {
    resolve(storage).setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // sem persistência: o questionário segue funcionando em memória
  }
}

export function clearAnswers(storage) {
  try {
    resolve(storage).removeItem(STORAGE_KEY);
  } catch {
    // ignorado de propósito
  }
}
