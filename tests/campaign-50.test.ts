import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,CAMPAIGN_ARCS,FIRST_SCENARIO_ID,nextScenario,getScenario} from '../src/scenarios.ts';
import {playMission} from './helpers/play-mission.ts';
import {parseSave,createBattle,reachable} from '../src/core.ts';
import {endingSummary} from '../src/chronicle.ts';
test('fifty unique playable chapters follow the nine Romance campaign arcs',()=>{
 assert.equal(SCENARIOS.length,50);assert.equal(new Set(SCENARIOS.map(s=>s.id)).size,50);assert.equal(new Set(SCENARIOS.map(s=>s.title)).size,50);assert.equal(new Set(SCENARIOS.map(s=>s.background)).size,50);assert.equal(FIRST_SCENARIO_ID,'shangyong-01');
 assert.deepEqual(SCENARIOS.map(s=>s.chapter),Array.from({length:50},(_,i)=>i+1));let year=0;
 for(const s of SCENARIOS){assert.ok(s.year>=year);year=s.year;assert.ok(s.objective&&s.story.length>=4&&s.aftermath.length===2);if(s.chapter<50)assert.equal(nextScenario(s.id)?.chapter,s.chapter+1);else assert.equal(nextScenario(s.id),undefined);}
 for(const arc of CAMPAIGN_ARCS){const stages=SCENARIOS.filter(s=>s.arcId===arc.id);assert.equal(stages.length,arc.count);assert.equal(stages.at(-1)?.id,arc.id);assert.deepEqual(stages.map(s=>s.episode),Array.from({length:arc.count},(_,i)=>i+1));}
});
test('living actors and original outcomes remain at the correct campaign boundaries',()=>{
 const death=getScenario('qishan').chapter;
 for(const s of SCENARIOS){assert.ok(!s.units('protect').some(u=>u.name==='장합')||s.chapter<=death);if(s.arcId==='yangping')assert.equal(s.units('protect')[0].name,'사마사');}
 assert.match(getScenario('xicheng').aftermath[0].line,/공성계.*성공/);assert.match(getScenario('qishan').aftermath.map(l=>l.line).join(' '),/장합/);assert.match(getScenario('wuzhang').aftermath.map(l=>l.line).join(' '),/목상/);assert.match(getScenario('gaoping').aftermath.map(l=>l.line).join(' '),/처형/);
});
test('every deployment cell permits an initial legal move and a restored stage',()=>{
 for(const s of SCENARIOS){const b=createBattle('protect',81,s.id);assert.ok(parseSave(JSON.stringify(b)));assert.ok(reachable(b,b.units[0]).length>1);assert.ok(s.deployment.every(p=>!['water','wall'].includes(s.terrain[p.y][p.x])));}
});
test('legacy nine victories remain partial until all fifty chapters are completed',()=>{
 const legacy=CAMPAIGN_ARCS.map(a=>a.id);assert.equal(endingSummary(legacy,{}).title,'남겨진 원정 기록');assert.equal(endingSummary(SCENARIOS.map(s=>s.id),{}).title,'연대기 완주');
});
test('all fifty chapters chain from legal victories to the next story and survive restore',()=>{
 for(const s of SCENARIOS){const win=playMission(s.id);assert.equal(win.outcome,'won',s.id);assert.equal(parseSave(JSON.stringify(win))?.scenarioId,s.id);const next=nextScenario(s.id);if(next)assert.ok(next.story[0].line);}
});
test('escort and forward marching missions do not claim to be retreats',()=>{
 assert.equal(getScenario('shangfang-03').movementLabel,'호위');assert.equal(getScenario('gaoping-04').movementLabel,'호위');for(const id of ['shangyong-02','jieting-05','liaodong-03'] as const)assert.equal(getScenario(id).movementLabel,'행군');assert.equal(getScenario('xicheng-04').movementLabel,'회군');
});
test('all fifty final map files decode as distinct, correctly hashed WebP assets',async()=>{
 const {readFileSync}=await import('node:fs'),{createHash}=await import('node:crypto');const manifest=JSON.parse(readFileSync(new URL('../public/assets/battle-art.json',import.meta.url),'utf8'));assert.equal(manifest.maps.length,50);assert.equal(new Set(manifest.maps.map((m:any)=>m.sha256)).size,50);
 for(const s of SCENARIOS){const m=manifest.maps.find((m:any)=>m.id===s.id);assert.equal(m.file,s.background);const file=readFileSync(new URL(`../public/assets/${m.file}`,import.meta.url));assert.equal(file.subarray(8,12).toString(),'WEBP');assert.equal(createHash('sha256').update(file).digest('hex'),m.sha256);assert.equal(file.length,m.bytes);assert.ok(m.bytes<800000);}
});
