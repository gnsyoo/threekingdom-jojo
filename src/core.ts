export const COLS = 18;
export const ROWS = 12;
export const TURN_LIMIT = 12;
export type Team = 'player' | 'ally' | 'enemy';
export type Terrain = 'grass' | 'road' | 'forest' | 'water' | 'bridge' | 'village' | 'camp' | 'wall';
export type Phase = Team;
export type Outcome = 'playing' | 'won' | 'lost';
export interface Point { x: number; y: number }
export interface Unit extends Point {
  id: string; name: string; role: string; team: Team; sprite: number;
  hp: number; maxHp: number; mp: number; maxMp: number;
  attack: number; defense: number; agility: number; movement: number;
  range: [number, number]; level: number; moved: boolean; acted: boolean;
  buff: number; confused: number; boss: boolean;
}
export interface BattleState {
  version: 1; units: Unit[]; round: number; phase: Phase; outcome: Outcome;
  seed: number; potions: number; choice: 'protect' | 'advance';
  pendingMove: { unitId: string; from: Point; to: Point } | null;
  fireTriggered: boolean; villageVisited: boolean; attacksMade: number;
  logs: string[]; startedAt: number; savedAt: number;
}
export interface Reachable extends Point { cost: number; path: Point[] }
export interface Hit { targetId: string; damage: number; missed: boolean; counter: boolean }
export interface AttackResult { hits: Hit[]; message: string }

export const TERRAIN_INFO: Record<Terrain, { name: string; cost: number; defense: number; description: string }> = {
  grass: { name: '평지', cost: 1, defense: 0, description: '탁 트인 들판. 빠르게 전열을 정비할 수 있다.' },
  road: { name: '돌길', cost: 1, defense: 0, description: '영천을 가로지르는 길. 이동 비용이 낮다.' },
  forest: { name: '숲', cost: 2, defense: .15, description: '진격은 느리지만 나무가 적의 공격을 막아준다.' },
  water: { name: '깊은 물', cost: Infinity, defense: 0, description: '건널 수 없다. 나무다리를 이용해야 한다.' },
  bridge: { name: '나무다리', cost: 1, defense: 0, description: '강을 건너는 유일한 길. 좁은 길목을 주의하라.' },
  village: { name: '마을', cost: 1, defense: .1, description: '아군 차례 시작에 최대 체력의 10%를 회복한다.' },
  camp: { name: '황건 진영', cost: 1, defense: .1, description: '적 지휘관이 지키는 진영. 방어에 유리하다.' },
  wall: { name: '건물', cost: Infinity, defense: 0, description: '통행할 수 없다. 마당과 길로 우회하라.' },
};

export const inBounds = (p: Point) => Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < COLS && p.y < ROWS;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const key = (p: Point) => `${p.x},${p.y}`;
export function terrainAt(p: Point): Terrain {
  if (!inBounds(p)) return 'wall';
  if (p.y === 6 && p.x >= 14 && p.x <= 16) return 'bridge';
  if (p.x === 15 || p.x === 16) return 'water';
  if (p.y <= 1 && p.x <= 3) return 'wall';
  if (p.x === 0 && p.y <= 5) return 'wall';
  if (p.x === 3 && p.y === 3) return 'village';
  if (p.y <= 1 || (p.x <= 3 && p.y >= 7) || (p.x === 17 && p.y !== 6)) return 'forest';
  if (p.x === 7) return 'road';
  if (p.x >= 11 && p.x <= 13 && p.y >= 2 && p.y <= 3) return 'camp';
  return 'grass';
}

function unit(id: string, name: string, team: Team, sprite: number, x: number, y: number, values: Partial<Unit>): Unit {
  return { id, name, team, sprite, x, y, role: '보병', hp: 64, maxHp: 64, mp: 0, maxMp: 0,
    attack: 23, defense: 16, agility: 16, movement: 4, range: [1, 1], level: 3,
    moved: false, acted: false, buff: 0, confused: 0, boss: false, ...values };
}

