const express = require('express');
const { createServer } = require('node:http');
const { randomBytes, randomInt } = require('node:crypto');
const path = require('node:path');
const { Server } = require('socket.io');
const situations = require('./situations');

const animals = { lion: '🦁', elephant: '🐘', giraffe: '🦒', zebra: '🦓', rhino: '🦏', leopard: '🐆' };
const token = () => randomBytes(24).toString('hex');
const clamp = value => Math.max(0, Math.min(100, value));

function createGameServer({ roundMs = 30000, roomTtlMs = 6 * 60 * 60 * 1000, allowedOrigins = process.env.ALLOWED_ORIGINS || '' } = {}) {
  const app = express();
  const http = createServer(app);
  const origins = allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  const io = new Server(http, {
    maxHttpBufferSize: 16384,
    cors: { origin: origins, methods: ['GET', 'POST'] }
  });
  const rooms = new Map();
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get(['/host', '/player'], (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

  function snapshot(room, identity) {
    const current = situations[room.round];
    const players = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, animal: p.animal, connected: !!p.socketId,
      water: p.water, energy: p.energy, survival: p.survival, score: p.score,
      alive: p.alive, survived: p.survived, answered: p.answer !== null,
      result: room.phase === 'results' || room.phase === 'finished' ? p.result : null
    })).sort((a, b) => b.score - a.score || b.survived - a.survived || b.survival - a.survival || a.name.localeCompare(b.name));
    return { code: room.code, phase: room.phase, hostConnected: !!room.hostSocket,
      round: room.round + 1, total: situations.length, deadline: room.deadline, serverNow: Date.now(),
      players, selfId: identity.playerId || null,
      selected: identity.playerId ? room.players.get(identity.playerId)?.answer : null,
      situation: current ? { title: current.title, icon: current.icon, story: current.story,
        options: current.options.map(o => ({ text: o.text })),
        lesson: room.phase !== 'question' ? current.lesson : null,
        outcomes: room.phase !== 'question' ? current.options : null } : null };
  }
  function publish(room) {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.identity?.code === room.code) socket.emit('state', snapshot(room, socket.data.identity));
    }
  }
  function finishRound(room) {
    if (room.phase !== 'question') return;
    clearTimeout(room.timer);
    for (const p of room.players.values()) {
      if (!p.alive) { p.result = null; continue; }
      const effect = situations[room.round].options[p.answer] || { water: -15, energy: -15, survival: -10, points: 0 };
      const previous = { water: p.water, energy: p.energy, survival: p.survival };
      for (const key of ['water', 'energy', 'survival']) p[key] = clamp(p[key] + effect[key]);
      p.alive = p.water > 0 && p.energy > 0 && p.survival > 0;
      if (p.alive) p.survived++;
      const points = effect.points + (p.alive ? 50 : 0);
      p.score += points;
      p.result = { choice: p.answer, points, water: p.water - previous.water, energy: p.energy - previous.energy, survival: p.survival - previous.survival };
    }
    room.deadline = null;
    room.phase = room.round === situations.length - 1 || ![...room.players.values()].some(p => p.alive) ? 'finished' : 'results';
    publish(room);
  }
  function nextRound(room) {
    room.round++;
    room.phase = 'question';
    room.deadline = Date.now() + roundMs;
    for (const p of room.players.values()) { p.answer = null; p.result = null; }
    room.timer = setTimeout(() => finishRound(room), roundMs);
    publish(room);
  }
  const fail = message => { throw new Error(message); };
  io.on('connection', socket => {
    function handle(event, fn) {
      socket.on(event, (input, ack) => {
        if (typeof ack !== 'function') return;
        try {
          const now = Date.now();
          if (!socket.data.window || now - socket.data.window > 10000) { socket.data.window = now; socket.data.requests = 0; }
          if (++socket.data.requests > 50) fail('Demasiadas solicitudes. Espera unos segundos.');
          const result = fn(input && typeof input === 'object' ? input : {});
          ack({ ok: true, ...result });
        } catch (error) { ack({ ok: false, error: error.message }); }
      });
    }
    function bind(room, role, player) {
      const oldId = player ? player.socketId : room.hostSocket;
      if (oldId && oldId !== socket.id) {
        const old = io.sockets.sockets.get(oldId);
        if (old) { old.data.identity = null; old.emit('replaced'); old.disconnect(true); }
      }
      socket.data.identity = { code: room.code, role, playerId: player?.id };
      if (player) player.socketId = socket.id;
      else room.hostSocket = socket.id;
      room.touched = Date.now();
      publish(room);
    }
    function getRoom(hostOnly = false) {
      const identity = socket.data.identity;
      const room = rooms.get(identity?.code);
      if (!room) fail('No tienes una sesión activa.');
      if (hostOnly && (identity.role !== 'host' || room.hostSocket !== socket.id)) fail('Solo el presentador puede realizar esta acción.');
      room.touched = Date.now();
      return room;
    }
    handle('create_room', () => {
      if (socket.data.identity) fail('Ya tienes una sesión activa.');
      if (rooms.size >= 500) fail('El servidor está lleno. Inténtalo más tarde.');
      let code;
      do { code = `SABANA-${randomInt(100000, 1000000)}`; } while (rooms.has(code));
      const room = { code, hostToken: token(), hostSocket: null, players: new Map(), phase: 'lobby', round: -1, deadline: null, touched: Date.now() };
      rooms.set(code, room);
      bind(room, 'host');
      return { session: { code, role: 'host', token: room.hostToken } };
    });
    handle('join_room', data => {
      if (socket.data.identity) fail('Ya tienes una sesión activa.');
      const room = rooms.get(String(data.code || '').trim().toUpperCase());
      if (!room) fail('No existe una sala con ese código.');
      if (room.phase !== 'lobby') fail('La partida ya ha comenzado.');
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (!name || name.length > 24) fail('Escribe un nombre de entre 1 y 24 caracteres.');
      if (!Object.hasOwn(animals, data.animal)) fail('Selecciona un animal válido.');
      if (room.players.size >= 100) fail('La sala está llena (100 jugadores).');
      if ([...room.players.values()].some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) fail('Ese nombre ya está en uso.');
      const player = { id: token(), token: token(), name, animal: data.animal, water: 70, energy: 70, survival: 70, score: 0, alive: true, survived: 0, answer: null, result: null };
      room.players.set(player.id, player);
      bind(room, 'player', player);
      return { session: { code: room.code, role: 'player', token: player.token } };
    });
    handle('resume', data => {
      if (socket.data.identity) fail('Ya tienes una sesión activa.');
      const room = rooms.get(data.code);
      if (!room) fail('La sala ya no está disponible. Crea una sala o vuelve a unirte.');
      if (data.role === 'host' && data.token === room.hostToken) bind(room, 'host');
      else {
        const player = [...room.players.values()].find(p => p.token === data.token);
        if (data.role !== 'player' || !player) fail('La sesión no es válida.');
        bind(room, 'player', player);
      }
    });
    handle('start_game', () => {
      const room = getRoom(true);
      if (room.phase !== 'lobby') fail('La partida ya ha comenzado.');
      if (![...room.players.values()].some(p => p.socketId)) fail('Debe haber al menos un jugador conectado.');
      nextRound(room);
    });
    handle('next_round', () => {
      const room = getRoom(true);
      if (room.phase !== 'results') fail('Espera a que termine la ronda.');
      nextRound(room);
    });
    handle('answer', data => {
      const room = getRoom();
      const p = room.players.get(socket.data.identity.playerId);
      if (!p || !p.alive) fail('No puedes responder en esta ronda.');
      if (room.phase !== 'question' || Date.now() >= room.deadline) fail('El tiempo ha terminado.');
      if (data.round !== room.round + 1) fail('Esta respuesta pertenece a otra ronda.');
      if (p.answer !== null) fail('Tu respuesta ya fue registrada.');
      if (!Number.isInteger(data.choice) || !situations[room.round].options[data.choice]) fail('Respuesta inválida.');
      p.answer = data.choice;
      publish(room);
      if ([...room.players.values()].filter(p => p.alive).every(p => p.answer !== null)) finishRound(room);
    });
    socket.on('disconnect', () => {
      const identity = socket.data.identity;
      const room = rooms.get(identity?.code);
      if (!room) return;
      if (identity.role === 'host' && room.hostSocket === socket.id) room.hostSocket = null;
      const player = room.players.get(identity.playerId);
      if (player?.socketId === socket.id) player.socketId = null;
      room.touched = Date.now();
      publish(room);
    });
  });
  const cleanup = setInterval(() => {
    for (const [code, room] of rooms) {
      if (!room.hostSocket && ![...room.players.values()].some(p => p.socketId) && Date.now() - room.touched > roomTtlMs) {
        clearTimeout(room.timer);
        rooms.delete(code);
      }
    }
  }, 60000);
  cleanup.unref();
  return { http, io, close: () => { clearInterval(cleanup); for (const room of rooms.values()) clearTimeout(room.timer); return new Promise(resolve => io.close(resolve)); } };
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createGameServer().http.listen(port, '0.0.0.0', () => console.log(`Supervivencia en la Sabana: http://localhost:${port}\nPresentador: /host · Jugadores: /player`));
}
module.exports = { createGameServer };
