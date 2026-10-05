const { test } = require('node:test');
const assert = require('node:assert/strict');
const { io } = require('socket.io-client');
const { createGameServer } = require('../server');

const emit = (socket, event, data = {}) => new Promise((resolve, reject) => {
  socket.timeout(2000).emit(event, data, (err, reply) => err ? reject(err) : resolve(reply));
});
async function waitFor(predicate) {
  const end = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('Timed out waiting for state');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
async function setup(t, options) {
  const game = createGameServer(options);
  await new Promise(resolve => game.http.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${game.http.address().port}`;
  const clients = [];
  t.after(async () => { clients.forEach(c => c.disconnect()); await game.close(); });
  async function connect() {
    const socket = io(url, { forceNew: true, reconnection: false });
    clients.push(socket);
    socket.on('state', state => { socket.state = state; });
    await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    return socket;
  }
  return { connect, url };
}

test('complete multiplayer expedition, authorization, private choices, and reconnection', async t => {
  const { connect, url } = await setup(t);
  for (const route of ['/', '/host', '/player', '/app.js', '/styles.css']) {
    const response = await fetch(url + route);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 100);
  }
  let host = await connect();
  let a = await connect();
  const b = await connect();
  const { session: hostSession } = await emit(host, 'create_room');
  assert.match(hostSession.code, /^SABANA-\d{6}$/);
  assert.equal((await emit(host, 'start_game')).ok, false);
  assert.equal((await emit(a, 'join_room', { code: hostSession.code, name: '', animal: 'lion' })).ok, false);
  assert.equal((await emit(a, 'join_room', { code: hostSession.code, name: 'Ana', animal: '__proto__' })).ok, false);
  const { session: aSession } = await emit(a, 'join_room', { code: hostSession.code, name: 'Ana', animal: 'lion' });
  assert.equal((await emit(b, 'join_room', { code: hostSession.code, name: 'ana', animal: 'zebra' })).ok, false);
  await emit(b, 'join_room', { code: hostSession.code, name: 'Bruno', animal: 'zebra' });
  assert.equal((await emit(a, 'start_game')).ok, false);
  assert.equal((await emit(host, 'start_game')).ok, true);
  await waitFor(() => a.state?.phase === 'question');
  assert.equal(a.state.players[0].water, 70);
  assert.equal(a.state.total, 12);
  assert.equal(a.state.situation.outcomes, null);
  assert.equal(JSON.stringify(a.state).includes(aSession.token), false);
  const stranger = await connect();
  assert.equal((await emit(stranger, 'resume', { ...hostSession, token: 'wrong' })).ok, false);
  assert.equal((await emit(stranger, 'join_room', { code: hostSession.code, name: 'Late', animal: 'lion' })).ok, false);
  assert.equal((await emit(a, 'answer', { round: 99, choice: 0 })).ok, false);
  assert.equal((await emit(a, 'answer', { round: 1, choice: 9 })).ok, false);
  assert.equal((await emit(a, 'answer', { round: 1, choice: 0 })).ok, true);
  assert.equal((await emit(a, 'answer', { round: 1, choice: 1 })).ok, false);
  await waitFor(() => b.state.players.find(p => p.name === 'Ana').answered);
  assert.equal(b.state.selected, null);
  assert.equal(b.state.players.find(p => p.name === 'Ana').result, null);
  const deadline = a.state.deadline;
  a.disconnect();
  host.disconnect();
  await waitFor(() => b.state.hostConnected === false && !b.state.players.find(p => p.name === 'Ana').connected);
  a = await connect();
  host = await connect();
  assert.equal((await emit(a, 'resume', aSession)).ok, true);
  assert.equal((await emit(host, 'resume', hostSession)).ok, true);
  await waitFor(() => a.state?.hostConnected);
  assert.equal(a.state.deadline, deadline);
  assert.equal(a.state.selected, 0);
  assert.equal(a.state.players.length, 2);
  await emit(b, 'answer', { round: 1, choice: 0 });
  await waitFor(() => host.state?.phase === 'results');
  assert.equal(host.state.players[0].score, 350 - host.state.players[0].result.timePenalty);
  assert.equal(host.state.players[0].water, 65);
  assert.equal((await emit(b, 'next_round')).ok, false);
  const choices = [0, 1, 2, 1, 2, 0, 0, 2, 1, 0, 2, 1];
  const deductions = new Map(host.state.players.map(p => [p.id, p.result.timePenalty]));
  for (let round = 2; round <= 12; round++) {
    assert.equal((await emit(host, 'next_round')).ok, true);
    assert.equal((await emit(a, 'answer', { round, choice: choices[round - 1] })).ok, true);
    assert.equal((await emit(b, 'answer', { round, choice: choices[round - 1] })).ok, true);
    await waitFor(() => host.state.round === round && host.state.phase !== 'question');
    assert.equal(host.state.phase, round === 12 ? 'finished' : 'results');
    assert.ok(host.state.players.every(p => p.alive && p.water > 0 && p.energy > 0));
    for (const p of host.state.players) deductions.set(p.id, deductions.get(p.id) + p.result.timePenalty);
  }
  assert.equal(host.state.phase, 'finished');
  for (const p of host.state.players) assert.equal(p.score, 4200 - deductions.get(p.id));
  assert.equal(host.state.players[0].survived, 12);
  assert.equal(host.state.players[0].survival, 100);
  assert.equal((await emit(host, 'next_round')).ok, false);
});

test('server deadline penalizes unanswered disconnected players and rejects late answers', async t => {
  const { connect } = await setup(t, { roundMs: 120 });
  const host = await connect();
  const a = await connect();
  const { session } = await emit(host, 'create_room');
  const { session: playerSession } = await emit(a, 'join_room', { code: session.code, name: 'Ana', animal: 'elephant' });
  await emit(host, 'start_game');
  a.disconnect();
  await waitFor(() => host.state?.phase === 'results');
  assert.equal(host.state.players[0].water, 55);
  assert.equal(host.state.players[0].energy, 55);
  assert.equal(host.state.players[0].survival, 60);
  assert.equal(host.state.players[0].score, 0);
  assert.equal(host.state.players[0].result.points, 0);
  const resumed = await connect();
  assert.equal((await emit(resumed, 'resume', playerSession)).ok, true);
  assert.equal((await emit(resumed, 'answer', { round: 1, choice: 0 })).ok, false);
});

test('resource exhaustion ends expedition without negative resources; rooms remain isolated', async t => {
  const { connect } = await setup(t);
  const host = await connect();
  const otherHost = await connect();
  const a = await connect();
  const first = await emit(host, 'create_room');
  const second = await emit(otherHost, 'create_room');
  assert.notEqual(first.session.code, second.session.code);
  await emit(a, 'join_room', { code: first.session.code, name: 'Ana', animal: 'giraffe' });
  await emit(host, 'start_game');
  for (const [index, choice] of [1, 0, 0, 0].entries()) {
    if (index) await emit(host, 'next_round');
    await emit(a, 'answer', { round: index + 1, choice });
    await waitFor(() => host.state.round === index + 1 && host.state.phase !== 'question');
  }
  assert.equal(host.state.phase, 'finished');
  assert.equal(host.state.players[0].survival, 0);
  assert.equal(host.state.players[0].alive, false);
  assert.equal(otherHost.state.phase, 'lobby');
  assert.equal(otherHost.state.players.length, 0);
});

test('slower answers earn fewer points; server timing survives reconnection and ignores client timing', async t => {
  const { connect } = await setup(t);
  const host = await connect();
  let fast = await connect();
  const slow = await connect();
  const { session } = await emit(host, 'create_room');
  const { session: fastSession } = await emit(fast, 'join_room', { code: session.code, name: 'Rápido', animal: 'lion' });
  await emit(slow, 'join_room', { code: session.code, name: 'Pausado', animal: 'zebra' });
  await emit(host, 'start_game');
  await emit(fast, 'answer', { round: 1, choice: 0 });
  await waitFor(() => fast.state?.answeredElapsedMs !== null);
  const frozenTime = fast.state.answeredElapsedMs;
  fast.disconnect();
  await new Promise(resolve => setTimeout(resolve, 1100));
  fast = await connect();
  await emit(fast, 'resume', fastSession);
  assert.equal(fast.state.answeredElapsedMs, frozenTime);
  assert.equal((await emit(fast, 'answer', { round: 1, choice: 0, elapsedMs: 0 })).ok, false);
  await emit(slow, 'answer', { round: 1, choice: 0, elapsedMs: 0, answeredElapsedMs: 0, timePenalty: 0, points: 99999 });
  await waitFor(() => host.state.phase === 'results');
  const fastResult = host.state.players.find(p => p.name === 'Rápido');
  const slowResult = host.state.players.find(p => p.name === 'Pausado');
  assert.equal(fastResult.result.elapsedMs, frozenTime);
  assert.ok(slowResult.result.elapsedMs >= frozenTime + 1000);
  assert.ok(slowResult.result.timePenalty >= 10);
  assert.ok(slowResult.score < fastResult.score);
  assert.equal(slowResult.score, 350 - slowResult.result.timePenalty);
  await emit(host, 'next_round');
  await waitFor(() => fast.state.round === 2);
  assert.equal(fast.state.answeredElapsedMs, null);
});

test('an unanswered round adds zero while preserving previously earned points', async t => {
  const { connect } = await setup(t, { roundMs: 300 });
  const host = await connect();
  const player = await connect();
  const { session } = await emit(host, 'create_room');
  await emit(player, 'join_room', { code: session.code, name: 'Ana', animal: 'lion' });
  await emit(host, 'start_game');
  await emit(player, 'answer', { round: 1, choice: 0 });
  await waitFor(() => host.state.phase === 'results');
  const previous = host.state.players[0].score;
  assert.equal(previous, 350);
  await emit(host, 'next_round');
  await waitFor(() => host.state.round === 2 && host.state.phase === 'results');
  assert.equal(host.state.players[0].score, previous);
  assert.equal(host.state.players[0].result.points, 0);
  assert.equal(host.state.players[0].result.choice, null);
  assert.equal(host.state.players[0].alive, true);
});