export function createBattle(choice: 'protect' | 'advance' = 'protect', seed = 184): BattleState {
  return {
    version: 1, round: 1, phase: 'player', outcome: 'playing', seed, choice,
    potions: choice === 'protect' ? 3 : 2, pendingMove: null, fireTriggered: false,
    villageVisited: false, attacksMade: 0, startedAt: Date.now(), savedAt: Date.now(),
    logs: ['영천 전투 시작. 장보와 장량을 퇴각시켜라.', choice === 'protect' ? '민가 보호를 준비했다. 회복약 3개를 보유한다.' : '선봉을 정비했다. 첫 라운드 공격력이 강화된다.'],
    units: [
      unit('cao', '조조', 'player', 0, 6, 9, { role: '군주', hp: 132, maxHp: 132, mp: 18, maxMp: 18, attack: 39, defense: 27, agility: 30, movement: 5, buff: choice === 'advance' ? 1 : 0 }),
      unit('liu', '유비', 'ally', 1, 5, 7, { role: '군주', hp: 105, maxHp: 105, attack: 29, defense: 22, movement: 5 }),
      unit('guan', '관우', 'ally', 2, 7, 7, { role: '기병', hp: 118, maxHp: 118, attack: 33, defense: 24, movement: 6, agility: 23 }),
      unit('zhang', '장비', 'ally', 3, 6, 6, { role: '보병', hp: 112, maxHp: 112, attack: 32, defense: 22, agility: 19 }),
      unit('bao', '장보', 'enemy', 6, 13, 2, { role: '황건 지휘관', hp: 88, maxHp: 88, attack: 25, defense: 19, movement: 3, boss: true }),
      unit('liang', '장량', 'enemy', 7, 13, 4, { role: '황건 지휘관', hp: 94, maxHp: 94, attack: 28, defense: 21, movement: 3, boss: true }),
      unit('e1', '황건병', 'enemy', 4, 10, 5, {}),
      unit('e2', '황건병', 'enemy', 4, 11, 7, {}),
      unit('e3', '황건병', 'enemy', 4, 9, 3, {}),
      unit('e4', '황건병', 'enemy', 4, 10, 1, {}),
      unit('b1', '황건 궁병', 'enemy', 5, 12, 5, { role: '궁병', range: [2, 3], hp: 53, maxHp: 53, defense: 12, attack: 24 }),
      unit('b2', '황건 궁병', 'enemy', 5, 17, 6, { role: '궁병', range: [2, 3], hp: 53, maxHp: 53, defense: 12, attack: 24 }),
    ],
  };
}

export const findUnit = (s: BattleState, id: string) => s.units.find(u => u.id === id);
export const unitAt = (s: BattleState, p: Point) => s.units.find(u => u.hp > 0 && u.x === p.x && u.y === p.y);
export const hostile = (a: Unit, b: Unit) => (a.team === 'enemy') !== (b.team === 'enemy');
export const alive = (u: Unit) => u.hp > 0;
const controlled = (s: BattleState, u: Unit) => s.outcome === 'playing' && s.phase === u.team && u.hp > 0 && !u.acted;
export const log = (s: BattleState, message: string) => { s.logs.push(message); s.logs = s.logs.slice(-30); };

export function reachable(s: BattleState, u: Unit): Reachable[] {
  if (!alive(u)) return [];
  const start: Reachable = { x: u.x, y: u.y, cost: 0, path: [] };
  const best = new Map<string, Reachable>([[key(u), start]]);
  const queue = [start];
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (best.get(key(current)) !== current) continue;
    for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      const p = { x: current.x + d.x, y: current.y + d.y };
      if (!inBounds(p)) continue;
      const occupant = unitAt(s, p);
      if (occupant && occupant.id !== u.id && hostile(u, occupant)) continue;
      let cost = TERRAIN_INFO[terrainAt(p)].cost;
      if (u.role === '기병' && terrainAt(p) === 'forest') cost = 3;
      const total = current.cost + cost;
      if (total > u.movement || (best.get(key(p))?.cost ?? Infinity) <= total) continue;
      const next: Reachable = { ...p, cost: total, path: [...current.path, p] };
      best.set(key(p), next); queue.push(next);
    }
  }
  return [...best.values()].filter(p => { const occupant = unitAt(s, p); return !occupant || occupant.id === u.id; });
}

