import {test,expect} from '@playwright/test';
import {SCENARIOS,CAMPAIGN_ARCS,FIRST_SCENARIO_ID,nextScenario,getScenario} from '../../src/scenarios.ts';
import {playMission} from '../helpers/play-mission.ts';
import {mkdirSync} from 'node:fs';
const artifacts=process.env.QA_ARTIFACT_DIR??'qa-artifacts/campaign-50';mkdirSync(artifacts,{recursive:true});
// Twenty-three different story/UI reviews, including both sides of every major campaign transition.
const ids=Array.from(new Set([FIRST_SCENARIO_ID,...CAMPAIGN_ARCS.flatMap(a=>SCENARIOS.filter(s=>s.arcId===a.id).filter((_,i,all)=>i===0||i===all.length-1).map(s=>s.id)),'shangfang-03','gaoping-04','qishan-04','shangfang-02','yangping-03']));
for(const [i,id] of ids.entries())test(`story/UI review ${String(i+1).padStart(2,'0')}: ${id}`,async({page})=>{
 await page.setViewportSize(i%2?{width:390,height:844}:{width:320,height:568});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const scenario=getScenario(id);
 await page.addInitScript(()=>localStorage.setItem('wei-tactics.preferences',JSON.stringify({sound:false,fast:true,grid:true})));await page.goto('/');await page.locator('[data-action="scenarios"]').click();await page.locator('#campaign-arc').selectOption(scenario.arcId!);await expect(page.locator('.scenario-card:visible')).toHaveCount(CAMPAIGN_ARCS.find(a=>a.id===scenario.arcId)!.count);await page.locator(`[data-scenario-id="${id}"]`).click();
 for(const [n,line] of scenario.story.entries()){
  await expect(page.locator('.dialogue-text')).toContainText(line.line);
  if(n===1){await page.reload();await page.locator('[data-action="journey-continue"]').click();await expect(page.locator('.dialogue-text')).toContainText(line.line);}
  if(n<scenario.story.length-1)await page.getByRole('button',{name:'계속',exact:true}).click();
 }
 await page.locator('[data-action="story-skip"]').click();await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();await expect(page.locator('.prep-level')).toContainText(`전투 ${scenario.chapter} / 50`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`${artifacts}/story-${String(i+1).padStart(2,'0')}-${id}.png`});
 const won=playMission(id);expect(won.outcome).toBe('won');await page.evaluate(s=>{localStorage.removeItem('simayi-chronicle.journey.v1');localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s));},won);await page.reload();await page.locator('[data-action="continue"]').click();await expect(page.locator('.result-narrative')).toContainText(scenario.aftermath[1].line);
 const next=nextScenario(id);if(next){await page.locator('.modal-footer [data-action="next-battle"]').click();await expect(page.locator('.dialogue-text')).toContainText(next.story[0].line);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.journey.v1')!).scenarioId)).toBe(next.id);}else{await page.locator('.modal-footer [data-action="ending"]').click();await expect(page.locator('.chronicle-paper')).toContainText('251년');}
 expect(errors).toEqual([]);
});
test('fifty-stage campaign search, empty state and keyboard focus stay usable',async({page})=>{
 await page.goto('/');await page.locator('[data-action="scenarios"]').click();await expect(page.locator('.scenario-card')).toHaveCount(50);await page.locator('#campaign-arc').selectOption('liaodong');await expect(page.locator('.scenario-card:visible')).toHaveCount(7);await page.locator('#campaign-search').fill('운제');await expect(page.locator('.scenario-card:visible')).toHaveCount(1);await expect(page.locator('#campaign-count')).toHaveText('1개 전투');await page.locator('#campaign-search').fill('없는전투');await expect(page.locator('.campaign-empty')).toBeVisible();await expect(page.locator('.scenario-card:visible')).toHaveCount(0);
 await page.locator('#campaign-search').fill('');await page.locator('#campaign-arc').selectOption('yangping');await expect(page.locator('.scenario-card:visible')).toHaveCount(5);await page.locator('.modal-footer button').focus();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.getClientRects().length)).toBeGreaterThan(0);await page.keyboard.press('Escape');await expect(page.locator('.modal')).toHaveCount(0);
});
test('new campaign intro reaches the first reconnaissance, preserving the old save',async({page})=>{
 const old=playMission('shangyong');await page.addInitScript(s=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s)),old);await page.goto('/');await page.locator('[data-action="campaign-start"]').click();await page.locator('[data-action="chronicle-skip"]').click();await expect(page.locator('.dialogue-text')).toContainText(SCENARIOS[0].story[0].line);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.battle.v2')!).scenarioId)).toBe('shangyong');
});
test('Sima Shi is named correctly in end-turn and imported-save confirmation',async({page})=>{
 const {createBattle}=await import('../../src/core.ts'),s=createBattle('protect',84,'yangping-01');await page.addInitScript(s=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s)),s);await page.goto('/');await page.locator('[data-action="continue"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());await page.locator('[data-action="end-turn"]').click();await expect(page.locator('.modal-eyebrow')).toHaveText('사마사 · 행동 가능');await page.locator('.modal-footer [data-action="close-modal"]').click();await page.locator('[data-action="pause"]').first().click();const chooserPromise=page.waitForEvent('filechooser');await page.locator('[data-action="import"]').click();const chooser=await chooserPromise;await chooser.setFiles({name:'simayi-chronicle-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(s))});await expect(page.locator('.modal-note')).toContainText('사마사 HP');
});
