import { getScenario, isScenarioId, type ScenarioId } from './scenarios.ts';
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
  version: 2; scenarioId: ScenarioId; events: string[]; units: Unit[]; round: number; phase: Phase; outcome: Outcome;
  seed: number; potions: number; choice: 'protect' | 'advance';
  pendingMove: { unitId: string; from: Point; to: Point } | null;
  surpriseTriggered: boolean; villageVisited: boolean; attacksMade: number;
  logs: string[]; startedAt: number; savedAt: number;
}
export interface Reachable extends Point { cost: number; path: Point[] }
export interface Hit { targetId: string; damage: number; missed: boolean; counter: boolean }
export interface AttackResult { hits: Hit[]; message: string }

export const TERRAIN_INFO: Record<Terrain, { name: string; cost: number; defense: number; description: string }> = {
  grass: { name: '평지', cost: 1, defense: 0, description: '탁 트인 들판. 빠르게 전열을 정비할 수 있다.' },
  road: { name: '돌길', cost: 1, defense: 0, description: '전장을 잇는 길. 이동 비용이 낮다.' },
  forest: { name: '숲', cost: 2, defense: .15, description: '진격은 느리지만 나무가 적의 공격을 막아준다.' },
  water: { name: '깊은 물', cost: Infinity, defense: 0, description: '건널 수 없다. 나무다리를 이용해야 한다.' },
  bridge: { name: '나무다리', cost: 1, defense: 0, description: '강을 건너는 유일한 길. 좁은 길목을 주의하라.' },
  village: { name: '마을', cost: 1, defense: .1, description: '아군 차례 시작에 최대 체력의 10%를 회복한다.' },
  camp: { name: '진영', cost: 1, defense: .1, description: '적 지휘관이 지키는 진영. 방어에 유리하다.' },
  wall: { name: '건물', cost: Infinity, defense: 0, description: '통행할 수 없다. 마당과 길로 우회하라.' },
};

export const inBounds = (p: Point, scenarioId: ScenarioId = 'shangyong') => Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < getScenario(scenarioId).cols && p.y < getScenario(scenarioId).rows;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const key = (p: Point) => `${p.x},${p.y}`;
export const DEPLOYMENT_TILES = getScenario().deployment;
export function terrainAt(p: Point, scenarioId: ScenarioId = 'shangyong'): Terrain {
  return inBounds(p,scenarioId) ? getScenario(scenarioId).terrain[p.y][p.x] : 'wall';
}

export function createBattle(choice: 'protect' | 'advance' = 'protect', seed = 228, scenarioId: ScenarioId = 'shangyong'): BattleState {
  const scenario=getScenario(scenarioId);
  return {
    version:2,scenarioId,events:[],round:1,phase:'player',outcome:'playing',seed,choice,
    potions:choice==='protect'?3:2,pendingMove:null,surpriseTriggered:false,
    villageVisited:false,attacksMade:0,startedAt:Date.now(),savedAt:Date.now(),
    logs:[`${scenario.title} 시작. ${scenario.objective}.`,choice==='protect'?`${scenario.protectNote}을 준비했다. 회복약 3개를 보유한다.`:'선봉을 정비했다. 첫 라운드 공격력이 강화된다.'],
    units:scenario.units(choice),
  };
}

export const findUnit = (s: BattleState, id: string) => s.units.find(u => u.id === id);
export const unitAt = (s: BattleState, p: Point) => s.units.find(u => u.hp > 0 && u.x === p.x && u.y === p.y);
export const hostile = (a: Unit, b: Unit) => (a.team === 'enemy') !== (b.team === 'enemy');
export const alive = (u: Unit) => u.hp > 0;
const controlled = (s: BattleState, u: Unit) => s.outcome === 'playing' && s.phase === u.team && u.hp > 0 && !u.acted;
export const log = (s: BattleState, message: string) => { s.logs.push(message); s.logs = s.logs.slice(-30); };