export function moveUnit(s: BattleState, id: string, to: Point): boolean {
  const u = findUnit(s, id);
  if (!u || !controlled(s, u) || u.moved || s.pendingMove || distance(u, to) === 0) return false;
  const tile = reachable(s, u).find(p => p.x === to.x && p.y === to.y);
  if (!tile) return false;
  const from = { x: u.x, y: u.y };
  u.x = to.x; u.y = to.y; u.moved = true;
  if (u.team === 'player') s.pendingMove = { unitId: id, from, to: { ...to } };
  return true;
}

export function undoMove(s: BattleState): boolean {
  if (s.phase !== 'player' || !s.pendingMove || s.outcome !== 'playing') return false;
  const u = findUnit(s, s.pendingMove.unitId);
  if (!u || u.acted) return false;
  u.x = s.pendingMove.from.x; u.y = s.pendingMove.from.y; u.moved = false;
  s.pendingMove = null; return true;
}

export function canAttack(s: BattleState, a: Unit, b: Unit): boolean {
  const d = distance(a, b);
  return controlled(s, a) && alive(b) && hostile(a, b) && d >= a.range[0] && d <= a.range[1];
}
export function damageFor(a: Unit, b: Unit): number {
  const power = a.attack * (a.buff > 0 ? 1.1 : 1);
  let advantage = 1;
  if ((a.role === '궁병' && b.role === '기병') || (a.role === '기병' && b.role === '보병') || (a.role === '보병' && b.role === '궁병')) advantage = 1.2;
  return Math.max(1, Math.round(Math.max(1, power - b.defense * .55) * advantage * (1 - TERRAIN_INFO[terrainAt(b)].defense)));
}
export function previewAttack(a: Unit, b: Unit) {
  const d = distance(a, b);
  const damage = damageFor(a, b);
  const counter = b.hp > damage && d >= b.range[0] && d <= b.range[1] && a.range[1] === 1 && b.range[1] === 1;
  return { damage, accuracy: Math.max(20, Math.min(100, Math.round(90 + (a.agility - b.agility) * .4))), counter: counter ? damageFor(b, a) : 0 };
}
function random(s: BattleState) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }

function finishAction(s: BattleState, u: Unit) {
  u.acted = true; u.moved = true; s.pendingMove = null;
  if (u.team === 'player' && terrainAt(u) === 'village' && !s.villageVisited) {
    s.villageVisited = true; log(s, '조조가 민가의 안전을 확인했다. 보조 목표 달성.');
  }
  evaluateOutcome(s);
}

export function attackUnit(s: BattleState, attackerId: string, targetId: string): AttackResult | null {
  const a = findUnit(s, attackerId), b = findUnit(s, targetId);
  if (!a || !b || !canAttack(s, a, b)) return null;
  const hits: Hit[] = [];
  const p = previewAttack(a, b);
  const missed = random(s) * 100 >= p.accuracy;
  const damage = missed ? 0 : Math.min(b.hp, p.damage);
  b.hp -= damage;
  hits.push({ targetId: b.id, damage, missed, counter: false });
  if (a.team === 'player') s.attacksMade++;
  const message = missed ? `${a.name}의 공격! ${b.name}이 회피했다.` : `${a.name} → ${b.name}, ${damage} 피해${b.hp === 0 ? ' · 퇴각' : ''}`;
  log(s, message);
  const d = distance(a, b);
  if (b.hp > 0 && a.range[1] === 1 && b.range[1] === 1 && d >= b.range[0] && d <= b.range[1]) {
    const counterMiss = random(s) * 100 >= previewAttack(b, a).accuracy;
    const counterDamage = counterMiss ? 0 : Math.min(a.hp, damageFor(b, a));
    a.hp -= counterDamage;
    hits.push({ targetId: a.id, damage: counterDamage, missed: counterMiss, counter: true });
    log(s, counterMiss ? `${b.name}의 반격을 피했다.` : `${b.name}의 반격, ${a.name}에게 ${counterDamage} 피해`);
  }
  finishAction(s, a);
  return { hits, message };
}

