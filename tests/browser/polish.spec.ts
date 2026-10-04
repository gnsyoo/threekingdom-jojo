import {test,expect,type Page,type TestInfo} from '@playwright/test';

const sizes=[
  {name:'small-phone',width:320,height:568,dpr:2},
  {name:'phone',width:390,height:844,dpr:2},
  {name:'landscape-phone',width:844,height:390,dpr:2},
  {name:'tablet',width:768,height:1024,dpr:2},
  {name:'desktop',width:1440,height:900,dpr:1},
];

async function readableControls(page:Page){
  const problems=await page.evaluate(()=>{
    const failures:string[]=[];
    for(const button of document.querySelectorAll<HTMLButtonElement>('button')){
      if(!button.getClientRects().length||button.matches('.prep-map,.dialogue-text'))continue;
      const box=button.getBoundingClientRect(),walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);let node:Node|null;
      while((node=walker.nextNode())){
        if(!node.textContent?.trim()||!node.parentElement?.getClientRects().length||getComputedStyle(node.parentElement).fontSize==='0px')continue;
        const range=document.createRange();range.selectNodeContents(node);
        for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1))failures.push(`${button.dataset.action}: ${node.textContent.trim()}`);
      }
    }
    if(document.documentElement.scrollWidth>innerWidth)failures.push('horizontal page overflow');
    return [...new Set(failures)];
  });
  expect(problems).toEqual([]);
}

async function undistortedArt(page:Page){
  const stretched=await page.evaluate(()=>[...document.querySelectorAll<SVGImageElement>('.portrait-atlas image,.item-art image')].filter(image=>{
    const m=image.getScreenCTM();if(!m)return false;
    return Math.abs(Math.hypot(m.a,m.b)-Math.hypot(m.c,m.d))>.001;
  }).length);
  expect(stretched,'artwork must use the same scale on both axes').toBe(0);
}

