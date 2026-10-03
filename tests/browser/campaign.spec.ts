import {test,expect,type Page} from '@playwright/test';
import {reachable,distance,canAttack,type BattleState,type Point} from '../../src/core.ts';
import {getScenario,type ScenarioId} from '../../src/scenarios.ts';

const state=(page:Page):Promise<BattleState>=>page.evaluate(()=>(window as any).__WEI_DEBUG__.state());
async function tile(page:Page,point:Point){const p=await page.evaluate(p=>(window as any).__WEI_DEBUG__.tile(p),point);await page.mouse.click(p.x,p.y);}
async function preparation(page:Page,id:ScenarioId){
  await page.goto('/');await page.locator('[data-action="scenarios"]').click();
  await expect(page.locator('.scenario-card')).toHaveCount(3);
  await page.locator(`[data-action="scenario-pick"][data-scenario-id="${id}"]`).click();
  await expect(page.locator('.story-heading')).toContainText(`${getScenario(id).name}의 군의`);
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'계속',exact:true}).click();
  await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();
}
async function depart(page:Page){await page.locator('[data-action="depart"]').click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());}
async function fast(page:Page){await page.locator('[data-action="pause"]').first().click();await page.locator('[data-action="speed-fast"]').click();await page.locator('.modal-footer [data-action="close-modal"]').click();}

test('Sishui rescue lets a healthy commander give a potion to Sun Jian and save the treatment',async({page})=>{
  await preparation(page,'sishui');await page.locator('.prep-actions [data-action="prep-deployment"]').click();
  await page.locator('[data-action="prep-position"][data-x="7"][data-y="10"]').click();await page.locator('[data-action="prep-deploy-confirm"]').click();
  await depart(page);await page.locator('[data-action="overview"]').click();await tile(page,{x:6,y:6});await page.locator('[data-action="confirm"]').click();
  await page.locator('[data-action="potion"]').click();await expect(page.getByText('손견에게 회복약',{exact:true})).toBeVisible();
  await page.locator('[data-action="confirm"]').click();const s=await state(page);
  expect(s.units.find(u=>u.id==='sun')!.hp).toBe(103);expect(s.units[0].hp).toBe(144);expect(s.units[0].acted).toBe(true);expect(s.potions).toBe(2);
  await page.reload();await page.getByRole('button',{name:/전투 이어하기/}).click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  expect((await state(page)).units.find(u=>u.id==='sun')!.hp).toBe(103);
});

