import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, findUnit, reachable, terrainAt, moveUnit, undoMove, canAttack, attackUnit, waitUnit, encourage, usePotion, endPlayerPhase, advancePhase, aiStep, evaluateOutcome, parseSave, distance, deployCommander, DEPLOYMENT_TILES, type BattleState } from '../src/core.ts';
import { Preparation } from '../src/preparation.ts';

const cao = (s: BattleState) => findUnit(s, 'cao')!;

test('deployment stays in the starting region and cannot move a commander after an action',()=>{
  for(const point of DEPLOYMENT_TILES){const s=createBattle();assert.equal(deployCommander(s,point),true);assert.deepEqual({x:cao(s).x,y:cao(s).y},point);assert.ok(parseSave(JSON.stringify(s)));}
  const s=createBattle(); const before=JSON.stringify(s);
  assert.equal(deployCommander(s,{x:13,y:2}),false); assert.equal(JSON.stringify(s),before);
  moveUnit(s,'cao',{x:7,y:9});assert.equal(deployCommander(s,{x:5,y:8}),false);
});
test('preparation purchases enforce both stock capacity and the available budget',()=>{
  const p=new Preparation('advance');assert.equal(p.buyPotion(),true);assert.equal(p.battle.potions,3);assert.equal(p.gold,100);
  assert.equal(p.buyPotion(),false);assert.equal(p.gold,100);
  for(let i=0;i<3;i++)assert.equal(p.sellPotion(),true);
  assert.equal(p.sellPotion(),false);assert.equal(p.gold,250);
  assert.equal(p.buyPotion(),true);assert.equal(p.buyPotion(),true);assert.equal(p.gold,50);
  assert.equal(p.buyPotion(),false);assert.equal(p.battle.potions,2);
});
test('a prepared start and supplies survive saving, movement and undo',()=>{
  const p=new Preparation('advance');p.buyPotion();p.deploy({x:5,y:8});
  const s=parseSave(JSON.stringify(p.battle));assert.ok(s);assert.equal(s.potions,3);assert.equal(cao(s).buff,1);
  assert.equal(moveUnit(s,'cao',{x:6,y:8}),true);assert.equal(undoMove(s),true);assert.equal(cao(s).x,5);assert.equal(cao(s).y,8);
});

test('weighted movement excludes deep water and occupied destinations, but permits the bridge', () => {
  const s = createBattle(); cao(s).x = 14; cao(s).y = 5;
  const choices = reachable(s, cao(s));
  assert.equal(terrainAt({ x: 15, y: 5 }), 'water');
  assert.ok(!choices.some(p => p.x === 15 && p.y === 5));
  assert.ok(choices.some(p => p.x === 15 && p.y === 6));
  assert.ok(!choices.some(p => p.x === 12 && p.y === 5));
  assert.ok(choices.every(p => p.cost <= cao(s).movement));
});

test('forest movement uses terrain cost instead of geometric distance', () => {
  const s = createBattle();
  const p = reachable(s, cao(s)).find(p => p.x === 3 && p.y === 9)!;
  assert.equal(p.cost, 4); assert.equal(p.path.length, 3);
});

test('moving is reversible before an action and cannot be performed twice', () => {
  const s = createBattle();
  assert.equal(moveUnit(s, 'cao', { x: 8, y: 9 }), true);
  assert.equal(moveUnit(s, 'cao', { x: 9, y: 9 }), false);
  assert.ok(s.pendingMove); assert.equal(undoMove(s), true);
  assert.deepEqual({ x: cao(s).x, y: cao(s).y }, { x: 6, y: 9 });
  assert.equal(cao(s).moved, false);
});

test('an action commits movement and prevents replaying the same action', () => {
  const s = createBattle(); moveUnit(s, 'cao', { x: 8, y: 9 });
  assert.equal(waitUnit(s, 'cao'), true); assert.equal(undoMove(s), false);
  assert.equal(waitUnit(s, 'cao'), false); assert.equal(s.pendingMove, null);
});

test('out-of-range, friendly and wrong-phase attacks do not change state', () => {
  const s = createBattle(); const before = JSON.stringify(s);
  assert.equal(attackUnit(s, 'cao', 'bao'), null);
  assert.equal(attackUnit(s, 'cao', 'liu'), null);
  assert.equal(attackUnit(s, 'e1', 'cao'), null);
  assert.equal(JSON.stringify(s), before);
});

test('an adjacent attack consumes the action and applies a surviving enemy counter', () => {
  const s = createBattle('protect', 1); const e = findUnit(s, 'e1')!; e.x = 7; e.y = 9;
  const result = attackUnit(s, 'cao', 'e1')!;
  assert.equal(result.hits.length, 2); assert.equal(result.hits[1].counter, true);
  assert.ok(e.hp < e.maxHp); assert.ok(cao(s).hp < cao(s).maxHp);
  assert.equal(cao(s).acted, true); assert.equal(s.attacksMade, 1);
  assert.equal(attackUnit(s, 'cao', 'e1'), null);
});

test('a successful killing attack has no counter, and save restoration preserves RNG', () => {
  const s = createBattle(); const e = findUnit(s, 'e1')!; e.x = 7; e.y = 9; e.hp = 1;
  const restored = parseSave(JSON.stringify(s)); assert.ok(restored);
  const a = attackUnit(s, 'cao', 'e1')!; const b = attackUnit(restored, 'cao', 'e1')!;
  assert.deepEqual(a, b); assert.equal(a.hits.length, 1);
  assert.equal(e.hp, 0); assert.equal(cao(s).hp, cao(s).maxHp);
  assert.equal(s.seed, restored.seed);
});