export function waitUnit(s: BattleState, id: string): boolean {
  const u = findUnit(s, id); if (!u || !controlled(s, u)) return false;
  log(s, `${u.name}이 진형을 유지한다.`); finishAction(s, u); return true;
}
export function usePotion(s: BattleState): boolean {
  const u = findUnit(s, 'cao');
  if (!u || !controlled(s, u) || s.potions <= 0 || u.hp >= u.maxHp) return false;
  const before = u.hp; u.hp = Math.min(u.maxHp, u.hp + 55); s.potions--;
  log(s, `조조가 회복약을 사용했다. HP +${u.hp - before}`); finishAction(s, u); return true;
}
export function encourage(s: BattleState): boolean {
  const u = findUnit(s, 'cao');
  if (!u || !controlled(s, u) || u.mp < 6 || u.buff > 0) return false;
  u.mp -= 6; u.buff = 2;
  log(s, '조조의 격려! 2라운드 동안 공격력이 10% 상승한다.'); finishAction(s, u); return true;
}
export function evaluateOutcome(s: BattleState): Outcome {
  if (s.outcome !== 'playing') return s.outcome;
  if (!findUnit(s, 'cao') || findUnit(s, 'cao')!.hp <= 0) s.outcome = 'lost';
  else if (s.units.filter(u => u.boss).every(u => u.hp === 0)) s.outcome = 'won';
  if (s.outcome !== 'playing') { s.pendingMove = null; log(s, s.outcome === 'won' ? '장보와 장량이 퇴각했다. 영천 전투 승리!' : '조조가 퇴각했다. 영천 전투 패배.'); }
  return s.outcome;
}

function beginPhase(s: BattleState, phase: Phase) {
  s.phase = phase;
  for (const u of s.units.filter(u => u.team === phase && alive(u))) {
    u.acted = false; u.moved = false;
    if (terrainAt(u) === 'village') u.hp = Math.min(u.maxHp, u.hp + Math.ceil(u.maxHp * .1));
  }
  log(s, phase === 'player' ? `제${s.round}라운드 · 아군 차례` : phase === 'ally' ? '우군이 진격한다.' : '황건군이 움직인다.');
}
export function endPlayerPhase(s: BattleState): boolean {
  if (s.phase !== 'player' || s.outcome !== 'playing') return false;
  const u = findUnit(s, 'cao'); if (u && !u.acted) finishAction(s, u);
  s.pendingMove = null; beginPhase(s, 'ally'); return true;
}
export function advancePhase(s: BattleState): boolean {
  if (s.outcome !== 'playing' || s.phase === 'player') return false;
  if (s.units.some(u => u.team === s.phase && alive(u) && !u.acted)) return false;
  if (s.phase === 'ally') { beginPhase(s, 'enemy'); return true; }
  if (s.round >= TURN_LIMIT) { s.outcome = 'lost'; log(s, '제한 라운드가 끝났다. 황건 지휘관을 제압하지 못했다.'); return true; }
  s.round++;
  for (const u of s.units) u.buff = Math.max(0, u.buff - 1);
  beginPhase(s, 'player');
  if (s.round === 2 && !s.fireTriggered) {
    s.fireTriggered = true;
    for (const u of s.units.filter(u => u.team === 'enemy' && !u.boss && alive(u) && u.x < 15)) u.confused = 1;
    log(s, '우군의 화공! 황건 일반 부대가 이번 라운드 혼란에 빠졌다.');
  }
  return true;
}

/** One committed AI action. Acted flags make an interrupted phase resumable. */
export function aiStep(s: BattleState): { unitId: string; from: Point; result: AttackResult | null } | null {
  if (s.outcome !== 'playing' || s.phase === 'player') return null;
  const u = s.units.find(u => u.team === s.phase && alive(u) && !u.acted);
  if (!u) return null;
  const from = { x: u.x, y: u.y };
  if (u.confused > 0) { u.confused--; log(s, `${u.name}은 혼란으로 움직이지 못했다.`); finishAction(s, u); return { unitId: u.id, from, result: null }; }
  const enemies = s.units.filter(e => alive(e) && hostile(u, e));
  let targets = enemies.filter(e => canAttack(s, u, e));
  if (!targets.length) {
    const options = reachable(s, u);
    const score = (p: Point) => Math.min(...enemies.map(e => {
      const d = distance(p, e);
      return d < u.range[0] ? (u.range[0] - d) * 2 : Math.max(0, d - u.range[1]);
    }));
    options.sort((a, b) => score(a) - score(b) || a.cost - b.cost || a.y - b.y || a.x - b.x);
    const p = options[0];
    if (p && distance(p, u)) moveUnit(s, u.id, p);
    targets = enemies.filter(e => canAttack(s, u, e));
  }
  targets.sort((a, b) => (a.team === 'player' ? -1 : 0) - (b.team === 'player' ? -1 : 0) || a.hp - b.hp);
  const result = targets[0] ? attackUnit(s, u.id, targets[0].id) : null;
  if (!result) waitUnit(s, u.id);
  return { unitId: u.id, from, result };
}