/** Preparation may move the commander only before the first committed action. */
export function deployCommander(s: BattleState, to: Point): boolean {
  const sima = findUnit(s, 'sima');
  if (!sima || s.round !== 1 || s.phase !== 'player' || s.outcome !== 'playing' || s.attacksMade !== 0 || s.surpriseTriggered || s.pendingMove) return false;
  const blueprint = createBattle(s.choice,184,s.scenarioId);
  if (s.events.length || s.units.some(u => u.moved || u.acted || u.hp !== findUnit(blueprint,u.id)?.hp || u.mp !== findUnit(blueprint,u.id)?.mp)) return false;
  if (!getScenario(s.scenarioId).deployment.some(p => key(p) === key(to)) || (unitAt(s, to)?.id && unitAt(s, to)?.id !== 'sima')) return false;
  sima.x = to.x; sima.y = to.y;
  return true;
}

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
      if (!inBounds(p,s.scenarioId)) continue;
      const occupant = unitAt(s, p);
      if (occupant && occupant.id !== u.id && hostile(u, occupant)) continue;
      let cost = TERRAIN_INFO[terrainAt(p,s.scenarioId)].cost;
      if (u.role === '기병' && terrainAt(p,s.scenarioId) === 'forest') cost = 3;
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
export function damageFor(a: Unit, b: Unit, scenarioId: ScenarioId = 'shangyong'): number {
  const power = a.attack * (a.buff > 0 ? 1.1 : 1);
  let advantage = 1;
  if ((a.role === '궁병' && b.role === '기병') || (a.role === '기병' && b.role === '보병') || (a.role === '보병' && b.role === '궁병')) advantage = 1.2;
  return Math.max(1, Math.round(Math.max(1, power - b.defense * .55) * advantage * (1 - TERRAIN_INFO[terrainAt(b,scenarioId)].defense)));
}
export function previewAttack(a: Unit, b: Unit, scenarioId: ScenarioId = 'shangyong') {
  const d = distance(a, b);
  const damage = damageFor(a, b,scenarioId);
  const counter = b.hp > damage && d >= b.range[0] && d <= b.range[1] && a.range[1] === 1 && b.range[1] === 1;
  return { damage, accuracy: Math.max(20, Math.min(100, Math.round(90 + (a.agility - b.agility) * .4))), counter: counter ? damageFor(b, a,scenarioId) : 0 };
}
function random(s: BattleState) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }

function finishAction(s: BattleState, u: Unit) {
  u.acted = true; u.moved = true; s.pendingMove = null;
  if (u.team === 'player' && s.scenarioId === 'shangyong' && terrainAt(u,s.scenarioId) === 'village' && !s.villageVisited) {
    s.villageVisited = true; log(s, '사마의가 민가의 안전을 확인했다. 보조 목표 달성.');
  }
  evaluateOutcome(s);
}

