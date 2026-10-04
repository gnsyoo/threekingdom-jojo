import {test,expect,type Page,type CDPSession,type Locator} from '@playwright/test';

async function swipe(page:Page,cdp:CDPSession,x1:number,y1:number,x2:number,y2:number){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
  for(let step=1;step<=8;step++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*step/8,y:y1+(y2-y1)*step/8}]});
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  // Chromium suppresses taps briefly after a swipe; wait for gesture settlement.
  await page.waitForTimeout(1600);
}

for(const width of [320,390,768])test(`portrait ${width}: sideways swipes cannot shift the interface while scrolling and map dragging still work`,async({browser})=>{
  const height=width===768?1024:width===320?568:844;
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  const press=async(button:Locator)=>{
    await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box!.x+box!.width/2,y:box!.y+box!.height/2}]});
    // Keep a real touch duration after swipes; a zero-duration tap can be suppressed.
    await page.waitForTimeout(50);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(50);
  };
  const stable=async(selector:string)=>{
    const panel=page.locator(selector),before=await panel.boundingBox();
    const y=Math.min(height-140,before!.y+Math.min(220,before!.height/2));
    await swipe(page,cdp,width-60,y,60,y);
    await swipe(page,cdp,60,y,width-60,y);
    expect(await panel.evaluate(e=>e.scrollLeft),`${selector} must not scroll sideways`).toBe(0);
    const after=await panel.boundingBox();expect(after!.x).toBeCloseTo(before!.x,1);
    expect(await page.evaluate(()=>scrollX)).toBe(0);
    expect(await page.evaluate(()=>[document.documentElement,document.body,document.querySelector('#app')!].every(e=>e.scrollLeft===0))).toBe(true);
  };
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);await stable('.title-screen');
  await press(page.locator('[data-action="new"]'));await expect(page.locator('.story-screen')).toBeVisible();await stable('.story-screen');
  for(let n=0;n<5;n++)await press(page.getByRole('button',{name:'계속',exact:true}));await stable('.story-screen');
  await press(page.locator('[data-action="choice-protect"]'));await press(page.locator('[data-action="choice-confirm"]'));
  await stable('.prep-columns');
  await page.locator('.prep-columns').evaluate(e=>e.scrollTop=0);
  await swipe(page,cdp,width/2,height-160,width/2,170);
  expect(await page.locator('.prep-columns').evaluate(e=>e.scrollTop),'preparation must remain vertically scrollable').toBeGreaterThan(20);
  await press(page.locator('.prep-actions [data-action="prep-equipment"]'));await stable('.modal-body');
  await press(page.locator('.modal-footer [data-action="close-modal"]'));
  await press(page.locator('[data-action="depart"]'));await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  await stable('#unit-panel');
  const before=await page.evaluate(()=>(window as any).__WEI_DEBUG__.tile((window as any).__WEI_DEBUG__.state().units[0]));
  const map=await page.locator('#battlefield canvas').boundingBox();
  await swipe(page,cdp,map!.x+map!.width*.8,map!.y+map!.height/2,map!.x+map!.width*.3,map!.y+map!.height/2);
  const after=await page.evaluate(()=>(window as any).__WEI_DEBUG__.tile((window as any).__WEI_DEBUG__.state().units[0]));
  expect(Math.abs(before.x-after.x),'the battlefield camera must still pan').toBeGreaterThan(20);
  expect(await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().pendingMove)).toBeNull();
  expect(await page.locator('.game-shell').evaluate(e=>e.scrollLeft)).toBe(0);
  await context.close();
});
