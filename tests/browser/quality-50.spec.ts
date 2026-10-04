import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SCENARIOS,getScenario,type ScenarioId} from '../../src/scenarios.ts';
import {createBattle,evaluateOutcome} from '../../src/core.ts';
import {playMission} from '../helpers/play-mission.ts';

const environments=[{name:'small-phone',width:320,height:568,dpr:2},{name:'phone',width:390,height:844,dpr:2},{name:'landscape',width:844,height:390,dpr:2},{name:'tablet',width:768,height:1024,dpr:2},{name:'desktop',width:1440,height:900,dpr:1}];
const views=['title','intro','ending','campaign','story','choice','preparation','equipment-shop','battle','results'];
const artifacts=resolve(process.env.QA_ARTIFACT_DIR??'qa-artifacts/chronicle');mkdirSync(artifacts,{recursive:true});
async function inspect(page:Page){
 await page.evaluate(()=>document.fonts.ready);
 const issues=await page.evaluate(()=>{
  const errors:string[]=[];
  for(const button of document.querySelectorAll<HTMLButtonElement>('button')){
   if(!button.getClientRects().length||button.matches('.prep-map,.dialogue-text'))continue;
   const box=button.getBoundingClientRect(),walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);let node:Node|null;
   while(node=walker.nextNode()){
    if(!node.textContent?.trim()||!node.parentElement?.getClientRects().length||getComputedStyle(node.parentElement).fontSize==='0px')continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1))errors.push(`${button.dataset.action}: ${node.textContent.trim()}`);
   }
  }
  for(const name of document.querySelectorAll('.character-nameplate > strong')){const range=document.createRange();range.selectNodeContents(name);if(range.getClientRects().length>1)errors.push('wrapped commander name');}
  if(document.documentElement.scrollWidth>innerWidth)errors.push('page overflow');
  for(const e of document.querySelectorAll<HTMLElement>('main,.modal-body,.prep-columns'))if(e.scrollLeft)errors.push(`${e.className}: shifted sideways`);
  for(const image of document.querySelectorAll<SVGImageElement>('.portrait-atlas image,.item-art image')){const m=image.getScreenCTM();if(m&&Math.abs(Math.hypot(m.a,m.b)-Math.hypot(m.c,m.d))>.001)errors.push('stretched art');}
  return [...new Set(errors)];
 });expect(issues).toEqual([]);
}
async function choose(page:Page,id:ScenarioId){await page.locator('[data-action="scenarios"]').click();await page.locator(`[data-scenario-id="${id}"]`).click();}
async function prep(page:Page,id:ScenarioId){await choose(page,id);await page.locator('[data-action="story-skip"]').click();await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();}