for(const size of sizes)test(`${size.name}: eight UI reviews keep art, controls, gold and map labels readable`,async({browser},info:TestInfo)=>{
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:size.dpr,hasTouch:size.name!=='desktop',isMobile:size.name.includes('phone')});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const review=async(name:string,check:()=>Promise<void>)=>test.step(name,async()=>{
    await check();await page.evaluate(()=>document.fonts.ready);await readableControls(page);
    await page.screenshot({path:info.outputPath(`${name}.png`)});
  });
  await page.goto('/');
  await review('01-title',async()=>{
    for(const action of ['new','scenarios'])expect((await page.locator(`[data-action="${action}"]`).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
  await page.locator('[data-action="scenarios"]').click();await page.locator('[data-scenario-id="shangyong"]').click();
  await review('02-conversation',async()=>{
    await expect(page.locator('.dialogue-speaker')).toHaveText('사마의');
    expect((await page.getByRole('button',{name:'계속',exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await undistortedArt(page);
  });
  for(let n=0;n<5;n++)await page.getByRole('button',{name:'계속',exact:true}).click();
  await review('03-unselected-strategy',async()=>{
    await expect(page.locator('[data-action="choice-confirm"]')).toBeDisabled();
    await expect(page.locator('.choice-card[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.choice-heading h2')).toHaveText('이번 출진의 방침');
    const cards=await page.locator('.choice-card').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect()));
    expect(cards[1].x>=cards[0].right-1||cards[1].y>=cards[0].bottom-1).toBe(true);
    const heading=await page.locator('.story-heading').boundingBox(),choices=await page.locator('.story-choices').boundingBox();
    expect(heading!.y+heading!.height,'the chapter heading must not overlap strategy selection').toBeLessThanOrEqual(choices!.y+1);
  });
  await page.locator('[data-action="choice-advance"]').click();
  await review('04-selected-strategy',async()=>{
    await expect(page.locator('.choice-card[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('[data-action="choice-advance"]')).toBeFocused();
    await expect(page.locator('[data-action="choice-confirm"]')).toBeEnabled();
    await expect(page.locator('.selected .choice-benefit')).toHaveText('회복약 2개 · 첫 턴 공격 +10%');
    if(size.name==='small-phone'){const box=await page.locator('[data-action="choice-confirm"]').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);}
  });
  await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();
  await review('05-preparation-portraits',async()=>{
    for(const id of ['shi','guo','niu','sima']){
      const row=page.locator(`[data-action="prep-unit"][data-unit-id="${id}"]`);await row.scrollIntoViewIfNeeded();
      const scroll=await page.locator('.prep-columns').evaluate(e=>e.scrollTop);await row.click();await undistortedArt(page);
      expect(await page.locator('.prep-columns').evaluate(e=>e.scrollTop)).toBeCloseTo(scroll,0);
      await expect(page.locator('.character-nameplate strong')).toHaveText({shi:'사마사',guo:'곽회',niu:'우금',sima:'사마의'}[id]!);
      if(size.name.includes('phone')||size.name==='tablet')expect(await page.locator('.character-nameplate strong').evaluate(element=>{
        const range=document.createRange();range.selectNodeContents(element);
        const rows=[...range.getClientRects()],box=element.parentElement!.getBoundingClientRect();
        return rows.length===1&&rows.every(r=>r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom);
      }),'commander names must fit on one line in compact nameplates').toBe(true);
    }
    for(const action of ['prep-equipment','prep-deployment','prep-shop','depart']){
      const box=await page.locator(`.prep-actions [data-action="${action}"]`).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.y+box!.height).toBeLessThanOrEqual(size.height+1);
    }
    const meter=await page.locator('.prep-meter i b').first().boundingBox();expect(meter!.height).toBeGreaterThanOrEqual(4);
    await page.locator('.prep-columns').evaluate(e=>e.scrollTop=0);
  });
  await page.locator('.prep-actions [data-action="prep-equipment"]').click();
  await review('06-equipment-sheet',async()=>{
    await undistortedArt(page);
    const offsets=await page.locator('.equipment-item').evaluateAll(nodes=>nodes.map(node=>{
      const box=node.getBoundingClientRect(),art=node.querySelector('.item-art,.art-icon')!.getBoundingClientRect();
      return {offset:art.left-box.left,inside:art.left>=box.left&&art.right<=box.right&&art.top>=box.top&&art.bottom<=box.bottom};
    }));
    expect(offsets.every(o=>o.inside)).toBe(true);expect(Math.max(...offsets.map(o=>o.offset))-Math.min(...offsets.map(o=>o.offset))).toBeLessThan(1);
    const close=await page.locator('.modal-footer [data-action="close-modal"]').boundingBox();expect(close!.y+close!.height).toBeLessThanOrEqual(size.height);
  });
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  await review('07-large-gold',async()=>{
    for(const amount of [200,999999,1000000,123456789,10000000000,Number.MAX_SAFE_INTEGER]){
      await page.evaluate(async value=>{
        const {Preparation}=await import('/src/preparation.ts');const preview=new Preparation('protect');preview.gold=value;
        const template=document.createElement('template');template.innerHTML=preview.render();
        document.querySelector('.prep-gold')!.replaceWith(template.content.querySelector('.prep-gold')!);
      },amount);
      await readableControls(page);
      await expect(page.locator('.prep-gold')).toHaveAttribute('title',amount.toLocaleString('ko-KR')+'냥');
      const contained=await page.locator('.prep-gold').evaluate(button=>{
        const box=button.getBoundingClientRect();return [...button.querySelectorAll('.art-icon,.gold-number,.gold-shop')].every(child=>{
          const r=child.getBoundingClientRect();return r.left>=box.left+1&&r.right<=box.right-1&&r.top>=box.top+1&&r.bottom<=box.bottom-1;
        });
      });expect(contained).toBe(true);
    }
  });
  await page.waitForLoadState('networkidle');await page.locator('[data-action="depart"]').click();
  await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  await review('08-battle-rendering',async()=>{
    const resolution=await page.locator('#battlefield canvas').evaluate((canvas:HTMLCanvasElement)=>canvas.width/canvas.getBoundingClientRect().width);expect(resolution).toBeCloseTo(Math.min(size.dpr,2),1);
    const heights=await page.evaluate(()=>(window as any).__WEI_DEBUG__.motion().active.map((u:any)=>u.height));
    expect(Math.max(...heights)).toBeLessThanOrEqual(44.01);expect(Math.min(...heights)).toBeGreaterThan(30);
    const overflow=await page.evaluate(()=>{
      const debug=(window as any).__WEI_DEBUG__,state=debug.state();
      return debug.motion().active.filter((sprite:any)=>{
        const u=state.units.find((unit:any)=>unit.id===sprite.id),r=sprite.bounds;
        return u?.hp>0&&(r.x<u.x*64+1||r.y<u.y*64+1||r.x+r.width>(u.x+1)*64-1||r.y+r.height>(u.y+1)*64-1);
      }).map((sprite:any)=>sprite.id);
    });expect(overflow,'every idle unit must fit inside its tile').toEqual([]);
    const anchor=async()=>{
      const position=await page.evaluate(()=>(window as any).__WEI_DEBUG__.tile((window as any).__WEI_DEBUG__.state().units[0]));
      const label=await page.locator('.unit-label[data-unit-id="sima"]').boundingBox();expect(label).toBeTruthy();expect(Math.abs(label!.x+label!.width/2-position.x)).toBeLessThan(2);
      expect(label!.y).toBeGreaterThan(position.y);expect(await page.locator('.unit-label[data-unit-id="sima"]').evaluate(e=>getComputedStyle(e).fontSize)).toBe('12px');
    };
    await page.waitForTimeout(150);await anchor();
    await page.locator('[data-action="zoom-in"]').click();await page.waitForTimeout(150);await anchor();
    await page.locator('[data-action="overview"]').click();await page.waitForTimeout(150);await anchor();
    await expect(page.locator('.landmark-label')).toHaveText('민가');await expect(page.locator('.landmark-label')).toBeVisible();
    await page.locator('[data-action="overview"]').click();await page.locator('[data-action="focus"]').click();await page.waitForTimeout(150);
    const point=await page.evaluate(()=>(window as any).__WEI_DEBUG__.tile({x:6,y:8}));
    if(size.name==='desktop')await page.mouse.click(point.x,point.y);else await page.touchscreen.tap(point.x,point.y);
    await expect(page.getByText('이곳으로 이동',{exact:true})).toBeVisible();await page.locator('[data-action="cancel"]').click();
  });
  expect(errors).toEqual([]);await context.close();
});

for(const id of ['wuzhang','liaodong'])test(`${id}: commanders have a common size and names remain crisp after rotation`,async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});const page=await context.newPage();
  await page.goto('/');await page.locator('[data-action="scenarios"]').click();await page.locator(`[data-scenario-id="${id}"]`).click();
  for(let n=0;n<5;n++)await page.getByRole('button',{name:'계속',exact:true}).click();await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();
  if(id==='wuzhang'){await page.locator('[data-action="prep-unit"][data-unit-id="niu"]').click();await undistortedArt(page);}
  await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  const heights=await page.evaluate(()=>(window as any).__WEI_DEBUG__.motion().active.map((u:any)=>u.height));expect(Math.max(...heights)).toBeLessThanOrEqual(44.01);expect(Math.min(...heights)).toBeGreaterThan(30);
  await page.locator('[data-action="overview"]').click();await page.waitForTimeout(150);
  const boss=await page.evaluate(()=>(window as any).__WEI_DEBUG__.state().units.find((u:any)=>u.boss));
  const point=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),boss);await page.touchscreen.tap(point.x,point.y);
  await expect(page.locator(`#unit-panel .portrait-${id==='wuzhang'?'zhuge':'gongsun'}`)).toBeVisible();await undistortedArt(page);
  await page.locator('[data-action="focus"]').click();
  for(const viewport of [{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(viewport);await expect.poll(async()=>Math.round((await page.locator('#battlefield canvas').boundingBox())!.width)-Math.round((await page.locator('#map-area').boundingBox())!.width)).toBe(0);
    await page.locator('[data-action="overview"]').click();await page.waitForTimeout(150);await readableControls(page);
    expect(await page.locator('.landmark-label').evaluate(e=>getComputedStyle(e).fontSize)).toBe('12px');
    await page.screenshot({path:info.outputPath(`${viewport.width}-battle.png`)});
  }
  await context.close();
});
