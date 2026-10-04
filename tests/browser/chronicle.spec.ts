import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const artifacts=resolve(process.env.QA_ARTIFACT_DIR??'qa-artifacts/chronicle');mkdirSync(artifacts,{recursive:true});
import {SCENARIOS,getScenario,type ScenarioId} from '../../src/scenarios.ts';
import {INTRO,ENDING,endingSummary} from '../../src/chronicle.ts';
import {createBattle,type BattleState,type Point} from '../../src/core.ts';
import {chooseAction} from '../helpers/play-mission.ts';

const state=(page:Page):Promise<BattleState>=>page.evaluate(()=>(window as any).__WEI_DEBUG__.state());
async function select(page:Page,id:ScenarioId){await page.locator('[data-action="scenarios"]').click();await page.locator(`[data-scenario-id="${id}"]`).click();}
async function prepare(page:Page,id:ScenarioId){await select(page,id);await page.locator('[data-action="story-skip"]').click();await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();}
async function resume(page:Page){await page.reload();await page.locator('[data-action="journey-continue"]').click();}
async function depart(page:Page){await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());}
async function tile(page:Page,p:Point){
 // Pan through the actual map pointer input when a target is near the toolbar.
 let at=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),p);
 const box=(await page.locator('#battlefield canvas').boundingBox())!;
 if(at.x<box.x+40||at.x>box.x+box.width-40||at.y<box.y+90||at.y>box.y+box.height-70){
  const x=box.x+box.width*.5,y=box.y+box.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+Math.max(-box.width*.4,Math.min(box.width*.4,x-at.x)),y+Math.max(-box.height*.35,Math.min(box.height*.35,y-at.y)),{steps:8});await page.mouse.up();
  at=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),p);
 }
 await page.mouse.click(at.x,at.y);
}

test('intro and story cursors resume without replacing the saved battle',async({page})=>{
 const old=createBattle('advance',42,'liaodong');await page.goto('/');await page.evaluate(s=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s)),old);await page.reload();
 await page.locator('[data-action="campaign-start"]').click();await expect(page.locator('.chronicle-paper')).toContainText(INTRO[0].line);
 await page.locator('[data-action="chronicle-next"]').click();await resume(page);await expect(page.locator('.chronicle-paper')).toContainText(INTRO[1].line);
 await page.locator('[data-action="chronicle-prev"]').click();await expect(page.locator('.chronicle-paper')).toContainText('220년');
 await page.locator('[data-action="chronicle-skip"]').click();for(let n=0;n<2;n++)await page.getByRole('button',{name:'계속',exact:true}).click();await resume(page);await expect(page.locator('.dialogue-text')).toContainText(SCENARIOS[0].story[2].line);
 await page.locator('[data-action="story-skip"]').click();await page.locator('[data-action="choice-advance"]').click();await resume(page);await expect(page.locator('[data-action="choice-advance"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.battle.v2')!).scenarioId)).toBe('liaodong');
});

test('preparation keeps purchased equipment, supply and placement across reload',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('simayi-chronicle.campaign.v2',JSON.stringify(['shangyong','jieting'])));await page.goto('/');await prepare(page,'gaoping');
 await page.locator('.prep-actions [data-action="prep-shop"]').click();await page.locator('[data-action="prep-bulwark"]').click();await page.locator('[data-action="prep-sell"]').click();await page.locator('.modal-footer [data-action="close-modal"]').click();
 await page.locator('.prep-actions [data-action="prep-deployment"]').click();const point=getScenario('gaoping').deployment[1];await page.locator(`[data-action="prep-position"][data-x="${point.x}"][data-y="${point.y}"]`).click();await page.locator('[data-action="prep-deploy-confirm"]').click();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.journey.v1')!));await resume(page);const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.journey.v1')!));expect(after.preparation).toEqual(before.preparation);
 await depart(page);const s=await state(page);expect(s.loadout).toBe('bulwark');expect(s.potions).toBe(2);expect(s.units[0].x).toBe(point.x);expect(s.units[0].y).toBe(point.y);
 expect(await page.evaluate(()=>localStorage.getItem('simayi-chronicle.journey.v1'))).toBeNull();
});