test('healing cannot waste a potion at full HP, and clamps restored health', () => {
  const s = createBattle(); assert.equal(usePotion(s), false); assert.equal(s.potions, 3);
  cao(s).hp -= 20; assert.equal(usePotion(s), true);
  assert.equal(cao(s).hp, cao(s).maxHp); assert.equal(s.potions, 2); assert.ok(cao(s).acted);
});

test('encouragement consumes MP and cannot be stacked or used again in one turn', () => {
  const s = createBattle(); assert.equal(encourage(s), true);
  assert.equal(cao(s).mp, 12); assert.equal(cao(s).buff, 2); assert.equal(encourage(s), false);
});

test('finishing an action at the village records the optional objective', () => {
  const s = createBattle(); cao(s).x = 3; cao(s).y = 3;
  waitUnit(s, 'cao'); assert.equal(s.villageVisited, true);
});

test('round-two fire runs once, confuses regular troops and spares commanders', () => {
  const s = createBattle(); endPlayerPhase(s);
  s.units.filter(u => u.team === 'ally').forEach(u => u.acted = true); advancePhase(s);
  s.units.filter(u => u.team === 'enemy').forEach(u => u.acted = true); advancePhase(s);
  assert.equal(s.round, 2); assert.equal(s.phase, 'player'); assert.equal(s.fireTriggered, true);
  assert.equal(findUnit(s, 'e1')!.confused, 1); assert.equal(findUnit(s, 'bao')!.confused, 0);
  assert.equal(s.logs.filter(l => l.startsWith('우군의 화공')).length, 1);
});

test('AI acted flags survive a save and resume without repeating the committed action', () => {
  const s = createBattle(); endPlayerPhase(s); const first = aiStep(s)!;
  const restored = parseSave(JSON.stringify(s)); assert.ok(restored);
  const next = aiStep(restored)!; assert.notEqual(next.unitId, first.unitId);
  assert.equal(findUnit(restored, first.unitId)!.acted, true);
});

test('both bosses must retreat, and player defeat takes precedence over victory', () => {
  const s = createBattle(); findUnit(s, 'bao')!.hp = 0;
  assert.equal(evaluateOutcome(s), 'playing'); findUnit(s, 'liang')!.hp = 0;
  assert.equal(evaluateOutcome(s), 'won'); assert.equal(evaluateOutcome(s), 'won');
  const loss = createBattle(); loss.units.filter(u => u.boss).forEach(u => u.hp = 0); cao(loss).hp = 0;
  assert.equal(evaluateOutcome(loss), 'lost');
});

test('a live commander still loses after the twelfth enemy phase', () => {
  const s = createBattle(); s.round = 12; s.phase = 'enemy';
  s.units.filter(u => u.team === 'enemy').forEach(u => u.acted = true);
  assert.equal(advancePhase(s), true); assert.equal(s.outcome, 'lost');
  assert.ok(parseSave(JSON.stringify(s)));
});

test('save validation rejects corrupt, impossible, incompatible and injected data', () => {
  assert.equal(parseSave('{'), null);
  for (const mutate of [
    (s: BattleState) => { s.round = 99; },
    (s: BattleState) => { cao(s).hp = -1; },
    (s: BattleState) => { cao(s).attack = 999; },
    (s: BattleState) => { cao(s).x = 15; cao(s).y = 5; },
    (s: BattleState) => { s.units[1].x = cao(s).x; s.units[1].y = cao(s).y; },
    (s: BattleState) => { s.units[0].name = '<script>'; },
    (s: BattleState) => { s.units[1].id = 'cao'; },
  ]) { const s = createBattle(); mutate(s); assert.equal(parseSave(JSON.stringify(s)), null); }
});

test('a pending movement can be saved, restored and undone to its original tile', () => {
  const s = createBattle(); moveUnit(s, 'cao', { x: 8, y: 9 });
  const loaded = parseSave(JSON.stringify(s)); assert.ok(loaded); assert.equal(undoMove(loaded), true);
  assert.equal(cao(loaded).x, 6); assert.equal(cao(loaded).y, 9);
});

test('a complete representative battle reaches victory through legal actions and survives round-trip saves', () => {
  let s = createBattle();
  while (s.outcome === 'playing') {
    const player = cao(s);
    if (player.hp < 65 && s.potions) usePotion(s);
    else {
      const enemies = s.units.filter(u => u.team === 'enemy' && u.hp > 0);
      if (!enemies.some(e => canAttack(s, player, e))) {
        const options = reachable(s, player).sort((a, b) => Math.min(...enemies.map(e => distance(a, e))) - Math.min(...enemies.map(e => distance(b, e))) || a.cost - b.cost);
        if (options[0] && distance(player, options[0])) moveUnit(s, 'cao', options[0]);
      }
      const target = enemies.filter(e => canAttack(s, player, e)).sort((a, b) => a.hp - b.hp)[0];
      if (target) attackUnit(s, 'cao', target.id); else waitUnit(s, 'cao');
    }
    if (s.outcome !== 'playing') break;
    endPlayerPhase(s);
    let actions = 0;
    while (s.phase !== 'player' && s.outcome === 'playing') {
      if (!aiStep(s)) advancePhase(s);
      assert.ok(++actions < 30, 'AI phases must terminate');
      const restored = parseSave(JSON.stringify(s)); assert.ok(restored, 'every committed AI action must be restorable'); s = restored;
    }
  }
  assert.equal(s.outcome, 'won'); assert.ok(s.attacksMade > 0); assert.ok(s.round <= 12);
  assert.ok(parseSave(JSON.stringify(s)));
});
