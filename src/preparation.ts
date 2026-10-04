import { createBattle, findUnit, deployCommander, key, type BattleState, type Point, type Unit } from './core.ts';
import { portraitHtml, unitSpriteHtml, artIcon, itemArt, assetUrl, formatGold, unitPortrait } from './art.ts';
import { icon } from './icons.ts';
import { getScenario, type ScenarioId } from './scenarios.ts';

export class Preparation {
  readonly battle: BattleState;
  gold = 200;
  selectedId = 'sima';
  constructor(choice: 'protect' | 'advance',scenarioId:ScenarioId='shangyong',completedCount=0) { this.gold=200+50*Math.min(9,Math.max(0,completedCount));this.battle=createBattle(choice,getScenario(scenarioId).year,scenarioId); }
  get scenario() { return getScenario(this.battle.scenarioId); }
  isReserve(u:Unit) {return this.battle.scenarioId==='wuzhang'&&u.id==='guo'&&!this.battle.events.includes('guo-arrived');}
  get selected() { return findUnit(this.battle, this.selectedId)!; }
  buyPotion(): boolean {
    if (this.gold < 100 || this.battle.potions >= 3) return false;
    this.gold -= 100; this.battle.potions++; return true;
  }
  sellPotion(): boolean {
    if (this.battle.potions <= 0) return false;
    this.gold += 50; this.battle.potions--; return true;
  }
  upgrade(kind:'assault'|'bulwark'):boolean {
    if(this.gold<300||this.battle.loadout!=='standard')return false;
    this.gold-=300;this.battle.loadout=kind;findUnit(this.battle,'sima')![kind==='assault'?'attack':'defense']+=4;return true;
  }
  deploy(point: Point) { return deployCommander(this.battle, point); }
  render() {
    const u = this.selected; const scenario=this.scenario; const hp=this.isReserve(u)?u.maxHp:u.hp;
    const roster = this.battle.units.filter(unit => unit.team !== 'enemy');
    return `<main class="preparation-screen" style="--map-ratio:${scenario.cols}/${scenario.rows};--map-cols:${scenario.cols};--map-rows:${scenario.rows}">
      <header class="prep-header"><button class="prep-header-back" data-action="prep-back" aria-label="군의로 돌아가기">${icon('back',20)}</button><h1>출진 준비</h1><span class="battle-location">${scenario.name}</span><button class="prep-gold" data-action="prep-shop" aria-label="보유 금화 ${this.gold.toLocaleString('ko-KR')}냥 · 상점 열기" title="${this.gold.toLocaleString('ko-KR')}냥">${artIcon('coin',28)}<span class="gold-balance"><small>보유 금화</small><span><b class="gold-number">${formatGold(this.gold)}</b><small class="gold-unit">냥</small></span></span><span class="gold-shop">${icon('plus',16)}</span></button></header>
      <div class="prep-columns">
        <section class="roster-panel ornate-panel" aria-label="출진 장수 목록"><h2>출진 무장 <span>${roster.filter(unit=>!this.isReserve(unit)).length} / ${roster.length}</span></h2>
          <div class="prep-roster">${roster.map(unit=>`<button class="roster-row ${unit.id===u.id?'selected':''}" data-action="prep-unit" data-unit-id="${unit.id}" aria-pressed="${unit.id===u.id}"><span class="roster-face">${unitPortrait(unit)}</span><span class="roster-name"><strong>${unit.name}</strong><span>${artIcon(unit.role==='기병'?'flag':'sword',20)}${unit.role} <small>Lv.${unit.level}</small></span><em>${this.isReserve(unit)?'3턴 지원 예정':unit.team==='player'?'필수 출진':'위군 우군'}</em></span><span class="roster-sprite">${unitSpriteHtml(unit.sprite)}</span></button>`).join('')}</div>
          <div class="prep-briefing"><span>${scenario.title}</span><strong>${scenario.objective}</strong><p>${scenario.briefing}</p><button data-action="prep-objective">${icon('scroll',18)}전투 목표 확인</button></div>
        </section>
        <section class="prep-character" aria-label="선택 장수와 장비"><div class="prep-portrait-window">${unitPortrait(u)}<div class="character-nameplate ornate-panel"><strong>${u.name}</strong><span>${artIcon('flag',24)}${u.role}</span></div></div>
          <div class="prep-vitals ornate-panel"><div class="prep-level"><strong>Lv. ${u.level}</strong><i class="prep-exp" role="progressbar" aria-label="원정 순서" aria-valuenow="${scenario.chapter}" aria-valuemin="1" aria-valuemax="9"><b style="width:${scenario.chapter/9*100}%"></b></i><span>원정 ${scenario.chapter} / 9</span></div><div class="prep-meter"><span>${icon('heart',20)}HP</span><strong>${hp} / ${u.maxHp}</strong><i><b style="width:${hp/u.maxHp*100}%"></b></i></div><div class="prep-meter mp"><span>◆ MP</span><strong>${u.mp} / ${u.maxMp}</strong><i><b style="width:${u.maxMp?100:0}%"></b></i></div></div>
          <section class="prep-equipment ornate-panel"><h2>장비</h2><div>${this.gear(u).map(item=>`<button data-action="prep-equipment" aria-label="${item.name} 장비 확인">${itemArt(item.icon,item.name)}<strong>${item.name}</strong><small>${item.effect}</small></button>`).join('')}</div></section>
        </section>
        <div class="prep-right"><section class="deployment-panel ornate-panel"><h2>출진 위치 설정</h2><button class="prep-map" style="--battle-map:url('${assetUrl(scenario.background)}')" data-action="prep-deployment" aria-label="출진 위치 변경">${roster.map((unit,index)=>this.isReserve(unit)?'':`<span class="prep-map-unit ${unit.team}" style="left:${(unit.x+.5)/scenario.cols*100}%;top:${(unit.y+.5)/scenario.rows*100}%;--sprite-x:${unit.sprite%4*100/3}%;--sprite-y:${Math.floor(unit.sprite/4)*100}%">${unitSpriteHtml(unit.sprite)}<b class="deployment-index">${index+1}</b><span>${unit.name}</span></span>`).join('')}<span class="map-caption">${this.battle.units[0].name}의 시작 위치를 정하세요 ${icon('chevron',16)}</span></button><div class="deployment-roster">${roster.map((unit,index)=>`<span><b>${index+1}</b>${unit.name}${this.isReserve(unit)?' · 지원':''}</span>`).join('')}</div></section>
          <section class="supply-panel ornate-panel"><h2>출진 보급 <span>${this.battle.choice==='protect'?scenario.protectNote:'선봉 강화'}</span></h2><div class="supply-cards"><button data-action="prep-shop">${itemArt('potion','회복약')}<strong>${this.battle.potions}<small>개</small></strong><span>회복약</span></button><button data-action="prep-equipment">${artIcon('scroll',54)}<strong>6<small>MP</small></strong><span>격려 책략</span></button><button data-action="prep-objective">${artIcon('flag',54)}<strong>${scenario.eventRound}<small>턴</small></strong><span>${scenario.eventLabel}</span></button></div></section>
        </div>
      </div>
      <footer class="prep-footer"><button class="prep-back" data-action="prep-back">${icon('back',20)}군의로</button><nav class="prep-actions" aria-label="출진 준비 메뉴"><button class="ornate-button" data-action="prep-equipment">${artIcon('armor')}장비</button><button class="ornate-button" data-action="prep-deployment">${artIcon('formation')}배치</button><button class="ornate-button" data-action="prep-shop">${artIcon('shop')}상점</button><button class="ornate-button depart" data-action="depart">${artIcon('sword',50)}출진</button></nav></footer>
    </main>`;
  }
  gear(u = this.selected) {
    const weapons: Record<string,string>={sima:'군략 부채',shi:'위군 장검',niu:'장창',guo:'철궁',hu:'지휘검'};
    return [
      {name:u.name==='사마사'?'위군 장검':weapons[u.id]??'지휘검',icon:u.id==='sima'&&u.name!=='사마사'?'fan':u.id==='guo'?'bow':u.id==='niu'?'spear':'sword',effect:`공격 ${u.attack}`},
      {name:'철갑',icon:'armor',effect:`방어 ${u.defense}`},
      {name:u.role==='기병'||u.id==='sima'?'군마':'군화',icon:u.role==='기병'||u.id==='sima'?'horse':'move',effect:`이동 ${u.movement}`},
    ];
  }
  equipmentContent() {
    const u=this.selected;
    return `<span class="modal-eyebrow">${u.name} · ${u.role}</span><h2>장비 확인</h2><div class="equipment-detail">${this.gear().map(item=>`<div class="equipment-item ornate-panel">${itemArt(item.icon,item.name)}<div><strong>${item.name}</strong><p>${item.effect}</p></div></div>`).join('')}</div><p class="modal-note">${this.scenario.name}에 지급된 기본 장비입니다. ${u.team==='ally'?'이 장수는 우군 차례에 스스로 행동합니다.':'이동 뒤 공격·책략·도구 중 하나를 사용할 수 있습니다.'}</p>`;
  }
  shopContent() {
    return `<span class="modal-eyebrow">출진 보급 · ${this.gold}냥</span><h2>상점</h2><div class="shop-item">${artIcon('potion',80)}<div><strong>회복약</strong><p>자신 또는 인접한 우군의 HP를 55 회복합니다.</p><span>보유 ${this.battle.potions} / 3개 · 구매 100냥</span></div></div><div class="shop-actions"><button class="secondary" data-action="prep-sell" ${this.battle.potions===0?'disabled':''}>1개 되팔기 · 50냥</button><button class="primary" data-action="prep-buy" ${this.gold<100||this.battle.potions>=3?'disabled':''}>${this.battle.potions>=3?'보급 완료':'1개 구매 · 100냥'}</button></div><div class="upgrade-shop"><h3>지휘관 장비 강화</h3><p>이번 원정에 공격 +4 또는 방어 +4 중 하나를 적용합니다.</p><div><button data-action="prep-assault" ${this.gold<300||this.battle.loadout!=='standard'?'disabled':''}>공격 강화 · 300냥</button><button data-action="prep-bulwark" ${this.gold<300||this.battle.loadout!=='standard'?'disabled':''}>방어 강화 · 300냥</button></div><small>${this.battle.loadout==='standard'?'한 번만 선택 가능 · 승리 2회부터 기본 지원금 300냥':this.battle.loadout==='assault'?'공격 강화 적용됨':'방어 강화 적용됨'}</small></div><p class="modal-note">승리한 원정마다 다음 출진 지원금이 50냥씩 늘어납니다. 회복약은 최대 3개까지 지참합니다.</p>`;
  }
  deploymentContent(point: Point) {
    // Show the actual three-by-three starting region, rather than an arbitrary
    // zoom of a different portion of the battlefield.
    const s=this.scenario,start=s.deployment[0];
    const mapStyle=`--battle-map:url('${assetUrl(s.background)}');background-size:${s.cols/3*100}% ${s.rows/3*100}%;background-position:${start.x/(s.cols-3)*100}% ${start.y/(s.rows-3)*100}%`;
    return `<span class="modal-eyebrow">${this.scenario.location} · 위군 시작 지역</span><h2>출진 위치 설정</h2><p class="modal-note">${this.battle.units[0].name}의 시작 위치를 선택하세요. 전열은 우군과 가깝고, 후열은 적과 거리를 둡니다.</p><div class="deployment-board" style="${mapStyle}">${this.scenario.deployment.map(p=>`<button class="${key(p)===key(point)?'selected':''}" data-action="prep-position" data-x="${p.x}" data-y="${p.y}" aria-pressed="${key(p)===key(point)}">${key(p)===key(point)?artIcon('flag',24):'<span>◇</span>'}<strong>${['왼쪽','중앙','오른쪽'][p.x-this.scenario.deployment[0].x]}</strong><small>${['전열','중열','후열'][p.y-this.scenario.deployment[0].y]}</small></button>`).join('')}</div>`;
  }
}