for(const [e,env] of environments.entries())for(const [v,view] of views.entries()){
 const review=e*10+v+1,id=SCENARIOS[(e*10+v)%SCENARIOS.length].id;
 test(`review ${String(review).padStart(2,'0')}: ${env.name} ${view} ${id}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width:env.width,height:env.height},deviceScaleFactor:env.dpr,hasTouch:e!==4,isMobile:e!==4});const page=await context.newPage();
  const errors:string[]=[],bad:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(ids=>{localStorage.setItem('simayi-chronicle.campaign.v2',JSON.stringify(ids));localStorage.setItem('wei-tactics.preferences',JSON.stringify({sound:false,fast:true,grid:true}));},SCENARIOS.map(s=>s.id));
  await page.goto('/');
  const photograph=async(label:string)=>{await inspect(page);await page.screenshot({path:`${artifacts}/${String(review).padStart(2,'0')}-${label}.png`});};
  if(view==='title'){
   const won=playMission('yangping');await page.evaluate(s=>{localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s));localStorage.setItem('simayi-chronicle.journey.v1',JSON.stringify({stage:'story',scenarioId:'gaoping',index:4,choice:null}));},won);await page.reload();
   await expect(page.locator('[data-action="journey-continue"]')).toBeVisible();await expect(page.locator('[data-action="ending"]')).toBeAttached();
  }
  if(view==='intro'||view==='ending'){
   await page.locator(`[data-action="${view==='intro'?'campaign-start':'ending'}"]`).click();
   for(let n=0;n<2;n++)await page.locator('[data-action="chronicle-next"]').click();
   await expect(page.locator('.chronicle-paper')).toContainText(view==='intro'?'소문':'이제 남은 수');
   for(const action of ['chronicle-prev','chronicle-next']){const r=await page.locator(`[data-action="${action}"]`).boundingBox();expect(r!.height).toBeGreaterThanOrEqual(44);expect(r!.y+r!.height).toBeLessThanOrEqual(env.height+1);}
   if(view==='ending'){await photograph('ending-thought');await page.locator('[data-action="chronicle-next"]').click();await page.locator('[data-action="chronicle-next"]').click();await expect(page.locator('.chronicle-completion')).toContainText(`${SCENARIOS.length} / ${SCENARIOS.length}`);}
   if(env.height>env.width){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:env.width-40,y:200}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:40,y:200}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.locator('.chronicle-content').evaluate(e=>e.scrollLeft)).toBe(0);}
  }
  if(view==='campaign'){await page.locator('[data-action="scenarios"]').click();await expect(page.locator('.scenario-card')).toHaveCount(SCENARIOS.length);await page.locator('[data-scenario-id="yangping"]').scrollIntoViewIfNeeded();}
  if(view==='story'){await choose(page,id);await page.getByRole('button',{name:'계속',exact:true}).click();await expect(page.locator('.story-heading')).toContainText(getScenario(id).name);}
  if(view==='choice'){await choose(page,id);await page.locator('[data-action="story-skip"]').click();await expect(page.locator('[data-action="choice-confirm"]')).toBeDisabled();await page.locator('[data-action="choice-advance"]').click();await expect(page.locator('.choice-card[aria-pressed="true"]')).toHaveCount(1);}
  if(view==='preparation'){await prep(page,id);await page.locator('.prep-columns').evaluate(e=>e.scrollTop=e.scrollHeight);await expect(page.locator('[data-action="depart"]')).toBeVisible();for(const a of ['prep-equipment','prep-deployment','prep-shop','depart'])expect((await page.locator(`.prep-actions [data-action="${a}"]`).boundingBox())!.height).toBeGreaterThanOrEqual(44);}
  if(view==='equipment-shop'){
   await prep(page,id);await page.locator('.prep-actions [data-action="prep-equipment"]').click();await photograph('equipment');await page.locator('.modal-footer [data-action="close-modal"]').click();
   await page.locator('.prep-actions [data-action="prep-shop"]').click();await page.locator('[data-action="prep-assault"]').click();await expect(page.locator('.upgrade-shop')).toContainText('공격 강화 적용됨');
   await photograph('shop');await page.locator('.modal-footer [data-action="close-modal"]').click();
   await page.reload();await page.locator('[data-action="journey-continue"]').click();await expect(page.locator('.preparation-screen')).toBeVisible();
  }
  if(view==='battle'){
   await prep(page,id);await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
   await page.locator('[data-action="overview"]').click();await page.locator('[data-action="threat"]').click();await expect(page.locator('[data-action="threat"]')).toHaveAttribute('aria-pressed','true');
   await page.locator('[data-action="pause"]').first().click();await page.locator('.modal [data-action="tactic-guard"]').click();await page.locator('.modal-footer [data-action="close-modal"]').click();
   expect(await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().tactic)).toBe('guard');await expect(page.locator('#command-actor')).toContainText(getScenario(id).commanderName??'사마의');
   if(e!==4){await page.setViewportSize({width:env.height,height:env.width});await page.waitForTimeout(250);await inspect(page);await page.setViewportSize({width:env.width,height:env.height});await page.waitForTimeout(250);}
   await expect(page.locator('#mission-chip')).not.toBeEmpty();
   for(const action of ['move','attack','encourage','potion','wait','end-turn']){const r=await page.locator(`.command-bar [data-action="${action}"]`).boundingBox();expect(r!.height).toBeGreaterThanOrEqual(44);expect(r!.y+r!.height).toBeLessThanOrEqual(env.height+1);}
  }
  if(view==='results'){
   const won=playMission(id);await page.evaluate(s=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s)),won);await page.reload();await page.locator('[data-action="continue"]').click();await expect(page.locator('.result-narrative')).toBeVisible();await photograph('victory');
   await page.locator('.modal-footer [data-action="title"]').click();const lost=createBattle('protect',190,id);lost.units[0].hp=0;evaluateOutcome(lost);await page.evaluate(s=>localStorage.setItem('simayi-chronicle.battle.v2',JSON.stringify(s)),lost);await page.reload();await page.locator('[data-action="continue"]').click();await expect(page.locator('[data-action="restart"]')).toBeVisible();await expect(page.locator('.result-narrative')).toHaveCount(0);
  }
  await photograph(view);expect(errors).toEqual([]);expect(bad).toEqual([]);
  writeFileSync(`${artifacts}/${String(review).padStart(2,'0')}.json`,JSON.stringify({review,viewport:env,view,scenario:id,checks:['button text','horizontal overflow','portrait ratio','asset responses','page errors',view==='battle'?'orders and rotation':'story/action state'],passed:true},null,2));
  await context.close();
 });
}
