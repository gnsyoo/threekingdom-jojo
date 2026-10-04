import { test, expect, type Page } from '@playwright/test';
import { reachable, distance, canAttack, type BattleState, type Point } from '../../src/core.ts';

async function state(page: Page): Promise<BattleState> {
  return page.evaluate(() => (window as any).__WEI_DEBUG__.state());
}
async function tile(page: Page, point: Point) {
  const location = await page.evaluate(p => (window as any).__WEI_DEBUG__.tile(p), point);
  expect(location).toBeTruthy();
  await page.mouse.click(location.x, location.y);
}
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '상용으로 출진' }).click();
  for(let i=0;i<5;i++) await page.getByRole('button', { name: '계속' }).click();
  await page.locator('[data-action="choice-protect"]').click();
  await page.locator('[data-action="choice-confirm"]').click();
  await page.locator('[data-action="depart"]').click();
  await expect(page.locator('#map-loading')).toHaveCount(0);
  await page.waitForFunction(() => (window as any).__WEI_DEBUG__?.ready());
}

test('mobile title and story lead to a live tactical map with usable touch controls', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await expect(page.locator('[data-action="move"]')).toBeEnabled();
  await page.locator('[data-action="objective"]').click();
  await expect(page.getByText('맹달을 제압하라', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '전장으로' }).click();
  const bounds = await page.locator('.command-actions').boundingBox(); expect(bounds!.width).toBeGreaterThan(300);
  for (const name of ['move', 'attack', 'wait', 'end-turn']) {
    const box = await page.locator(`[data-action="${name}"]`).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44); expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-battle.png' });
  expect(errors).toEqual([]);
});

test('movement preview, undo and automatic save survive a real page reload', async ({ page }) => {
  await start(page);
  await tile(page, { x: 8, y: 9 });
  await expect(page.getByText('이곳으로 이동', { exact: true })).toBeVisible();
  expect((await state(page)).units[0].x).toBe(6);
  await page.locator('[data-action="confirm"]').click();
  expect((await state(page)).units[0].x).toBe(8);
  await page.reload();
  await page.getByRole('button', { name: /전투 이어하기/ }).click();
  await expect(page.locator('#map-loading')).toHaveCount(0);
  expect((await state(page)).units[0].x).toBe(8);
  await page.locator('[data-action="undo"]').click();
  expect((await state(page)).units[0].x).toBe(6);
  await page.screenshot({ path: 'test-results/desktop-battle.png' });
});

test('a paused AI phase reloads and completes without replaying acted units', async ({ page }) => {
  await start(page);
  await page.locator('[data-action="wait"]').click();
  await page.locator('[data-action="end-turn"]').click();
  await page.waitForFunction(() => (window as any).__WEI_DEBUG__.state().units.some((u: any) => u.team === 'ally' && u.acted));
  await page.locator('[data-action="pause"]').first().click();
  const before = await state(page); expect(before.phase).not.toBe('player');
  await page.reload();
  await page.getByRole('button', { name: /전투 이어하기/ }).click();
  await page.waitForFunction(() => (window as any).__WEI_DEBUG__.state().phase === 'player');
  const after = await state(page); expect(after.round).toBe(2); expect(after.surpriseTriggered).toBe(true);
  expect(after.logs.filter(l => l.startsWith('신의·신탐의'))).toHaveLength(1);
});

