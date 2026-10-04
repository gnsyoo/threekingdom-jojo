import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SCENARIOS} from '../../src/scenarios.ts';
const artifacts=resolve(process.env.QA_ARTIFACT_DIR??'qa-artifacts/battle-art');mkdirSync(artifacts,{recursive:true});
const manifest=JSON.parse(readFileSync('public/assets/battle-art.json','utf8'));
for(const viewport of [{name:'phone',width:390,height:844,dpr:2},{name:'desktop',width:1440,height:900,dpr:1}])for(const s of SCENARIOS)test(`${viewport.name} ${s.id}: illustrated map across gallery, deployment and battle`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.name==='phone',isMobile:viewport.name==='phone',deviceScaleFactor:viewport.dpr}),page=await context.newPage();
 const errors:string[]=[],bad:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>localStorage.setItem('wei-tactics.preferences',JSON.stringify({sound:false,fast:true,grid:true})));await page.goto('/');
 await page.locator('[data-action="scenarios"]').click();const card=page.locator(`[data-scenario-id="${s.id}"]`);await card.scrollIntoViewIfNeeded();
 await expect(card.locator('img')).toHaveAttribute('src',`/assets/${s.background}`);
 await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>=1500&&img.naturalHeight>=950)).toBe(true);
 const record=manifest.maps.find((m:any)=>m.id===s.id);expect(record.file).toBe(s.background);expect(record.bytes).toBeLessThan(800_000);
 const response=await page.request.get(`/assets/${s.background}`);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/webp');expect((await response.body()).length).toBe(record.bytes);
 await card.click();await page.locator('[data-action="story-skip"]').click();await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();
 const map=page.locator('.prep-map');await map.scrollIntoViewIfNeeded();const box=(await map.boundingBox())!;
 expect(box.width/box.height).toBeCloseTo(s.cols/s.rows,1);expect(await map.evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(s.background);
 await page.screenshot({path:`${artifacts}/${viewport.name}-${s.id}-preparation.png`});
 await page.locator('.prep-actions [data-action="prep-deployment"]').click();const board=page.locator('.deployment-board');
 expect(await board.evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(s.background);
 const size=await board.evaluate(e=>getComputedStyle(e).backgroundSize).then(v=>v.split(' ').map(parseFloat));expect(size[0]).toBeCloseTo(s.cols/3*100,1);expect(size[1]).toBeCloseTo(s.rows/3*100,1);
 await expect(board.locator('button')).toHaveCount(9);await page.screenshot({path:`${artifacts}/${viewport.name}-${s.id}-deployment.png`});await page.locator('[data-action="prep-deploy-confirm"]').click();
 const mapResponse=page.waitForResponse(r=>r.url().endsWith(`/assets/${s.background}`)&&r.status()===200);await page.locator('[data-action="depart"]').click();await mapResponse;await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
 await expect(page.locator('#command-actor')).toContainText(s.commanderName??'사마의');await page.screenshot({path:`${artifacts}/${viewport.name}-${s.id}-battle.png`});
 await page.locator('[data-action="overview"]').click();
 const bounds=(await page.locator('#battlefield canvas').boundingBox())!;
 for(const point of [{x:0,y:0},{x:s.cols-1,y:s.rows-1}]){const at=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),point);expect(at.x).toBeGreaterThan(bounds.x);expect(at.x).toBeLessThan(bounds.x+bounds.width);expect(at.y).toBeGreaterThan(bounds.y);expect(at.y).toBeLessThan(bounds.y+bounds.height);}
 await page.screenshot({path:`${artifacts}/${viewport.name}-${s.id}-overview.png`});
 if(viewport.name==='phone'){await page.setViewportSize({width:844,height:390});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:390,height:844});}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(bad).toEqual([]);await context.close();
});
