import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS,getScenario} from '../src/scenarios.ts';
import {createBattle,findUnit,reachable,terrainAt,TERRAIN_INFO,canAttack,clearShot,parseSave,damageFor,key} from '../src/core.ts';
import {SIEGE_DESIGNS} from '../src/siege-scenarios.ts';
import {playMission} from './helpers/play-mission.ts';
const sieges=SCENARIOS.filter(s=>s.siege);
test('exactly thirty percent of the fifty battles are fortified siege episodes',()=>{
 assert.equal(sieges.length,15);assert.equal(sieges.length/SCENARIOS.length,.3);assert.equal(new Set(SIEGE_DESIGNS.map(d=>d.id)).size,15);
 assert.equal(sieges.filter(s=>s.siege!.mode==='assault').length,4);assert.equal(sieges.filter(s=>s.siege!.mode==='defense').length,7);assert.equal(sieges.filter(s=>s.siege!.mode==='encirclement').length,4);
});
test('the empty-city retreat and original major outcomes do not become invented captures',()=>{
 assert.ok(!getScenario('xicheng').siege);assert.equal(getScenario('xicheng').goal,'escape');
 assert.equal(getScenario('wuzhang').goal,'hold');assert.equal(getScenario('liaodong-02').goal,'hold');
 assert.match(getScenario('shangyong').aftermath[0].line,/神|신탐/);assert.match(getScenario('liaodong').aftermath[0].line,/처형/);
 assert.match(getScenario('yangping-02').story[2].line,/항복은 아직/);assert.match(getScenario('yangping-04').story[2].line,/아직 단정/);
});
test('masonry stops passage while main gates and timber supply posterns remain traversable',()=>{
 for(const s of sieges){
  const wall=s.siege!.walls.find(p=>terrainAt(p,s.id)==='wall')!;assert.equal(TERRAIN_INFO[terrainAt(wall,s.id)].cost,Infinity);
  for(const g of s.siege!.gates){assert.equal(terrainAt(g,s.id),'gate');assert.ok([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d=>Number.isFinite(TERRAIN_INFO[terrainAt({x:g.x+d.x,y:g.y+d.y},s.id)].cost)).length>=2);}
  const b=createBattle('protect',190,s.id);const u=findUnit(b,'sima')!,g=s.siege!.gates[0];assert.ok(s.deployment.some(p=>key(p)===key(u)),s.id+' default deployment must be selectable');Object.assign(u,{x:g.x-1,y:g.y});b.units.filter(v=>v.id!=='sima'&&v.y===g.y&&Math.abs(v.x-g.x)<=1).forEach(v=>v.hp=0);
  assert.ok(reachable(b,u).some(p=>key(p)===key(g)),s.id);
 }
});
test('archers cannot shoot through stone or timber walls, but can shoot through open gates',()=>{
 for(const id of ['shangyong-04','shangyong-03'] as const){
  const b=createBattle('protect',1,id),a=findUnit(b,'sima')!,e=b.units.find(u=>u.team==='enemy')!,x=getScenario(id).siege!.gates[0].x;
  Object.assign(a,{x:x-1,y:4,range:[2,3],role:'궁병'});Object.assign(e,{x:x+1,y:4});assert.equal(canAttack(b,a,e),false);assert.equal(clearShot(a,e,id),false);assert.equal(clearShot(e,a,id),false);
  a.y=e.y=6;assert.equal(canAttack(b,a,e),true);assert.equal(clearShot(a,e,id),true);
 }
});
test('fortress walks and gate cover mitigate damage without exceeding one tile movement',()=>{
 const b=createBattle('protect',1,'shangyong-04'),a=b.units[0],e=b.units.find(u=>u.team==='enemy')!;
 Object.assign(e,{x:8,y:6});const plain=damageFor(a,e,b.scenarioId);e.x=9;const gate=damageFor(a,e,b.scenarioId);e.x=10;const walk=damageFor(a,e,b.scenarioId);
 assert.ok(gate<plain);assert.ok(walk<gate);assert.equal(TERRAIN_INFO.gate.cost,1);assert.equal(TERRAIN_INFO.rampart.cost,2);
});
test('thirty-one authentic previous-version saves migrate without losing HP, actors, events or turns',()=>{
 const data=JSON.parse(readFileSync(new URL('./fixtures/pre-siege-saves.json',import.meta.url),'utf8'));assert.equal(data.fixtures.length,31);let relocated=0;
 for(const f of data.fixtures){const loaded=parseSave(JSON.stringify(f.state));assert.ok(loaded,f.label);assert.equal(loaded.mapRevision,2);assert.equal(loaded.round,f.state.round);assert.equal(loaded.phase,f.state.phase);assert.deepEqual(loaded.events,f.state.events);assert.deepEqual(loaded.units.map(u=>[u.id,u.hp,u.mp,u.acted,u.moved]),f.state.units.map((u:any)=>[u.id,u.hp,u.mp,u.acted,u.moved]));assert.equal(loaded.pendingMove,null);
  if(loaded.units.some((u,i)=>key(u)!==key(f.state.units[i])))relocated++;assert.ok(parseSave(JSON.stringify(loaded)),f.label+' stable round-trip');
 }
 assert.ok(relocated>0,'actual occupants of new wall cells must be relocated');
});
test('map migration does not accept forged statistics, colliding occupants or future map revisions',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/pre-siege-saves.json',import.meta.url),'utf8')).fixtures[0].state;
 for(const mutate of [(s:any)=>s.units[0].attack=999,(s:any)=>s.units[0].x=-1,(s:any)=>Object.assign(s.units[1],{x:s.units[0].x,y:s.units[0].y}),(s:any)=>s.mapRevision=999]){const b=structuredClone(old);mutate(b);assert.equal(parseSave(JSON.stringify(b)),null);}
 const current=createBattle('protect',1,'shangyong-04');Object.assign(current.units[0],{x:9,y:4});assert.equal(parseSave(JSON.stringify(current)),null);
});
test('every siege can be completed legally with both strategies and resumed after every action',()=>{
 for(const s of sieges)for(const choice of ['protect','advance'] as const){const won=playMission(s.id,choice);assert.equal(won.outcome,'won',s.id+' '+choice);assert.ok(parseSave(JSON.stringify(won)));if(s.id==='wuzhang')assert.ok(findUnit(won,'zhuge')!.hp>0);}
});