for(const variant of ['partial','complete','mastered'])test(`canonical ending and ${variant} achievement recap resume`,async({page})=>{
 const ids=variant==='partial'?['yangping']:SCENARIOS.map(s=>s.id),records=Object.fromEntries(ids.map(id=>[id,{stars:variant==='mastered'?3:1,turns:1,bonus:variant==='mastered'}]));
 await page.addInitScript(({ids,records})=>{localStorage.setItem('simayi-chronicle.campaign.v2',JSON.stringify(ids));localStorage.setItem('simayi-chronicle.records.v1',JSON.stringify(records));},{ids,records});await page.goto('/');await page.locator('[data-action="ending"]').click();
 for(let n=0;n<ENDING.length;n++){
  await expect(page.locator('.chronicle-paper')).toContainText(ENDING[n].line);
  if(n===2){await resume(page);await expect(page.locator('.chronicle-paper')).toContainText(ENDING[n].line);}
  if(n<ENDING.length-1)await page.locator('[data-action="chronicle-next"]').click();
 }
 await expect(page.locator('.chronicle-completion')).toContainText(endingSummary(ids,records).title);await page.locator('[data-action="chronicle-next"]').click();await expect(page.locator('.title-screen')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('simayi-chronicle.journey.v1'))).toBeNull();
});

test('damaged journey and record data are ignored without erasing a valid battle',async({page})=>{
 await page.addInitScript(s=>{localStorage.setItem('simayi-chronicle.journey.v1','{"stage":"story","scenarioId":"gaoping","index":99,"choice":null}');localStorage.setItem('simayi-chronicle.records.v1','{"gaoping":{"stars":99}}');localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s));},createBattle('protect',19,'jieting'));await page.goto('/');await expect(page.locator('[data-action="journey-continue"]')).toHaveCount(0);await page.locator('[data-action="continue"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());expect((await state(page)).scenarioId).toBe('jieting');
 await page.locator('[data-action="objective"]').click();await page.locator('[data-action="goal-focus"]').first().click();await expect(page.locator('.modal')).toHaveCount(0);const p=getScenario('jieting').checkpoints![0],at=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),p),box=(await page.locator('#battlefield canvas').boundingBox())!;expect(at.x).toBeGreaterThan(box.x);expect(at.x).toBeLessThan(box.x+box.width);
});

for(const id of ['jieting','xicheng','qishan','shangfang','gaoping','yangping'] as ScenarioId[])test(`${id}: legal UI actions complete the mission and advance its story`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:390,height:844});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('wei-tactics.preferences',JSON.stringify({sound:false,fast:true,grid:true})));await page.goto('/');await prepare(page,id);
 if(id==='yangping'){expect(await page.locator('.roster-face .portrait-atlas').evaluateAll(nodes=>new Set(nodes.map(n=>n.getAttribute('class'))).size)).toBe(4);}
 await depart(page);
 await expect(page.locator('#command-actor')).toContainText(getScenario(id).commanderName??'사마의');await page.locator('[data-action="pause"]').first().click();await page.locator(`.modal [data-action="tactic-${getScenario(id).goal==='escape'?'guard':'advance'}"]`).click();await page.locator('.modal-footer [data-action="close-modal"]').click();
 let s=await state(page),restored=false;
 for(let n=0;n<getScenario(id).turnLimit&&s.outcome==='playing';n++){
  const action=chooseAction(s);
  if(action.heal){await page.locator('[data-action="potion"]').click();await page.locator('[data-action="potion-target"][data-target-id="sima"]').click();await page.locator('[data-action="confirm"]').click();}
  else {
   if(action.move){await page.locator('[data-action="move"]').click();await tile(page,action.move);await expect(page.locator('[data-action="confirm"]')).toBeVisible();await page.locator('[data-action="confirm"]').click();}
   if(action.attack){await page.locator('[data-action="attack"]').click();await tile(page,s.units.find(u=>u.id===action.attack)!);await page.locator('[data-action="confirm"]').click();}else await page.locator('[data-action="wait"]').click();
  }
  s=await state(page);if(s.outcome!=='playing')break;
  await page.locator('[data-action="end-turn"]').click();await page.waitForFunction(()=>{const s=(window as any).__WEI_DEBUG__.state();return s.phase==='player'||s.outcome!=='playing';});s=await state(page);
  if(s.round===3&&!restored&&s.outcome==='playing'){const before=s;await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());s=await state(page);expect(s.events).toEqual(before.events);expect(s.objectives).toEqual(before.objectives);expect(s.units.map(u=>[u.id,u.hp,u.x,u.y])).toEqual(before.units.map(u=>[u.id,u.hp,u.x,u.y]));restored=true;}
 }
 expect(s.outcome,s.logs.join('\n')).toBe('won');await expect(page.locator('.result-narrative')).toContainText(getScenario(id).aftermath[1].line);await page.screenshot({path:`${artifacts}/legal-${id}.png`});expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.campaign.v2')!))).toContain(id);
 await page.reload();await page.locator('[data-action="continue"]').click();await expect(page.locator('.result-narrative')).toBeVisible();
 if(id==='yangping'){await page.locator('.modal-footer [data-action="ending"]').click();await expect(page.locator('.chronicle-paper')).toContainText(ENDING[0].line);}else{await page.locator('.modal-footer [data-action="next-battle"]').click();await expect(page.locator('.story-screen')).toBeVisible();}
 expect(errors).toEqual([]);
});
