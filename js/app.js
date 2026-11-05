// Telas do site: boas-vindas, perguntas (uma por vez) e revisão.
import { visibleQuestions, isAnswered } from './questions.js';
import { loadAnswers, saveAnswers, clearAnswers } from './state.js';
import { assessDetail } from './quality.js';

const LEVELS = { basico: 'Básico', bom: 'Bom', excelente: 'Excelente' };

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 10h8M8 13h5"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

const app = document.getElementById('app');
const state = { screen: 'welcome', index: 0, answers: loadAnswers() };

function show(screen, index = 0) {
  state.screen = screen;
  state.index = index;
  if (screen === 'welcome') renderWelcome(app);
  else if (screen === 'question') renderQuestion(app);
  else renderReview(app, state.answers, (i) => show('question', i));
  window.scrollTo(0, 0);
  app.querySelector('h1').focus();
}

function setAnswer(id, value) {
  state.answers = { ...state.answers, [id]: value };
  saveAnswers(state.answers);
}

function resumePoint(answers) {
  const visible = visibleQuestions(answers);
  const i = visible.findIndex((q) => !isAnswered(q, answers));
  return i === -1 ? ['review'] : ['question', i];
}

function renderWelcome(root) {
  const saved = visibleQuestions(state.answers).some((q) => isAnswered(q, state.answers));
  const step = (icon, title, text) =>
    `<li class="step"><span class="step-icon">${ICONS[icon]}</span><span><strong>${title}</strong>${text}</span></li>`;
  root.innerHTML = `
    <section class="card welcome">
      <p class="brand">${ICONS.spark}Criador de Agentes</p>
      <h1 tabindex="-1">Descreva o seu agente de IA, <span class="grad">sem precisar saber programar</span></h1>
      <p class="lead">Responda algumas perguntas simples. No fim, você recebe um arquivo pronto para entregar a uma IA, e ela monta o agente para você.</p>
      <ol class="steps">
        ${step('chat', 'Responda perguntas simples', 'Uma por vez, com exemplos e dicas.')}
        ${step('download', 'Baixe o arquivo', 'Com as suas respostas e o pedido já escrito.')}
        ${step('spark', 'Cole na sua IA e ela monta o agente', 'ChatGPT, Claude, Gemini ou outra.')}
      </ol>
      <p class="note">${ICONS.clock}<span>Leva cerca de <strong>5 minutos</strong>. As respostas ficam salvas só neste navegador.</span></p>
      <div class="actions">
        ${saved
          ? `<button type="button" class="btn btn-ghost" data-act="restart">Recomeçar do zero</button>
             <button type="button" class="btn btn-primary" data-act="resume">Continuar de onde parei</button>`
          : '<button type="button" class="btn btn-primary" data-act="start">Começar</button>'}
      </div>
    </section>`;
  root.querySelector('.actions').addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'start') show('question', 0);
    if (act === 'resume') show(...resumePoint(state.answers));
    if (act === 'restart' && confirm('Apagar todas as respostas e começar de novo?')) {
      clearAnswers();
      state.answers = {};
      show('question', 0);
    }
  });
}

function fieldHtml(q) {
  if (q.type === 'text')
    return `<label class="sr-only" for="answer">Sua resposta</label>
      <input id="answer" class="input" type="text" autocomplete="off" placeholder="Escreva aqui…">`;
  if (q.type === 'long')
    return `<label class="sr-only" for="answer">Sua resposta</label>
      <textarea id="answer" class="input" rows="5" placeholder="Escreva com as suas palavras…"></textarea>`;
  const button = (value, label) =>
    `<button type="button" class="choice" ${value === null ? 'data-other' : `data-value="${value}"`} aria-pressed="false"><span class="tick">${ICONS.check}</span>${label}</button>`;
  return `<p class="hint-choice" id="choice-hint">${q.type === 'single' ? 'Escolha uma opção.' : 'Marque todas que se aplicam.'}</p>
    <div class="choices" role="group" aria-labelledby="q-title" aria-describedby="choice-hint">
      ${q.options.map((o) => button(o.value, o.label)).join('')}
      ${q.allowOther ? button(null, 'Outra…') : ''}
    </div>
    ${q.allowOther ? `<div class="other" hidden>
      <label for="other">Descreva com as suas palavras</label>
      <input id="other" class="input" type="text" autocomplete="off">
    </div>` : ''}`;
}

