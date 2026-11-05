// Telas do site: boas-vindas, perguntas (uma por vez) e revisão.
import { visibleQuestions, isAnswered, sanitizeAnswers } from './questions.js';
import { loadAnswers, saveAnswers, clearAnswers } from './state.js';
import { assessDetail } from './quality.js';
import { TARGETS, buildDocument, fileNameFor, answerText } from './builder.js';
import { resumePoint, canAdvance, toggleChoice, setOther, setText, addExample } from './flow.js';

const LEVELS = { basico: 'Básico', bom: 'Bom', excelente: 'Excelente' };

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 10h8M8 13h5"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5M12 16h.01"/></svg>',
};

const step = (icon, title, text) =>
  `<li class="step"><span class="step-icon">${ICONS[icon]}</span><span><strong>${title}</strong>${text}</span></li>`;

const app = document.getElementById('app');
// fromReview: a pessoa veio da revisão (Melhorar/Editar) para ajustar uma resposta; "Continuar" a leva de volta.
// target: IA escolhida na revisão; dura enquanto a página estiver aberta.
const state = { screen: 'welcome', index: 0, answers: sanitizeAnswers(loadAnswers()), fromReview: false, target: 'generico' };

function show(screen, index = 0, fromReview = false) {
  state.fromReview = screen === 'question' && fromReview;
  state.screen = screen;
  state.index = index;
  if (screen === 'welcome') renderWelcome(app);
  else if (screen === 'question') renderQuestion(app);
  else renderReview(app, state.answers, (i) => show('question', i, true));
  window.scrollTo(0, 0);
  app.querySelector('h1').focus();
}

function setAnswers(answers) {
  state.answers = answers;
  saveAnswers(answers);
}

function renderWelcome(root) {
  const saved = visibleQuestions(state.answers).some((q) => isAnswered(q, state.answers));
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
          ${q.required || state.fromReview ? '' : '<button type="button" class="btn btn-ghost" data-act="skip">Pular</button>'}
          <button type="button" class="btn btn-primary" data-act="next" aria-describedby="next-hint">${state.fromReview ? 'Voltar à revisão' : 'Continuar'}</button>
        </span>
      </div>
      <p class="next-hint" id="next-hint">Responda esta pergunta para continuar.</p>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const nextBtn = $('[data-act="next"]');
  const canGo = () => canAdvance(q, state.answers);
  const goNext = () => {
    const visible = visibleQuestions(state.answers);
    if (!state.fromReview && state.index + 1 < visible.length) show('question', state.index + 1);
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
    nextBtn.disabled = !canGo();
    $('#next-hint').hidden = canGo();
  };

  const onEnter = (e) => {
    if (e.key === 'Enter' && !e.isComposing && canGo()) {
      e.preventDefault();
      goNext();
    }
  };

  if (q.type === 'text' || q.type === 'long') {
    const input = $('#answer');
    input.value = state.answers[q.id] ?? '';
    input.addEventListener('input', () => {
      setAnswers(setText(state.answers, q, input.value));
      refresh();
    });
    if (q.type === 'text') input.addEventListener('keydown', onEnter);
    $('.chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      setAnswers(addExample(state.answers, q, q.examples[chip.dataset.ex]));
      input.value = state.answers[q.id];
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
      setAnswers(setOther(state.answers, q, otherInput.value));
      sync();
      otherInput.focus();
    };
    if (otherInput) {
      otherInput.value = answer().other ?? '';
      otherBox.hidden = otherInput.value.trim() === '';
      otherInput.addEventListener('input', () => {
        setAnswers(setOther(state.answers, q, otherInput.value));
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
          setAnswers(setOther(state.answers, q, ''));
          sync();
        } else openOther();
        return;
      }
      if (q.type === 'single' && otherBox) {
        otherBox.hidden = true;
        otherInput.value = '';
      }
      setAnswers(toggleChoice(state.answers, q, btn.dataset.value));
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
    if (act === 'back') state.index === 0 ? show('welcome') : show('question', state.index - 1, state.fromReview);
    if (act === 'skip' || act === 'next') goNext();
  });
  refresh();
}

const LEVEL_TEXT = {
  basico: 'O essencial está aqui. Seguir as dicas mais abaixo deixa o agente bem mais certeiro.',
  bom: 'Bom trabalho! As dicas mais abaixo podem deixar o agente ainda melhor.',
  excelente: 'Excelente! O seu agente está muito bem descrito.',
};