for(const id of ['sishui','hulao'] as ScenarioId[])test(`${id} mobile preparation, mission event and save resume use the right map`,async({page})=>{
  await page.setViewportSize({width:844,height:390});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await preparation(page,id);
  await expect(page.locator('.battle-location')).toHaveText(getScenario(id).name);
  expect(await page.locator('.prep-map').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(getScenario(id).background);
  if(id==='sishui'){
    await page.locator('[data-action="prep-unit"][data-unit-id="sun"]').click();
    await expect(page.locator('.prep-meter').first()).toContainText('48 / 108');
    await expect(page.getByText('3턴 지원 예정',{exact:true})).toBeVisible();
  }
  for(const action of ['prep-equipment','prep-deployment','prep-shop','depart'])expect((await page.locator(`.prep-actions [data-action="${action}"]`).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await depart(page);await fast(page);
  await page.locator('[data-action="objective"]').click();await expect(page.getByText(getScenario(id).objective,{exact:true})).toBeVisible();
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  if(id==='hulao'){await page.locator('[data-action="threat"]').click();await expect(page.locator('[data-action="threat"]')).toHaveAttribute('aria-pressed','true');}
  const targetRound=id==='sishui'?3:4;
  for(let round=1;round<targetRound;round++){
    await page.locator('[data-action="wait"]').click();await page.locator('[data-action="end-turn"]').click();
    await page.waitForFunction(n=>{const s=(window as any).__WEI_DEBUG__.state();return s.phase==='player'&&s.round===n;},round+1,{timeout:45000});
  }
  const before=await state(page);expect(before.scenarioId).toBe(id);expect(before.events).toContain(id==='sishui'?'guan-arrived':'lubu-charge');expect(before.fireTriggered).toBe(false);
  const boss=id==='sishui'?'hua':'lubu';
  const frames=await page.evaluate(({id,kind})=>(window as any).__WEI_DEBUG__.motion().frames.filter((f:any)=>f.id===id&&f.kind===kind).map((f:any)=>f.frame),{id:boss,kind:id==='sishui'?'attack':'walk'});
  expect(new Set(frames).size).toBeGreaterThanOrEqual(3);
  await page.reload();await page.getByRole('button',{name:/전투 이어하기/}).click();await page.waitForFunction(()=>(window as any).__WEI_DEBUG__?.ready());
  const after=await state(page);expect(after.scenarioId).toBe(id);expect(after.events).toEqual(before.events);expect(after.units.find(u=>u.id===boss)!.hp).toBe(before.units.find(u=>u.id===boss)!.hp);
  expect(after.logs.filter(l=>l.includes(id==='sishui'?'지원군이':'성문을 나선다'))).toHaveLength(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

for(const id of ['sishui','hulao'] as ScenarioId[])test(`${id} legal UI actions win and preserve the victory checkpoint before advancing`,async({page})=>{
  test.setTimeout(180000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await preparation(page,id);await depart(page);await fast(page);await page.locator('[data-action="overview"]').click();
  let s=await state(page);const bossFrames=new Set<string>();
  for(let round=0;round<getScenario(id).turnLimit&&s.outcome==='playing';round++){
    const cao=s.units[0];
    if(cao.hp<cao.maxHp*.5&&s.potions){await page.locator('[data-action="potion"]').click();await page.locator('[data-action="potion-target"][data-target-id="cao"]').click();await page.locator('[data-action="confirm"]').click();}
    else {
      const enemies=s.units.filter(u=>u.team==='enemy'&&u.hp>0);
      if(!enemies.some(u=>canAttack(s,cao,u))){
        const options=reachable(s,cao).sort((a,b)=>Math.min(...enemies.map(e=>distance(a,e)))-Math.min(...enemies.map(e=>distance(b,e)))||a.cost-b.cost);
        if(options[0]&&distance(cao,options[0])){await page.locator('[data-action="move"]').click();await tile(page,options[0]);await page.locator('[data-action="confirm"]').click();}
      }
      s=await state(page);const target=s.units.filter(u=>canAttack(s,s.units[0],u)).sort((a,b)=>a.hp-b.hp)[0];
      if(target){await page.locator('[data-action="attack"]').click();await tile(page,target);await page.locator('[data-action="confirm"]').click();}
      else await page.locator('[data-action="wait"]').click();
    }
    s=await state(page);if(s.outcome!=='playing')break;
    await page.locator('[data-action="end-turn"]').click();await page.waitForFunction(()=>{const s=(window as any).__WEI_DEBUG__.state();return s.phase==='player'||s.outcome!=='playing';});s=await state(page);
    for(const frame of await page.evaluate(id=>(window as any).__WEI_DEBUG__.motion().frames.filter((f:any)=>f.id===id&&f.kind==='attack').map((f:any)=>f.frame),id==='sishui'?'hua':'lubu'))bossFrames.add(frame);
  }
  expect(s.outcome).toBe('won');expect(bossFrames.size).toBeGreaterThanOrEqual(3);await expect(page.getByRole('heading',{name:`${getScenario(id).title} 승리`})).toBeVisible();
  await page.screenshot({path:`test-results/${id}-victory.png`});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wei-tactics.campaign.v1')??'[]'))).toContain(id);
  await page.reload();await page.getByRole('button',{name:/전투 결과 보기/}).click();await expect(page.getByRole('heading',{name:`${getScenario(id).title} 승리`})).toBeVisible();
  if(id==='sishui'){
    await page.locator('[data-action="next-battle"]').click();await expect(page.locator('.story-heading')).toContainText('호로관');
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wei-tactics.battle.v1')!).scenarioId)).toBe('sishui');
    for(let i=0;i<2;i++)await page.getByRole('button',{name:'계속',exact:true}).click();
    await page.locator('[data-action="choice-protect"]').click();await page.locator('[data-action="choice-confirm"]').click();await depart(page);
    expect((await state(page)).scenarioId).toBe('hulao');expect((await state(page)).units[0].hp).toBe(156);
  }else {
    await page.locator('.modal-footer [data-action="scenarios"]').click();await expect(page.locator('[data-scenario-id="hulao"]')).toContainText('승리 기록');
  }
  expect(errors).toEqual([]);
});