function renderQuestion(root) {
  const q = visibleQuestions(state.answers)[state.index];
  const examples = q.examples.map((ex, i) => `<button type="button" class="chip" data-ex="${i}">${ex}</button>`).join('');
  root.innerHTML = `
    <section class="card question" aria-labelledby="q-title">
      <div class="topbar">
        <p class="progress-text" id="progress-text"></p>
        <span class="badge ${q.required ? 'badge-req' : ''}">${q.required ? 'Obrigatória' : 'Opcional'}</span>
      </div>
      <div class="progress" aria-hidden="true"><span class="progress-fill"></span></div>
      <h1 id="q-title" tabindex="-1">${q.title}</h1>
      <p class="why"><strong>Por que perguntamos isso?</strong> ${q.why}</p>
      <div class="field">${fieldHtml(q)}</div>
      <details class="examples" open>
        <summary>Ver exemplos <span>clique em um para usar</span></summary>
        <div class="chips">${examples}</div>
      </details>
      <aside class="tip">${ICONS.bulb}<p><strong>Dica:</strong> ${q.tip}</p></aside>
      <div class="meter">
        <p aria-live="polite">Nível de detalhe: <strong id="meter-level"></strong></p>
        <span class="meter-bar" aria-hidden="true"><span class="meter-fill"></span></span>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-ghost" data-act="back">Voltar</button>
        <span class="actions-end">
          ${q.required ? '' : '<button type="button" class="btn btn-ghost" data-act="skip">Pular</button>'}
          <button type="button" class="btn btn-primary" data-act="next" aria-describedby="next-hint">Continuar</button>
        </span>
      </div>
      <p class="next-hint" id="next-hint">Responda esta pergunta para continuar.</p>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const nextBtn = $('[data-act="next"]');
  const canAdvance = () => !q.required || isAnswered(q, state.answers);
  const goNext = () => {
    const visible = visibleQuestions(state.answers);
    if (state.index + 1 < visible.length) show('question', state.index + 1);
    else show('review');
  };

  // Atualiza progresso, medidor e "Continuar" sem recriar o campo em que a pessoa digita.
  const refresh = () => {
    const visible = visibleQuestions(state.answers);
    state.index = visible.indexOf(q);
    $('#progress-text').textContent = `Pergunta ${state.index + 1} de ${visible.length}`;
    $('.progress-fill').style.width = `${((state.index + 1) / visible.length) * 100}%`;
    const { score, level } = assessDetail(state.answers);
    if ($('#meter-level').textContent !== LEVELS[level]) $('#meter-level').textContent = LEVELS[level];
    $('.meter').dataset.level = level;
    $('.meter-fill').style.width = `${score}%`;
    nextBtn.disabled = !canAdvance();
    $('#next-hint').hidden = canAdvance();
  };

  const onEnter = (e) => {
    if (e.key === 'Enter' && !e.isComposing && canAdvance()) {
      e.preventDefault();
      goNext();
    }
  };

  if (q.type === 'text' || q.type === 'long') {
    const input = $('#answer');
    input.value = state.answers[q.id] ?? '';
    input.addEventListener('input', () => {
      setAnswer(q.id, input.value);
      refresh();
    });
    if (q.type === 'text') input.addEventListener('keydown', onEnter);
    $('.chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const ex = q.examples[chip.dataset.ex];
      const cur = input.value.trim();
      input.value = q.type === 'long' && cur ? `${cur}\n${ex}` : ex;
      setAnswer(q.id, input.value);
      refresh();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  } else {
    const otherBox = $('.other');
    const otherInput = $('#other');
    const answer = () => state.answers[q.id] ?? { choices: [], other: '' };
    const sync = () => {
      const { choices } = answer();
      root.querySelectorAll('.choice[data-value]').forEach((b) =>
        b.setAttribute('aria-pressed', choices.includes(b.dataset.value)));
      if (otherBox) $('.choice[data-other]').setAttribute('aria-pressed', !otherBox.hidden);
      refresh();
    };
    const openOther = (text) => {
      otherBox.hidden = false;
      if (text !== undefined) otherInput.value = text;
      const { choices } = answer();
      setAnswer(q.id, { choices: q.type === 'single' ? [] : choices, other: otherInput.value });
      sync();
      otherInput.focus();
    };
    if (otherInput) {
      otherInput.value = answer().other ?? '';
      otherBox.hidden = otherInput.value.trim() === '';
      otherInput.addEventListener('input', () => {
        setAnswer(q.id, { ...answer(), other: otherInput.value });
        refresh();
      });
      otherInput.addEventListener('keydown', onEnter);
    }
    $('.choices').addEventListener('click', (e) => {
      const btn = e.target.closest('.choice');
      if (!btn) return;
      if (btn.dataset.value === undefined) {
        if (q.type === 'multi' && !otherBox.hidden) {
          otherBox.hidden = true;
          otherInput.value = '';
          setAnswer(q.id, { ...answer(), other: '' });
          sync();
        } else openOther();
        return;
      }
      const v = btn.dataset.value;
      if (q.type === 'single') {
        if (otherBox) otherBox.hidden = true;
        if (otherInput) otherInput.value = '';
        setAnswer(q.id, { choices: [v], other: '' });
      } else {
        const { choices, other } = answer();
        setAnswer(q.id, { choices: choices.includes(v) ? choices.filter((c) => c !== v) : [...choices, v], other });
      }
      sync();
    });
    $('.chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) openOther(q.examples[chip.dataset.ex]);
    });
    sync();
  }

  $('.actions').addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'back') state.index === 0 ? show('welcome') : show('question', state.index - 1);
    if (act === 'skip' || act === 'next') goNext();
  });
  refresh();
}

// Temporário: a Task 7 substitui por revisão e download do arquivo.
export function renderReview(container, answers, goToQuestion) {
  container.innerHTML = `
    <section class="card">
      <h1 tabindex="-1">Revisão — em construção</h1>
      <p class="lead">Em breve você vai revisar as respostas e baixar o arquivo aqui.</p>
      <div class="actions"><button type="button" class="btn btn-primary">Voltar às perguntas</button></div>
    </section>`;
  container.querySelector('button').addEventListener('click', () =>
    goToQuestion(visibleQuestions(answers).length - 1));
}

show('welcome');
