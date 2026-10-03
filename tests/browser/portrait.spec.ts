import {test,expect,type Page} from '@playwright/test';
import {getScenario,type ScenarioId} from '../../src/scenarios.ts';

async function textFits(page:Page){
  const overflow=await page.evaluate(()=>{
    const problems:string[]=[];
    for(const button of document.querySelectorAll<HTMLButtonElement>('button')){
      if(!button.getClientRects().length||button.matches('.prep-map,.dialogue-text'))continue;
      const box=button.getBoundingClientRect(), walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
      let node:Node|null;
      while((node=walker.nextNode())){
        if(!node.textContent?.trim()||!node.parentElement?.getClientRects().length||getComputedStyle(node.parentElement).fontSize==='0px')continue;
        const range=document.createRange();range.selectNodeContents(node);
        for(const rect of range.getClientRects())if(rect.width&&rect.height&&(rect.left<box.left-1||rect.right>box.right+1||rect.top<box.top-1||rect.bottom>box.bottom+1))problems.push(`${button.dataset.action}: ${node.textContent.trim()}`);
      }
    }
    return [...new Set(problems)];
  });
  expect(overflow,'button text must stay inside its own button').toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
async function choose(page:Page,id:ScenarioId){
  await page.goto('/');await page.locator('[data-action="scenarios"]').tap();await textFits(page);
  await page.locator(`[data-scenario-id="${id}"]`).tap();
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'계속',exact:true}).tap();
  await page.locator('[data-action="choice-protect"]').tap();await textFits(page);
  const box=await page.locator('.dialogue-bottom [data-action="choice-confirm"]').boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.locator('[data-action="choice-confirm"]').tap();
}
async function ready(page:Page){await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());}
async function fast(page:Page){await page.locator('[data-action="pause"]').first().tap();await textFits(page);await page.locator('[data-action="speed-fast"]').tap();await page.locator('.modal-footer [data-action="close-modal"]').tap();}

for(const [width,height,id] of [[320,568,'yeongcheon'],[390,844,'sishui'],[412,915,'hulao']] as const)test(`${id} at ${width}×${height} has readable portrait controls, undistorted deployment and resumable events`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:2});const page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await choose(page,id);await textFits(page);
  for(const action of ['prep-equipment','prep-deployment','prep-shop','depart']){
    const b=await page.locator(`.prep-actions [data-action="${action}"]`).boundingBox();expect(b!.width).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);expect(b!.y+b!.height).toBeLessThanOrEqual(height);
  }
  const map=await page.locator('.prep-map').boundingBox();expect(map!.width/map!.height).toBeCloseTo(getScenario(id).cols/getScenario(id).rows,2);
  await page.locator('[data-action="prep-unit"][data-unit-id="guan"]').tap();await page.locator('.prep-actions [data-action="prep-equipment"]').tap();await textFits(page);await expect(page.locator('.modal').getByText('청룡도',{exact:true})).toBeVisible();await page.locator('.modal-footer [data-action="close-modal"]').tap();
  await page.locator('.prep-actions [data-action="prep-deployment"]').tap();await textFits(page);await page.locator('[data-action="prep-deploy-confirm"]').tap();
  await page.locator('.prep-actions [data-action="prep-shop"]').tap();await textFits(page);await page.locator('.modal-footer [data-action="close-modal"]').tap();
  await page.locator('[data-action="depart"]').tap();await ready(page);await textFits(page);
  const canvas=await page.locator('#battlefield canvas').boundingBox(),info=await page.locator('#unit-panel').boundingBox();expect(canvas!.height).toBeGreaterThan(120);expect(info!.y).toBeGreaterThanOrEqual(canvas!.y+canvas!.height-1);await expect(page.locator('#unit-panel .unit-name h2')).toHaveText('조조');
  for(const action of ['move','attack','encourage','potion','wait','end-turn']){const b=await page.locator(`[data-action="${action}"]`).boundingBox();expect(b!.width).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);expect(b!.y+b!.height).toBeLessThanOrEqual(height);}
  await fast(page);const target=id==='yeongcheon'?2:3;
  for(let round=1;round<target;round++){await page.locator('[data-action="wait"]').tap();await page.locator('[data-action="end-turn"]').tap();await page.waitForFunction(n=>{const s=(window as any).__WEI_DEBUG__.state();return s.round===n&&s.phase==='player';},round+1,{timeout:45000});}
  const before=await page.evaluate(()=>(window as any).__WEI_DEBUG__.state());expect(before.scenarioId).toBe(id);if(id!=='yeongcheon')expect(before.events).toContain(id==='sishui'?'guan-arrived':'lubu-charge');
  await page.screenshot({path:`test-results/portrait-${id}.png`});await page.reload();await textFits(page);await page.getByRole('button',{name:/전투 이어하기/}).tap();await ready(page);
  expect(await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().events)).toEqual(before.events);await textFits(page);expect(errors).toEqual([]);await context.close();
});

test('portrait touch movement survives two rotations, zoom and drag without changing the saved battle',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();await choose(page,'yeongcheon');await page.locator('[data-action="depart"]').tap();await ready(page);
  const tapTile=async()=>{const p=await page.evaluate(()=>(window as any).__WEI_DEBUG__.tile({x:6,y:8}));await page.touchscreen.tap(p.x,p.y);};
  await tapTile();await expect(page.getByText('이곳으로 이동',{exact:true})).toBeVisible();await textFits(page);await page.locator('[data-action="confirm"]').tap();
  await page.waitForFunction(()=>!(window as any).__WEI_DEBUG__.motion().busy);
  for(const size of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(size);await expect.poll(async()=>Math.round((await page.locator('#battlefield canvas').boundingBox())!.width)-Math.round((await page.locator('#map-area').boundingBox())!.width)).toBe(0);await textFits(page);}
  await page.locator('[data-action="undo"]').tap();expect(await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().units[0].y)).toBe(9);
  await page.locator('[data-action="zoom-in"]').tap();await page.locator('[data-action="zoom-out"]').tap();await page.locator('[data-action="focus"]').tap();await tapTile();await expect(page.getByText('이곳으로 이동',{exact:true})).toBeVisible();await page.locator('[data-action="cancel"]').tap();
  const box=await page.locator('#battlefield canvas').boundingBox(),session=await context.newCDPSession(page);const x=box!.x+box!.width/2,y=box!.y+box!.height/2;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+55,y:y+20}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().pendingMove)).toBeNull();await expect(page.locator('[data-action="confirm"]')).toHaveCount(0);await context.close();
});

test('tablet portrait uses the same preparation sheet and keeps the conversation button intact',async({page})=>{
  await page.setViewportSize({width:768,height:1024});await page.goto('/');await page.locator('[data-action="new"]').click();
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'계속',exact:true}).click();await page.locator('[data-action="choice-advance"]').click();await textFits(page);await page.locator('[data-action="choice-confirm"]').click();await textFits(page);
  const sections=await page.locator('.prep-columns > *').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect()));expect(sections[1].y).toBeLessThan(sections[0].y);expect(sections[2].y).toBeGreaterThan(sections[0].y);
});