export function renderReview(container, answers, goToQuestion) {
  const visible = visibleQuestions(answers);
  const missing = visible.find((q) => q.required && !isAnswered(q, answers));
  const { score, level, tips } = assessDetail(answers);
  const titleOf = (id) => visible.find((q) => q.id === id).title;
  const qButton = (id, label) =>
    `<button type="button" class="btn btn-ghost btn-sm" data-q="${id}" aria-label="${label}: ${titleOf(id)}">${label}</button>`;

  container.innerHTML = `
    <div class="review">
      <section class="card">
        <p class="brand">${ICONS.spark}Revisão final</p>
        <h1 tabindex="-1">Seu arquivo está <span class="grad">quase pronto</span></h1>
        <p class="lead">Confira o nível de detalhe, melhore o que quiser e baixe o arquivo para entregar à sua IA.</p>
        ${missing ? `<div class="alert" role="alert">${ICONS.alert}<div>
          <p><strong>Faltam respostas obrigatórias.</strong> Sem elas a IA não consegue montar o agente.</p>
          <button type="button" class="btn btn-primary" data-q="${missing.id}">Responder: ${missing.title}</button>
        </div></div>` : ''}
        <div class="meter meter-review" data-level="${level}">
          <p>Nível de detalhe: <strong>${LEVELS[level]}</strong></p>
          <span class="meter-bar" aria-hidden="true"><span class="meter-fill" style="width:${score}%"></span></span>
          <p class="meter-text">${LEVEL_TEXT[level]}</p>
        </div>
      </section>

      <section class="card" aria-labelledby="file-title">
        <h2 id="file-title">Seu arquivo</h2>
        <p class="hint-choice" id="target-hint">Para qual IA você vai entregar? Isso só muda a saudação no começo do texto.</p>
        <div class="choices" role="group" aria-labelledby="target-hint">
          ${TARGETS.map((t) => `<button type="button" class="choice" data-target="${t.id}" aria-pressed="${t.id === state.target}"><span class="tick">${ICONS.check}</span>${t.label}</button>`).join('')}
        </div>
        <div class="actions file-actions">
          <button type="button" class="btn btn-primary btn-icon" data-act="download">${ICONS.download}Baixar arquivo (.md)</button>
          <button type="button" class="btn btn-ghost btn-icon" data-act="copy">${ICONS.copy}Copiar tudo</button>
        </div>
        <p class="copy-status" role="status" aria-live="polite"></p>
        <pre class="preview" tabindex="0" aria-label="Prévia do arquivo"></pre>
      </section>

      <section class="card" aria-labelledby="next-title">
        <h2 id="next-title">E agora? Próximos passos</h2>
        <ol class="steps">
          ${step('download', 'Baixe ou copie o arquivo', 'Use os botões acima. O arquivo e o texto copiado são iguais.')}
          ${step('chat', 'Abra a sua IA', 'ChatGPT, Claude ou Gemini. Comece uma conversa nova.')}
          ${step('copy', 'Cole o texto na conversa ou anexe o arquivo', 'Cole com Ctrl+V na caixa de mensagem, ou anexe o arquivo pelo clipe, e envie.')}
          ${step('spark', 'Responda e peça o agente pronto', 'A IA pode fazer algumas perguntas. Responda e, no fim, peça: “Agora me entregue o agente pronto.”')}
        </ol>
      </section>

      ${tips.length ? `<section class="card" aria-labelledby="tips-title">
        <h2 id="tips-title">Quer um agente ainda mais detalhado?</h2>
        <p class="lead">Cada dica abaixo deixa o agente mais certeiro. Clique em “Melhorar”, ajuste a resposta e volte para cá.</p>
        <ul class="tips">${tips.map((t) => `<li class="tip">${ICONS.bulb}<p><strong>${titleOf(t.questionId)}</strong> ${t.text}</p>
          ${qButton(t.questionId, 'Melhorar')}</li>`).join('')}</ul>
      </section>` : ''}

      <section class="card" aria-labelledby="answers-title">
        <h2 id="answers-title">Suas respostas</h2>
        <ul class="answers">${visible.map((q) => `<li class="answer">
          <div><h3>${q.title}</h3><p class="answer-text"></p></div>
          ${qButton(q.id, isAnswered(q, answers) ? 'Editar' : 'Responder')}</li>`).join('')}</ul>
      </section>

      <div class="actions">
        <button type="button" class="btn btn-ghost" data-act="back">Voltar às perguntas</button>
        <button type="button" class="btn btn-ghost" data-act="restart">Começar outro agente</button>
      </div>
    </div>`;

  const $ = (sel) => container.querySelector(sel);
  const preview = $('.preview');
  const status = $('.copy-status');
  const say = (text) => { status.textContent = text; };
  const update = () => { preview.textContent = buildDocument(answers, state.target); };

  container.querySelectorAll('.answer-text').forEach((p, i) => {
    p.textContent = answerText(visible[i], answers) || 'Sem resposta (opcional)';
    p.classList.toggle('empty', !isAnswered(visible[i], answers));
  });
  if (missing) container.querySelectorAll('.file-actions .btn').forEach((b) => { b.disabled = true; });

  $('.choices').addEventListener('click', (e) => {
    const btn = e.target.closest('.choice');
    if (!btn) return;
    state.target = btn.dataset.target;
    container.querySelectorAll('.choice').forEach((b) => b.setAttribute('aria-pressed', b === btn));
    say('');
    update();
  });

  $('.review').addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.q) goToQuestion(visible.findIndex((q) => q.id === btn.dataset.q));
    const act = btn.dataset.act;
    if (act === 'download') {
      const name = fileNameFor(answers);
      const url = URL.createObjectURL(new Blob([preview.textContent], { type: 'text/markdown;charset=utf-8' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`Arquivo “${name}” baixado. Veja os próximos passos abaixo.`);
    }
    if (act === 'copy') {
      try {
        await navigator.clipboard.writeText(preview.textContent);
        say('Copiado! Agora é só colar na conversa com a sua IA.');
      } catch {
        preview.focus();
        getSelection().selectAllChildren(preview);
        say('Não deu para copiar automaticamente — use Ctrl+C');
      }
    }
    if (act === 'back') show('question', visible.length - 1);
    if (act === 'restart' && confirm('Apagar todas as respostas e começar outro agente?')) {
      clearAnswers();
      state.answers = {};
      show('welcome');
    }
  });

  update();
}

show('welcome');
