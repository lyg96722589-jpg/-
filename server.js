const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const W = 900, H = 560, R = 24, DT = 1 / 60;

const server = http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, d) => {
    res.writeHead(e ? 500 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(e ? 'error' : d);
  });
});
const wss = new WebSocketServer({ server });

const clients = [null, null];
const keys = [new Set(), new Set()];
let G;

function newPlayer(t) {
  return { x: t ? W - 120 : 120, y: H / 2, hp: 100, fx: t ? -1 : 1, fy: 0, ax: t ? -1 : 1, ay: 0,
           slow: 0, melee: 0, fire: 0, curse: 0, swing: 0 };
}
function reset() { G = { p: [newPlayer(0), newPlayer(1)], b: [], winner: -1, over: 0, started: !!(clients[0] && clients[1]) }; }
reset();

function step() {
  if (!G.started) return;
  if (G.winner >= 0) { if ((G.over -= DT) <= 0) reset(); return; }
  for (let t = 0; t < 2; t++) {
    const p = G.p[t], e = G.p[1 - t], k = keys[t];
    let mx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    let my = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
    const len = Math.hypot(mx, my);
    if (len) { mx /= len; my /= len; p.fx = mx; p.fy = my; }
    const sp = p.slow > 0 ? 85 : 170;
    p.x = Math.min(W - R, Math.max(R, p.x + mx * sp * DT));
    p.y = Math.min(H - R, Math.max(R, p.y + my * sp * DT));
    let ax = (k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0);
    let ay = (k.has('ArrowDown') ? 1 : 0) - (k.has('ArrowUp') ? 1 : 0);
    const al = Math.hypot(ax, ay);
    if (al) { p.ax = ax / al; p.ay = ay / al; }
    ['slow', 'melee', 'fire', 'curse', 'swing'].forEach(s => p[s] = Math.max(0, p[s] - DT));

    if (k.has('Space') && p.melee <= 0) {
      p.melee = 0.6; p.swing = 0.18;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d < 78 && (dx / d) * p.fx + (dy / d) * p.fy > 0.2) {
        e.hp -= 18; e.x = Math.min(W - R, Math.max(R, e.x + dx / d * 30));
        e.y = Math.min(H - R, Math.max(R, e.y + dy / d * 30));
      }
    }
    if (k.has('Comma') && p.fire <= 0) {
      p.fire = 0.7; G.b.push({ x: p.x, y: p.y - 30, vx: p.ax * 420, vy: p.ay * 420, t, type: 'fire', life: 1.6 });
    }
    if (k.has('Period') && p.curse <= 0) {
      p.curse = 3.5; G.b.push({ x: p.x, y: p.y - 30, vx: p.ax * 320, vy: p.ay * 320, t, type: 'curse', life: 2 });
    }
  }
  G.b = G.b.filter(b => {
    b.x += b.vx * DT; b.y += b.vy * DT; b.life -= DT;
    const e = G.p[1 - b.t];
    if (Math.hypot(e.x - b.x, e.y - 6 - b.y) < R + 8) {
      if (b.type === 'fire') e.hp -= 12; else { e.hp -= 4; e.slow = 3; }
      return false;
    }
    return b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
  });
  for (let t = 0; t < 2; t++) if (G.p[t].hp <= 0) { G.p[t].hp = 0; G.winner = 1 - t; G.over = 4; }
}

setInterval(() => {
  step();
  const msg = JSON.stringify({ type: 'state', G, connected: [!!clients[0], !!clients[1]] });
  clients.forEach(c => c && c.readyState === 1 && c.send(msg));
}, 1000 / 60);

wss.on('connection', ws => {
  const t = clients[0] ? (clients[1] ? -1 : 1) : 0;
  if (t < 0) { ws.send(JSON.stringify({ type: 'full' })); ws.close(); return; }
  clients[t] = ws; keys[t].clear();
  ws.send(JSON.stringify({ type: 'hello', team: t, W, H, R }));
  if (clients[0] && clients[1]) reset();
  ws.on('message', m => { try { const d = JSON.parse(m); if (d.keys) keys[t] = new Set(d.keys); } catch {} });
  ws.on('close', () => { clients[t] = null; keys[t].clear(); reset(); });
});

server.listen(PORT, () => {
  console.log(`\n호스트 노트북:  http://localhost:${PORT}`);
  Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log(`상대 노트북:    http://${i.address}:${PORT}`));
});