export function attackUnit(s: BattleState, attackerId: string, targetId: string): AttackResult | null {
  const a = findUnit(s, attackerId), b = findUnit(s, targetId);
  if (!a || !b || !canAttack(s, a, b)) return null;
  const hits: Hit[] = [];
  const p = previewAttack(a, b,s.scenarioId);
  const missed = random(s) * 100 >= p.accuracy;
  const damage = missed ? 0 : Math.min(b.hp, p.damage);
  b.hp -= damage;
  hits.push({ targetId: b.id, damage, missed, counter: false });
  if (a.team === 'player') s.attacksMade++;
  const message = missed ? `${a.name}의 공격! ${b.name}이 회피했다.` : `${a.name} → ${b.name}, ${damage} 피해${b.hp === 0 ? ' · 퇴각' : ''}`;
  log(s, message);
  const d = distance(a, b);
  if (b.hp > 0 && a.range[1] === 1 && b.range[1] === 1 && d >= b.range[0] && d <= b.range[1]) {
    const counterMiss = random(s) * 100 >= previewAttack(b, a,s.scenarioId).accuracy;
    const counterDamage = counterMiss ? 0 : Math.min(a.hp, damageFor(b, a,s.scenarioId));
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
export function potionTargets(s:BattleState):Unit[] {
  const sima=findUnit(s,'sima');
  return sima?s.units.filter(u=>alive(u)&&u.team!=='enemy'&&u.hp<u.maxHp&&(u.id==='sima'||distance(sima,u)===1)):[];
}
export function usePotion(s: BattleState, targetId='sima'): boolean {
  const u = findUnit(s, 'sima'), target=potionTargets(s).find(t=>t.id===targetId);
  if (!u || !controlled(s, u) || s.potions <= 0 || !target) return false;
  const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+55);s.potions--;
  log(s, `사마의가 회복약을 사용했다. ${target.name} HP +${target.hp-before}`);finishAction(s,u);return true;
}
export function encourage(s: BattleState): boolean {
  const u = findUnit(s, 'sima');
  if (!u || !controlled(s, u) || u.mp < 6 || u.buff > 0) return false;
  u.mp -= 6; u.buff = 2;
  log(s, '사마의의 격려! 2라운드 동안 공격력이 10% 상승한다.'); finishAction(s, u); return true;
}
export function evaluateOutcome(s: BattleState): Outcome {
  if (s.outcome !== 'playing') return s.outcome;
  if (!findUnit(s, 'sima') || findUnit(s, 'sima')!.hp <= 0) s.outcome = 'lost';
  else if (getScenario(s.scenarioId).goal==='hold') {
    if(s.round>=getScenario(s.scenarioId).holdUntil! && s.phase==='player')s.outcome='won';
  } else if (s.units.filter(u => u.boss).every(u => u.hp === 0)) s.outcome = 'won';
  if (s.outcome !== 'playing') { s.pendingMove = null; log(s, `${getScenario(s.scenarioId).title} ${s.outcome==='won'?'승리!':'패배.'}`); }
  return s.outcome;
}

function beginPhase(s: BattleState, phase: Phase) {
  s.phase = phase;
  for (const u of s.units.filter(u => u.team === phase && alive(u))) {
    u.acted = false; u.moved = false;
    if (terrainAt(u,s.scenarioId) === 'village') u.hp = Math.min(u.maxHp, u.hp + Math.ceil(u.maxHp * .1));
  }
  log(s, phase === 'player' ? `제${s.round}라운드 · 아군 차례` : phase === 'ally' ? '우군이 진격한다.' : `${getScenario(s.scenarioId).enemyName}이 움직인다.`);
}
export function endPlayerPhase(s: BattleState): boolean {
  if (s.phase !== 'player' || s.outcome !== 'playing') return false;
  const u = findUnit(s, 'sima'); if (u && !u.acted) finishAction(s, u);
  s.pendingMove = null; beginPhase(s, 'ally'); return true;
}
export function advancePhase(s: BattleState): boolean {
  if (s.outcome !== 'playing' || s.phase === 'player') return false;
  if (s.units.some(u => u.team === s.phase && alive(u) && !u.acted)) return false;
  if (s.phase === 'ally') { beginPhase(s, 'enemy'); return true; }
  if (s.round >= getScenario(s.scenarioId).turnLimit) { s.outcome = 'lost'; log(s, '제한 라운드가 끝났다. 적 지휘관을 제압하지 못했다.'); return true; }
  s.round++;
  for (const u of s.units) u.buff = Math.max(0, u.buff - 1);
  beginPhase(s, 'player');
  applyScenarioEvents(s);
  evaluateOutcome(s);
  return true;
}

export function bonusComplete(s:BattleState):boolean {
  if(s.scenarioId==='wuzhang')return !!findUnit(s,'niu')?.hp;
  if(s.scenarioId==='liaodong')return s.units.filter(u=>['shi','niu','hu'].includes(u.id)&&alive(u)).length>=2;
  return s.villageVisited;
}
export function applyScenarioEvents(s:BattleState):void {
  if(s.outcome!=='playing'||s.phase!=='player')return;
  if(s.scenarioId==='shangyong'&&s.round>=2&&!s.events.includes('mengda-isolated')) {
    s.surpriseTriggered=true;s.events.push('mengda-isolated');
    for(const u of s.units.filter(u=>u.team==='enemy'&&!u.boss&&alive(u)&&u.x<15))u.confused=1;
    log(s,'신의·신탐의 내응 준비가 끝났다! 맹달군 일반 부대가 이번 라운드 혼란에 빠졌다.');
  }
  if(s.round<3)return;
  if(s.scenarioId==='wuzhang'&&!s.events.includes('guo-arrived')) {
    const position=[{x:2,y:6},{x:2,y:7},{x:2,y:8},{x:3,y:7},{x:3,y:8},{x:1,y:7}].find(p=>!unitAt(s,p));
    const guan=findUnit(s,'guo');
    if(position&&guan){Object.assign(guan,position,{hp:guan.maxHp,moved:false,acted:false});s.events.push('guo-arrived');log(s,'곽회의 지원군이 서쪽 숲길에 도착했다! 우군 차례에 합류한다.');}
  }
  if(s.scenarioId==='liaodong'&&!s.events.includes('xiangping-counterattack')) {
    s.events.push('xiangping-counterattack');log(s,'양평의 비가 그쳤다. 공손연군이 성문을 나선다! 적의 반격이 시작된다.');
  }
}

/** One committed AI action. Acted flags make an interrupted phase resumable. */
export function aiStep(s: BattleState): { unitId: string; from: Point; result: AttackResult | null } | null {
  if (s.outcome !== 'playing' || s.phase === 'player') return null;
  const u = s.units.find(u => u.team === s.phase && alive(u) && !u.acted);
  if (!u) return null;
  const from = { x: u.x, y: u.y };
  if (u.confused > 0) { u.confused--; log(s, `${u.name}은 혼란으로 움직이지 못했다.`); finishAction(s, u); return { unitId: u.id, from, result: null }; }
  const enemies = s.units.filter(e => alive(e) && hostile(u, e));
  if (u.id === 'gongsun' && s.round < 3 || u.id === 'zhuge' || u.id === 'niu' && s.scenarioId==='wuzhang' && u.hp < u.maxHp * .7) {
    const target=enemies.find(e=>canAttack(s,u,e));
    const result=target?attackUnit(s,u.id,target.id):null;
    if(!result)waitUnit(s,u.id);
    return {unitId:u.id,from,result};
  }
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
    if (!s || s.version !== 2 || !['player', 'ally', 'enemy'].includes(s.phase) || !['playing', 'won', 'lost'].includes(s.outcome)) return null;
    if (!isScenarioId(s.scenarioId)) return null;
    const scenario=getScenario(s.scenarioId);
    if (!Array.isArray(s.events) || s.events.some(e=>!scenario.eventIds.includes(e)) || new Set(s.events).size!==s.events.length) return null;
    if (s.scenarioId!=='shangyong' && (s.surpriseTriggered || s.villageVisited)) return null;
    if (s.events.length && s.round < scenario.eventRound) return null;
    if(s.scenarioId==='shangyong' && (s.surpriseTriggered!==s.events.includes('mengda-isolated') || s.surpriseTriggered!==(s.round>=2)))return null;
    if (s.scenarioId==='liaodong' && (s.round>=3)!==s.events.includes('xiangping-counterattack')) return null;
    if (!Number.isInteger(s.round) || s.round < 1 || s.round > scenario.turnLimit || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295) return null;
    if (!['protect', 'advance'].includes(s.choice) || !Number.isInteger(s.potions) || s.potions < 0 || s.potions > 3) return null;
    if (![s.startedAt, s.savedAt].every(n => Number.isFinite(n) && n >= 0) || !Number.isInteger(s.attacksMade) || s.attacksMade < 0) return null;
    if (typeof s.surpriseTriggered !== 'boolean' || typeof s.villageVisited !== 'boolean' || !Array.isArray(s.logs) || s.logs.length > 30 || s.logs.some(l => typeof l !== 'string' || l.length > 300)) return null;
    const blueprint = createBattle(s.choice,184,s.scenarioId);
    if (!Array.isArray(s.units) || s.units.length !== blueprint.units.length) return null;
    if (s.scenarioId==='wuzhang' && !s.events.includes('guo-arrived') && findUnit(s,'guo')?.hp!==0) return null;
    const ids = new Set<string>();
    const occupied = new Set<string>();
    for (const u of s.units) {
      const expected = blueprint.units.find(e => e.id === u.id);
      if (!expected || ids.has(u.id) || u.team !== expected.team || u.sprite !== expected.sprite || u.name !== expected.name || u.role !== expected.role || !inBounds(u,s.scenarioId)) return null;
      ids.add(u.id);
      for (const field of ['maxHp', 'maxMp', 'attack', 'defense', 'agility', 'movement', 'level', 'boss'] as const) if (u[field] !== expected[field]) return null;
      if (!Array.isArray(u.range) || u.range[0] !== expected.range[0] || u.range[1] !== expected.range[1]) return null;
      if (![u.hp, u.mp, u.buff, u.confused].every(Number.isInteger) || u.hp < 0 || u.hp > u.maxHp || u.mp < 0 || u.mp > u.maxMp || u.buff < 0 || u.buff > 2 || u.confused < 0 || u.confused > 1) return null;
      if (typeof u.moved !== 'boolean' || typeof u.acted !== 'boolean') return null;
      if (u.hp > 0) { if (!Number.isFinite(TERRAIN_INFO[terrainAt(u,s.scenarioId)].cost) || occupied.has(key(u))) return null; occupied.add(key(u)); }
    }
    if (s.pendingMove !== null) {
      const m = s.pendingMove;
      if (!m || m.unitId !== 'sima' || !inBounds(m.from,s.scenarioId) || !inBounds(m.to,s.scenarioId) || s.phase !== 'player' || s.outcome !== 'playing') return null;
      const sima = findUnit(s, 'sima')!;
      if (sima.acted || !sima.moved || key(sima) !== key(m.to) || unitAt(s, m.from) || !Number.isFinite(TERRAIN_INFO[terrainAt(m.from,s.scenarioId)].cost)) return null;
      const check = structuredClone(s); const actor = findUnit(check, 'sima')!;
      actor.x = m.from.x; actor.y = m.from.y; actor.moved = false; check.pendingMove = null;
      if (!reachable(check, actor).some(p => key(p) === key(m.to))) return null;
    }
    const commanderAlive=findUnit(s,'sima')!.hp>0;
    const goalReached=scenario.goal==='hold'?s.round>=scenario.holdUntil!&&s.phase==='player':s.units.filter(u=>u.boss).every(u=>u.hp===0);
    if(s.outcome==='playing'&&(!commanderAlive||goalReached))return null;
    if(s.outcome==='won'&&(!commanderAlive||!goalReached))return null;
    if(s.outcome==='lost'&&commanderAlive&&(scenario.goal==='hold'||s.round<scenario.turnLimit))return null;
    return s;
  } catch { return null; }
}
