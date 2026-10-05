const serverUrl = window.SABANA_CONFIG?.serverUrl || location.origin;
const socket = io(serverUrl);
const app = document.querySelector('#app');
const notice = document.querySelector('#notice');
const role = new URLSearchParams(location.search).get('role') === 'host' || location.pathname === '/host' ? 'host' : 'player';
const storageKey = `sabana-${location.pathname.replace(/\/(host|player)$/, '/')}-${serverUrl}-${role}`;
const animals = { lion: ['🦁', 'León'], elephant: ['🐘', 'Elefante'], giraffe: ['🦒', 'Jirafa'], zebra: ['🦓', 'Cebra'], rhino: ['🦏', 'Rinoceronte'], leopard: ['🐆', 'Leopardo'] };
const shapes = ['▲', '◆', '●'];
let state, session, clockOffset = 0, busy = false, replaced = false, screenKey = '', noticeTimeout;
let knownPlayers = new Set();
try { session = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Storage may be unavailable. */ }
const escape = text => String(text ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function message(text) {
  clearTimeout(noticeTimeout);
  notice.textContent = text;
  notice.hidden = !text;
  if (text) noticeTimeout = setTimeout(() => { notice.hidden = true; }, 7000);
}
function save(value) { session = value; try { value ? sessionStorage.setItem(storageKey, JSON.stringify(value)) : sessionStorage.removeItem(storageKey); } catch { message('Mantén esta pestaña abierta para conservar tu sesión.'); } }
async function request(event, data = {}) {
  if (!socket.connected) throw new Error('Reconectando… espera un momento.');
  const response = await new Promise((resolve, reject) => socket.timeout(8000).emit(event, data, (error, response) => error ? reject(new Error('No llegó la confirmación. Recarga para recuperar tu partida.')) : resolve(response)));
  if (!response.ok) { const error = new Error(response.error); error.rejected = true; throw error; }
  if (response.session) save(response.session);
  return response;
}
function animal(id) { return animals[id]?.[0] || '🌿'; }
function intro() {
  screenKey = '';
  app.innerHTML = `<section class="entry screen"><div class="mascot" aria-hidden="true">${role === 'host' ? '🦒' : '🦁'}<span class="spark spark-one">✦</span><span class="spark spark-two">✧</span></div>
    <p class="eyebrow">12 RETOS. UNA AVENTURA.</p><h1>${role === 'host' ? 'Guía la expedición' : '¿Sobrevivirás?'}</h1><p class="subtitle">${role === 'host' ? 'Reúne a tu manada. Tú marcas el ritmo.' : 'Entra, decide y conquista la sabana.'}</p>
    ${role === 'host' ? '<button class="primary" id="create">Crear sala <span>↗</span></button>' : `<form id="join"><label class="sr-only" for="code">Código de sala</label><input id="code" name="code" placeholder="Código de sala" value="${escape(new URLSearchParams(location.search).get('code') || '')}" required maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false"><label class="sr-only" for="name">Tu nombre</label><input id="name" name="name" placeholder="Tu nombre" required maxlength="24" autocomplete="nickname"><fieldset><legend class="sr-only">Elige tu animal</legend><div class="animals">${Object.entries(animals).map(([id, [emoji, name]], i) => `<label title="${name}"><input type="radio" name="animal" value="${id}" ${!i ? 'checked' : ''}><span aria-hidden="true">${emoji}</span><span class="sr-only">${name}</span></label>`).join('')}</div></fieldset><button class="primary" type="submit">¡Vamos! <span>→</span></button></form>`}
    <p id="form-error" class="form-error" role="alert" hidden></p><a class="switch" href="./?role=${role === 'host' ? 'player' : 'host'}">${role === 'host' ? 'Entrar como jugador' : 'Soy presentador'}</a></section>`;
}
function stats(player) {
  return `<div class="stats">${[['water', '💧', 'Agua'], ['energy', '⚡', 'Energía'], ['survival', '💚', 'Supervivencia']].map(([key, icon, name]) => `<div class="stat"><span>${icon} <span class="stat-label">${name}</span></span><b>${player[key]}</b><progress class="${key}" max="100" value="${player[key]}" aria-label="${name}"></progress></div>`).join('')}</div>`;
}
function ranking() {
  return `<ol class="ranking" aria-label="Clasificación">${state.players.map((p, i) => `<li class="${p.id === state.selfId ? 'you' : ''}" style="--i:${Math.min(i, 10)}"><span class="rank-number">${i + 1}</span><span class="rank-animal">${animal(p.animal)}</span><span class="rank-name">${escape(p.name)}${p.id === state.selfId ? ' <small>(tú)</small>' : ''}</span><b>${p.score}<small> pts</small></b></li>`).join('')}</ol>`;
}
function podium() {
  return `<div class="podium" aria-label="Los tres primeros">${state.players.slice(0, 3).map((p, i) => `<div class="podium-place place-${i + 1}" style="--i:${2 - i}"><span class="podium-animal">${i === 0 ? '<span class="crown">👑</span>' : ''}${animal(p.animal)}</span><b>${escape(p.name)}</b><span>${p.score} pts</span><div class="podium-step">${i + 1}</div></div>`).join('')}</div>`;
}
function confetti() {
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i};--x:${(i * 37) % 100}%;--r:${i * 51}deg"></i>`).join('')}</div>`;
}
function lobby() {
  return `<section class="lobby screen"><p class="eyebrow">ÚNETE A LA MANADA</p><h1 class="code">${state.code}</h1><button class="text-button" id="copy">Copiar invitación ↗</button><div class="lobby-count"><span class="live-dot"></span><span id="player-count"></span></div><div id="players" class="players"></div>${role === 'host' ? '<button class="primary" id="start">¡Empezar! <span>→</span></button>' : '<p class="waiting"><span class="dots"><i></i><i></i><i></i></span>El presentador está preparando la aventura</p>'}<p class="microcopy">💧 70 · ⚡ 70 · 💚 70 <span>Cuida tus recursos. Si uno llega a 0, observas.</span></p></section>`;
}
function question(me) {
  const s = state.situation;
  const locked = role === 'host' || !me?.alive || me?.answered;
  return `<section class="question screen"><div class="round-top"><span class="eyebrow">RETO ${state.round} <span class="muted">/ ${state.total}</span></span><div id="timer" class="timer" role="timer" aria-label="Segundos restantes"><span id="seconds"></span></div></div><div class="time-track"><div id="time-fill"></div></div><div class="question-copy"><span class="situation-icon" aria-hidden="true">${s.icon}</span><h1>${escape(s.title)}</h1><p>${escape(s.story)}</p></div>
    <div class="options ${me?.answered ? 'has-answer' : ''}">${s.options.map((o, i) => `<button class="option color-${i} ${state.selected === i ? 'selected' : ''}" style="--i:${i}" data-choice="${i}" ${locked ? 'disabled' : ''}><span class="option-shape" aria-hidden="true">${shapes[i]}</span><b>${escape(o.text)}</b><span class="option-key" aria-hidden="true">${state.selected === i ? '✓' : i + 1}</span></button>`).join('')}</div><div class="question-footer"><span id="answer-count"></span><span id="answer-status" role="status">${me?.answered ? '<span class="saved-check">✓</span> ¡Respuesta enviada!' : role === 'host' ? 'La manada está decidiendo…' : !me?.alive ? 'Sigue la aventura como espectador' : 'Confía en tu instinto. Elige una.'}</span></div></section>`;
}
function results(me) {
  const final = state.phase === 'finished';
  const result = me?.result;
  const good = result?.basePoints >= 300;
  const best = state.situation.outcomes.reduce((a, b) => a.points > b.points ? a : b);
  return `<section class="results screen">${final || good ? confetti() : ''}<p class="eyebrow">${final ? 'EXPEDICIÓN COMPLETADA' : `RETO ${state.round} COMPLETADO`}</p>${final ? `<h1>¡Esta es la manada!</h1>${podium()}` : `<div class="result-icon" aria-hidden="true">${good ? '🙌' : me ? '🌱' : '✨'}</div><h1>${good ? '¡Buen instinto!' : me ? 'Cada decisión enseña' : '¡Así va la aventura!'}</h1>${result ? `<div class="points-pop">+${result.points}<span> puntos</span></div><div class="deltas">${[['water', '💧', 'Agua'], ['energy', '⚡', 'Energía'], ['survival', '💚', 'Supervivencia']].map(([key, icon, label]) => `<span class="${result[key] >= 0 ? 'positive' : 'negative'}" aria-label="${label}: ${result[key]}">${icon} ${result[key] > 0 ? '+' : ''}${result[key]}</span>`).join('')}</div>${result.choice === null ? '<p class="muted">Se acabó el tiempo para responder.</p>' : ''}` : ''}`}
    ${result ? `<p class="scoring-note">${result.choice === null ? 'Sin respuesta: 0 puntos en este reto.' : `Descuento por tiempo: −${result.timePenalty} pts · ${Math.floor(result.elapsedMs / 1000)} s para responder.${final ? ` Este reto: +${result.points} pts.` : ''}`}</p>` : ''}
    <div class="learning"><span>🌿</span><div><b>${escape(best.text)}</b><p>${escape(state.situation.lesson)}</p></div></div>
    ${role === 'host' && !final ? '<button class="primary" id="next">Siguiente reto <span>→</span></button>' : final ? '<button class="primary" id="reset">Volver a jugar <span>↗</span></button>' : '<p class="waiting"><span class="dots"><i></i><i></i><i></i></span>Preparando el siguiente reto</p>'}
    ${ranking()}</section>`;
}
function render() {
  if (!state) return intro();
  const me = state.players.find(p => p.id === state.selfId);
  const key = `${state.code}-${state.phase}-${state.round}`;
  // Keep the current DOM during live updates: animations, focus and taps must not restart.
  if (screenKey !== key) {
    screenKey = key;
    app.innerHTML = `<p id="host-status" class="banner" hidden>El presentador está reconectando…</p>${me && state.phase !== 'lobby' ? `<div class="player-hud"><span>${animal(me.animal)} ${escape(me.name)}</span><b>${me.score} pts</b></div>${stats(me)}` : ''}${state.phase === 'lobby' ? lobby() : state.phase === 'question' ? question(me) : results(me)}`;
    if (state.phase === 'question') app.querySelector('.question').insertAdjacentHTML('beforeend', '<p id="time-cost" class="scoring-note"></p>');
    const heading = app.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  document.querySelector('#host-status').hidden = state.hostConnected;
  if (state.phase === 'lobby') updateLobby();
  if (state.phase === 'question') {
    const alive = state.players.filter(p => p.alive);
    document.querySelector('#answer-count').textContent = `${alive.filter(p => p.answered).length}/${alive.length} respuestas`;
    if (me?.answered) {
      document.querySelector('.options').classList.add('has-answer');
      document.querySelectorAll('[data-choice]').forEach(button => {
        button.disabled = true;
        const selected = Number(button.dataset.choice) === state.selected;
        button.classList.toggle('selected', selected);
        if (selected) button.querySelector('.option-key').textContent = '✓';
      });
      const status = document.querySelector('#answer-status');
      if (!status.dataset.saved) { status.innerHTML = '<span class="saved-check">✓</span> ¡Respuesta enviada!'; status.dataset.saved = 'true'; }
    }
  }
  updateClock();
}
function updateLobby() {
  const container = document.querySelector('#players');
  document.querySelector('#player-count').textContent = `${state.players.filter(p => p.connected).length} conectados`;
  if (!state.players.length) container.innerHTML = '<div class="empty"><span class="radar">🧭</span><p>Esperando exploradores<span class="ellipsis">…</span></p></div>';
  else {
    if (!knownPlayers.size) container.innerHTML = '';
    state.players.forEach(p => {
      let card = document.getElementById(`player-${p.id}`);
      if (!card) {
        card = document.createElement('div');
        card.id = `player-${p.id}`;
        card.className = 'player';
        card.innerHTML = `<span class="avatar">${animal(p.animal)}</span><b>${escape(p.name)}</b><span class="presence"></span>`;
        container.appendChild(card);
      }
      card.classList.toggle('offline', !p.connected);
      card.title = p.connected ? 'Conectado' : 'Reconectando';
    });
  }
  knownPlayers = new Set(state.players.map(p => p.id));
  const start = document.querySelector('#start');
  if (start) start.disabled = !state.players.some(p => p.connected);
}
function updateClock() {
  const timer = document.querySelector('#timer');
  if (!timer || state?.phase !== 'question') return;
  const remaining = Math.max(0, state.deadline - Date.now() - clockOffset);
  const seconds = Math.ceil(remaining / 1000);
  const label = document.querySelector('#seconds');
  if (label.textContent !== String(seconds)) {
    label.textContent = seconds;
    if (seconds <= 5 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) label.animate?.([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 250 });
  }
  timer.classList.toggle('urgent', seconds <= 10);
  const duration = state.roundMs;
  document.querySelector('#time-fill').style.transform = `scaleX(${Math.min(1, remaining / duration)})`;
  const me = state.players.find(p => p.id === state.selfId);
  const timeCost = document.querySelector('#time-cost');
  const elapsed = state.answeredElapsedMs ?? Math.max(0, duration - remaining);
  timeCost.textContent = me?.answered
    ? `Tiempo registrado: ${Math.floor(elapsed / 1000)} s. El descuento se detuvo.`
    : !seconds ? 'Tiempo terminado. Sin respuesta: 0 puntos.'
    : `−${state.pointsPerSecond} pts por segundo completo · Sin respuesta: 0 pts${me?.alive ? ` · ${Math.floor(elapsed / 1000)} s transcurridos` : ''}`;
  if (!seconds) document.querySelectorAll('[data-choice]').forEach(button => button.disabled = true);
}
setInterval(updateClock, 100);
socket.on('state', value => { state = value; clockOffset = value.serverNow - Date.now(); render(); });
socket.on('connect', async () => {
  document.querySelector('#connection').textContent = '● En línea';
  if (session) {
    try { await request('resume', session); message(''); }
    catch (error) { message(error.message); if (error.rejected) { save(null); state = null; render(); } }
  }
});
socket.on('disconnect', () => { document.querySelector('#connection').textContent = replaced ? 'Sesión en otra pestaña' : '○ Reconectando…'; });
socket.on('connect_error', () => { document.querySelector('#connection').textContent = '○ Sin conexión · Reintentando'; });
socket.on('replaced', () => { replaced = true; save(null); message('Tu sesión está abierta en otra pestaña. Continúa allí.'); });
async function action(fn, button) {
  if (busy) return;
  busy = true;
  if (button) { button.disabled = true; button.classList.add('is-busy'); button.setAttribute('aria-busy', 'true'); }
  const formError = document.querySelector('#form-error');
  if (formError) formError.hidden = true;
  message('');
  try { await fn(); } catch (error) {
    if (formError?.isConnected) { formError.textContent = error.message; formError.hidden = false; }
    else message(error.message);
  }
  finally {
    busy = false;
    if (button?.isConnected) {
      button.classList.remove('is-busy');
      button.removeAttribute('aria-busy');
      const me = state?.players.find(p => p.id === state.selfId);
      button.disabled = button.dataset.choice !== undefined && (state?.phase !== 'question' || !!me?.answered || !me?.alive || Date.now() + clockOffset >= state.deadline);
    }
  }
}
app.addEventListener('submit', event => {
  if (event.target.id !== 'join') return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (/^\d{6}$/.test(data.code.trim())) data.code = `SABANA-${data.code.trim()}`;
  action(() => request('join_room', data), event.target.querySelector('button'));
});
app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.id === 'reset') { save(null); location.reload(); return; }
  if (button.id === 'copy') {
    const invitation = new URL('./', location.href);
    invitation.search = new URLSearchParams({ role: 'player', code: state.code }).toString();
    action(async () => { try { await navigator.clipboard.writeText(invitation.href); message('¡Invitación copiada!'); } catch { message(`Comparte: ${invitation.href}`); } }, button);
  }
  const events = { create: 'create_room', start: 'start_game', next: 'next_round' };
  if (events[button.id]) action(() => request(events[button.id]), button);
  if (button.dataset.choice !== undefined) action(() => request('answer', { choice: Number(button.dataset.choice), round: state.round }), button);
});
document.addEventListener('keydown', event => {
  document.documentElement.dataset.input = 'keyboard';
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if (state?.phase === 'question' && /^[123]$/.test(event.key)) document.querySelector(`[data-choice="${Number(event.key) - 1}"]`)?.click();
});
document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, { passive: true });
intro();