export function parseSave(raw: string): BattleState | null {
  try {
    const s: BattleState = JSON.parse(raw);
    if (!s || s.version !== 1 || !['player', 'ally', 'enemy'].includes(s.phase) || !['playing', 'won', 'lost'].includes(s.outcome)) return null;
    if (!Number.isInteger(s.round) || s.round < 1 || s.round > TURN_LIMIT || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295) return null;
    if (!['protect', 'advance'].includes(s.choice) || !Number.isInteger(s.potions) || s.potions < 0 || s.potions > 3) return null;
    if (![s.startedAt, s.savedAt].every(n => Number.isFinite(n) && n >= 0) || !Number.isInteger(s.attacksMade) || s.attacksMade < 0) return null;
    if (typeof s.fireTriggered !== 'boolean' || typeof s.villageVisited !== 'boolean' || !Array.isArray(s.logs) || s.logs.length > 30 || s.logs.some(l => typeof l !== 'string' || l.length > 300)) return null;
    if (!Array.isArray(s.units) || s.units.length !== 12) return null;
    const blueprint = createBattle(s.choice);
    const ids = new Set<string>();
    const occupied = new Set<string>();
    for (const u of s.units) {
      const expected = blueprint.units.find(e => e.id === u.id);
      if (!expected || ids.has(u.id) || u.team !== expected.team || u.sprite !== expected.sprite || u.name !== expected.name || u.role !== expected.role || !inBounds(u)) return null;
      ids.add(u.id);
      for (const field of ['maxHp', 'maxMp', 'attack', 'defense', 'agility', 'movement', 'level', 'boss'] as const) if (u[field] !== expected[field]) return null;
      if (!Array.isArray(u.range) || u.range[0] !== expected.range[0] || u.range[1] !== expected.range[1]) return null;
      if (![u.hp, u.mp, u.buff, u.confused].every(Number.isInteger) || u.hp < 0 || u.hp > u.maxHp || u.mp < 0 || u.mp > u.maxMp || u.buff < 0 || u.buff > 2 || u.confused < 0 || u.confused > 1) return null;
      if (typeof u.moved !== 'boolean' || typeof u.acted !== 'boolean') return null;
      if (u.hp > 0) { if (!Number.isFinite(TERRAIN_INFO[terrainAt(u)].cost) || occupied.has(key(u))) return null; occupied.add(key(u)); }
    }
    if (s.pendingMove !== null) {
      const m = s.pendingMove;
      if (!m || m.unitId !== 'cao' || !inBounds(m.from) || !inBounds(m.to) || s.phase !== 'player' || s.outcome !== 'playing') return null;
      const cao = findUnit(s, 'cao')!;
      if (cao.acted || !cao.moved || key(cao) !== key(m.to) || unitAt(s, m.from) || !Number.isFinite(TERRAIN_INFO[terrainAt(m.from)].cost)) return null;
      const check = structuredClone(s); const actor = findUnit(check, 'cao')!;
      actor.x = m.from.x; actor.y = m.from.y; actor.moved = false; check.pendingMove = null;
      if (!reachable(check, actor).some(p => key(p) === key(m.to))) return null;
    }
    if (s.outcome === 'playing' && (findUnit(s, 'cao')!.hp === 0 || s.units.filter(u => u.boss).every(u => u.hp === 0))) return null;
    if (s.outcome === 'won' && (findUnit(s, 'cao')!.hp === 0 || s.units.some(u => u.boss && u.hp > 0))) return null;
    if (s.outcome === 'lost' && findUnit(s, 'cao')!.hp > 0 && s.round < TURN_LIMIT) return null;
    return s;
  } catch { return null; }
}