test('legal UI actions finish a whole battle and show the saved victory result', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.locator('[data-action="pause"]').first().click();
  await page.locator('[data-action="speed-fast"]').click();
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  let s = await state(page);
  for (let turn = 0; turn < 12 && s.outcome === 'playing'; turn++) {
    const sima = s.units.find(u => u.id === 'sima')!;
    if (sima.hp < 65 && s.potions) {
      await page.locator('[data-action="potion"]').click();
      await page.locator('[data-action="confirm"]').click();
    } else {
      const enemies = s.units.filter(u => u.team === 'enemy' && u.hp > 0);
      if (!enemies.some(e => canAttack(s, sima, e))) {
        const options = reachable(s, sima).sort((a, b) => Math.min(...enemies.map(e => distance(a, e))) - Math.min(...enemies.map(e => distance(b, e))) || a.cost - b.cost);
        if (options[0] && distance(sima, options[0])) {
          await page.locator('[data-action="move"]').click(); await tile(page, options[0]);
          await page.locator('[data-action="confirm"]').click();
        }
      }
      s = await state(page);
      const player = s.units.find(u => u.id === 'sima')!;
      const target = s.units.filter(u => canAttack(s, player, u)).sort((a, b) => a.hp - b.hp)[0];
      if (target) {
        await page.locator('[data-action="attack"]').click();
        await page.waitForTimeout(300);
        await tile(page, target);
        await expect(page.locator('[data-action="confirm"]')).toBeVisible();
        await page.locator('[data-action="confirm"]').click();
      } else await page.locator('[data-action="wait"]').click();
    }
    s = await state(page);
    if (s.outcome !== 'playing') break;
    await page.locator('[data-action="end-turn"]').click();
    await page.waitForFunction(() => { const s = (window as any).__WEI_DEBUG__.state(); return s.phase === 'player' || s.outcome !== 'playing'; });
    s = await state(page);
  }
  expect(s.outcome).toBe('won'); expect(s.attacksMade).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: '상용 급습전 승리' })).toBeVisible();
  await page.screenshot({ path: 'test-results/victory.png' });
  await page.reload(); await page.getByRole('button', { name: /전투 결과 보기/ }).click();
  await expect(page.getByRole('heading', { name: '상용 급습전 승리' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an invalid save is reported and a valid backup is recovered', async ({ page }) => {
  await start(page);
  await tile(page, { x: 8, y: 9 }); await page.locator('[data-action="confirm"]').click();
  await page.locator('[data-action="pause"]').first().click();
  await page.locator('.modal-footer [data-action="title"]').click();
  await page.evaluate(() => localStorage.setItem('simayi-chronicle.battle.v2', '{broken'));
  await page.reload();
  await expect(page.getByText('이전 정상 기록을 복구했습니다.')).toBeVisible();
  await page.getByRole('button', { name: /전투 이어하기/ }).click();
  await expect(page.locator('#map-loading')).toHaveCount(0);
  expect((await state(page)).units[0].x).toBe(6);
});

test('touchscreen taps move the commander and a drag pans without issuing a command', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: '상용으로 출진' }).tap();
  for(let i=0;i<5;i++) await page.getByRole('button', { name: '계속' }).tap();
  await page.locator('[data-action="choice-protect"]').tap();
  await page.locator('[data-action="choice-confirm"]').tap();
  await page.locator('[data-action="depart"]').tap();
  await expect(page.locator('#map-loading')).toHaveCount(0);
  const p = await page.evaluate(() => (window as any).__WEI_DEBUG__.tile({ x: 8, y: 9 }));
  await page.touchscreen.tap(p.x, p.y);
  await expect(page.getByText('이곳으로 이동', { exact: true })).toBeVisible();
  await page.locator('[data-action="confirm"]').tap();
  expect((await state(page)).units[0].x).toBe(8);
  await page.locator('[data-action="undo"]').tap();
  expect((await state(page)).units[0].x).toBe(6);
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 230, y: 165 }] });
  for (let i = 1; i <= 4; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 230 + 20 * i, y: 165 + 4 * i }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await state(page)).pendingMove).toBeNull();
  expect((await state(page)).units[0].x).toBe(6);
  await expect(page.locator('[data-action="confirm"]')).toHaveCount(0);
  await context.close();
});

test('concept preparation menus preserve purchases and confirmed deployment into battle',async({page})=>{
  await page.goto('/');await page.locator('[data-action="new"]').click();
  for(let i=0;i<5;i++) await page.getByRole('button',{name:'계속',exact:true}).click();
  await page.locator('[data-action="choice-advance"]').click();await page.locator('[data-action="choice-confirm"]').click();
  const columns=await page.locator('.prep-columns > *').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().x));
  expect(columns[0]).toBeLessThan(columns[1]);expect(columns[1]).toBeLessThan(columns[2]);
  for(const action of ['prep-equipment','prep-deployment','prep-shop','depart']){
    const button=page.locator(`.prep-actions [data-action="${action}"]`);expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('[data-action="prep-unit"][data-unit-id="guo"]').click();
  await page.locator('.prep-actions [data-action="prep-equipment"]').click();await expect(page.locator('.modal').getByText('철궁',{exact:true})).toBeVisible();
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  await page.locator('.prep-actions [data-action="prep-shop"]').click();await page.locator('[data-action="prep-buy"]').click();
  await expect(page.getByText('보유 3 / 3개 · 구매 100냥',{exact:true})).toBeVisible();await expect(page.locator('[data-action="prep-buy"]')).toBeDisabled();
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  await page.locator('.prep-actions [data-action="prep-deployment"]').click();await page.locator('[data-action="prep-position"][data-x="5"][data-y="8"]').click();
  await page.locator('[data-action="prep-deploy-confirm"]').click();
  await page.locator('.prep-footer [data-action="prep-back"]').click();await page.locator('[data-action="choice-confirm"]').click();
  await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  const s=await state(page);expect(s.potions).toBe(3);expect(s.units[0].x).toBe(5);expect(s.units[0].y).toBe(8);expect(s.units[0].buff).toBe(1);
  await page.reload();await page.getByRole('button',{name:/전투 이어하기/}).click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  expect((await state(page)).units[0].x).toBe(5);
});

