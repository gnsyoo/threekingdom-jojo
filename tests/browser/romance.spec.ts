import {test,expect} from '@playwright/test';
import {createBattle,applyScenarioEvents,evaluateOutcome,parseSave} from '../../src/core.ts';

for(const [id,source,event,ending] of [
  ['shangyong','제94회','신의','신탐'],
  ['wuzhang','제103~104회','신비','목상'],
  ['liaodong','제106회','하후패','공손연 부자'],
] as const)test(`${id}: Romance events appear in the council and the canonical aftermath`,async({page})=>{
  await page.goto('/');await page.locator('[data-action="scenarios"]').click();await page.locator(`[data-scenario-id="${id}"]`).click();
  await expect(page.locator('.dialogue-bottom')).toContainText(source);
  for(let n=0;n<5;n++)await page.getByRole('button',{name:'계속',exact:true}).click();
  await page.locator('[data-action="story-log"]').click();
  await expect(page.locator('.journal-list li')).toHaveCount(6);await expect(page.locator('.journal-list')).toContainText(event);
  await page.locator('.modal-footer [data-action="close-modal"]').click();
  const state=createBattle('protect',228,id);
  if(id==='wuzhang'){state.round=8;applyScenarioEvents(state);}else for(const unit of state.units.filter(u=>u.boss))unit.hp=0;
  evaluateOutcome(state);expect(state.outcome).toBe('won');expect(parseSave(JSON.stringify(state))).toBeTruthy();
  await page.evaluate(save=>localStorage.setItem('simayi-chronicle.battle.v2',save),JSON.stringify(state));
  await page.reload();await page.getByRole('button',{name:/전투 결과 보기/}).click();
  await expect(page.locator('.result-narrative')).toContainText(ending);
  await expect(page.locator('.result-narrative')).toContainText('삼국연의');
  await expect(page.locator('.result-narrative')).not.toContainText('독백');
});
