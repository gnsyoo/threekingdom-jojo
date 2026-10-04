import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SCENARIOS,nextScenario} from '../../src/scenarios.ts';
import {siegeModeName} from '../../src/siege-scenarios.ts';
import {playMission} from '../helpers/play-mission.ts';
const maps=SCENARIOS.filter(s=>s.siege),artifacts=resolve(process.env.QA_ARTIFACT_DIR??'qa-artifacts/siege');mkdirSync(artifacts,{recursive:true});
for(const v of [{name:'small-phone',width:320,height:568},{name:'desktop',width:1440,height:900}])for(const s of maps)test(`${v.name} ${s.id}: siege art, story, deployment, gate guide and aftermath`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:v.width,height:v.height},hasTouch:v.name==='small-phone',isMobile:v.name==='small-phone',deviceScaleFactor:v.name==='small-phone'?2:1});const page=await context.newPage(),errors:string[]=[],bad:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('wei-tactics.preferences',JSON.stringify({sound:false,fast:true,grid:true})));await page.goto('/');await page.locator('[data-action="scenarios"]').click();await page.locator('#campaign-kind').selectOption('siege');await expect(page.locator('.scenario-card:visible')).toHaveCount(15);await expect(page.locator('#campaign-count')).toHaveText('15개 전투');
 const card=page.locator(`[data-scenario-id="${s.id}"]`);await expect(card.locator('.siege-badge')).toContainText(siegeModeName(s.siege!.mode));await expect(card.locator('img')).toHaveAttribute('src',`/assets/${s.background}`);
 const response=await page.request.get(`/assets/${s.background}`);expect(response.status()).toBe(200);const manifest=JSON.parse(readFileSync('public/assets/battle-art.json','utf8'));expect((await response.body()).length).toBe(manifest.maps.find((m:any)=>m.id===s.id).bytes);
 await card.click();for(let i=0;i<s.story.length;i++){await expect(page.locator('.dialogue-text')).toHaveText(s.story[i].line);if(i<s.story.length-1)await page.locator('.dialogue-next').click();}
 await page.locator('[data-action="choice-protect"]').click();await page.screenshot({path:`${artifacts}/${v.name}-${s.id}-choice.png`});await page.locator('[data-action="choice-confirm"]').click();
 const prep=page.locator('.prep-map');await prep.scrollIntoViewIfNeeded();expect(await prep.evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(s.background);await page.screenshot({path:`${artifacts}/${v.name}-${s.id}-preparation.png`});
 await page.locator('.prep-actions [data-action="prep-deployment"]').click();await expect(page.locator('.deployment-board button')).toHaveCount(9);await page.screenshot({path:`${artifacts}/${v.name}-${s.id}-deployment.png`});await page.locator('[data-action="prep-deploy-confirm"]').click();
 await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());await page.locator('[data-action="objective"]').click();await expect(page.locator('.siege-guide')).toContainText(s.siege!.fortress);await expect(page.locator('.siege-guide')).toContainText('성벽은 통행·사격을 막습니다.');await page.locator('.siege-guide [data-action="goal-focus"]').click();await page.locator('[data-action="overview"]').click();await page.screenshot({path:`${artifacts}/${v.name}-${s.id}-overview.png`});
 await page.locator('[data-action="threat"]').click();await page.locator('[data-action="wait"]').click();await page.locator('[data-action="end-turn"]').click();await page.waitForFunction(()=>{const b=JSON.parse(localStorage.getItem('simayi-chronicle.battle.v2')??'null');return b?.round===2&&b.phase==='player';},undefined,{timeout:45000});
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.battle.v2')!));await page.reload();await page.locator('[data-action="continue"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('simayi-chronicle.battle.v2')!));expect(after.mapRevision).toBe(2);expect(after.units).toEqual(before.units);expect(after.events).toEqual(before.events);
 if(v.name==='small-phone'){await page.setViewportSize({width:844,height:390});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:320,height:568});}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // A legal rule completion drives the real result/next-story UI; this is not a UI combat playthrough.
 await page.locator('[data-action="pause"]').first().click();await page.locator('.modal-footer [data-action="title"]').click();
 await page.evaluate(b=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(b)),playMission(s.id));await page.reload();await page.locator('[data-action="continue"]').click();await expect(page.locator('.result-narrative')).toContainText(s.aftermath[0].line);await page.screenshot({path:`${artifacts}/${v.name}-${s.id}-result.png`});const next=nextScenario(s.id)!;await page.locator('[data-action="next-battle"]').click();await expect(page.locator('.dialogue-text')).toHaveText(next.story[0].line);
 expect(errors).toEqual([]);expect(bad).toEqual([]);await context.close();
});
test('siege filters combine with campaign arcs and search without changing fifty chapter order',async({page})=>{
 await page.goto('/');await page.locator('[data-action="scenarios"]').click();await page.locator('#campaign-kind').selectOption('siege');await page.locator('#campaign-arc').selectOption('liaodong');await expect(page.locator('.scenario-card:visible')).toHaveCount(4);
 await page.locator('#campaign-search').fill('포위');expect(await page.locator('.scenario-card:visible').count()).toBeGreaterThan(0);await page.locator('#campaign-search').fill('없는 성채');await expect(page.locator('.campaign-empty')).toBeVisible();
 await page.locator('#campaign-search').fill('');await page.locator('#campaign-arc').selectOption('all');await page.locator('#campaign-kind').selectOption('field');await expect(page.locator('.scenario-card:visible')).toHaveCount(35);await page.locator('#campaign-kind').selectOption('all');await expect(page.locator('.scenario-card:visible')).toHaveCount(50);
});