test('dialogue automatic playback stops at the choice and records the council',async({page})=>{
  await page.goto('/');await page.locator('[data-action="new"]').click();await page.clock.install();
  await page.locator('[data-action="story-auto"]').click();await page.clock.runFor(36000);
  await expect(page.locator('[data-action="choice-confirm"]')).toBeDisabled();
  await expect(page.locator('[data-action="story-auto"]')).toHaveAttribute('aria-pressed','false');
  await page.locator('[data-action="story-log"]').click();await expect(page.locator('.journal-list li')).toHaveCount(6);
});

test('walking cycles sprite frames and attacks play before the next phase',async({page})=>{
  await start(page);await tile(page,{x:9,y:7});await page.locator('[data-action="confirm"]').click();
  await page.waitForFunction(()=>(window as any).__WEI_DEBUG__.motion().active.some((u:any)=>u.id==='sima'&&u.texture==='sima-motion'&&u.playing));
  const first=await page.evaluate(()=>(window as any).__WEI_DEBUG__.motion().active.find((u:any)=>u.id==='sima').frame);
  await page.waitForFunction(f=>(window as any).__WEI_DEBUG__.motion().active.some((u:any)=>u.id==='sima'&&u.texture==='sima-motion'&&u.frame!==f),first);
  await page.waitForFunction(()=>!(window as any).__WEI_DEBUG__.motion().busy);
  await page.locator('[data-action="wait"]').click();await page.locator('[data-action="end-turn"]').click();
  await page.waitForFunction(()=>(window as any).__WEI_DEBUG__.motion().attacks>0);
  await page.waitForFunction(()=>(window as any).__WEI_DEBUG__.state().phase==='player');
  await page.locator('[data-action="pause"]').first().click();await page.locator('[data-action="speed-fast"]').click();
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  let s=await state(page);const player=s.units[0];
  if(!s.units.some(u=>canAttack(s,player,u))){
    const destination=reachable(s,player).find(p=>s.units.some(u=>canAttack(s,{...player,x:p.x,y:p.y},u)));expect(destination).toBeTruthy();
    await page.locator('[data-action="move"]').click();await tile(page,destination!);await page.locator('[data-action="confirm"]').click();
    await page.waitForFunction(()=>!(window as any).__WEI_DEBUG__.motion().busy);s=await state(page);
  }
  const target=s.units.find(u=>canAttack(s,s.units[0],u));expect(target).toBeTruthy();
  const before=await page.evaluate(()=>(window as any).__WEI_DEBUG__.motion().attacks);
  await page.evaluate(()=>{
    const samples:{running:boolean;frames:Set<string>;overflow:string[]}={running:true,frames:new Set(),overflow:[]};
    (window as any).__TILE_SAMPLES__=samples;
    const sample=()=>{
      const debug=(window as any).__WEI_DEBUG__,sprite=debug.motion().active.find((u:any)=>u.id==='sima');
      if(sprite?.playing&&String(sprite.frame).startsWith('attack-')){
        const u=debug.state().units.find((unit:any)=>unit.id==='sima'),r=sprite.bounds;
        samples.frames.add(sprite.frame);
        if(r.x<u.x*64+1||r.y<u.y*64+1||r.x+r.width>(u.x+1)*64-1||r.y+r.height>(u.y+1)*64-1)samples.overflow.push(sprite.frame);
      }
      if(samples.running)requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  await page.locator('[data-action="attack"]').click();await tile(page,target!);await page.locator('[data-action="confirm"]').click();
  await page.waitForFunction(n=>(window as any).__WEI_DEBUG__.motion().attacks>n,before,{timeout:8000});
  await page.waitForFunction(()=>!(window as any).__WEI_DEBUG__.motion().busy);
  const motion=await page.evaluate(()=>(window as any).__WEI_DEBUG__.motion());
  const attackFrames=motion.frames.filter((f:any)=>f.id==='sima'&&f.kind==='attack').map((f:any)=>f.frame);
  expect(motion.impacts).toBeGreaterThan(0);expect(new Set(attackFrames).size,JSON.stringify(attackFrames)).toBeGreaterThanOrEqual(3);
  const samples=await page.evaluate(()=>{const samples=(window as any).__TILE_SAMPLES__;samples.running=false;return {frames:[...samples.frames],overflow:samples.overflow};});
  expect(samples.frames.length,'sample multiple attack poses while lunging').toBeGreaterThanOrEqual(3);
  expect(samples.overflow,'selected commander must stay inside its tile throughout the attack').toEqual([]);
});
