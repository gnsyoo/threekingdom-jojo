import { createBattle, findUnit, deployCommander, key, type BattleState, type Point, type Unit } from './core.ts';
import { portraitHtml, artIcon, itemArt, assetUrl } from './art.ts';
import { icon } from './icons.ts';
import { getScenario, type ScenarioId } from './scenarios.ts';

export class Preparation {
  readonly battle: BattleState;
  gold = 200;
  selectedId = 'cao';
  constructor(choice: 'protect' | 'advance',scenarioId:ScenarioId='yeongcheon') { this.battle=createBattle(choice,getScenario(scenarioId).year,scenarioId); }
  get scenario() { return getScenario(this.battle.scenarioId); }
  isReserve(u:Unit) {return this.battle.scenarioId==='sishui'&&u.id==='guan'&&!this.battle.events.includes('guan-arrived');}
  get selected() { return findUnit(this.battle, this.selectedId)!; }
  buyPotion(): boolean {
    if (this.gold < 100 || this.battle.potions >= 3) return false;
    this.gold -= 100; this.battle.potions++; return true;
  }
  sellPotion(): boolean {
    if (this.battle.potions <= 0) return false;
    this.gold += 50; this.battle.potions--; return true;
  }
  deploy(point: Point) { return deployCommander(this.battle, point); }
  render() {
    const u = this.selected; const scenario=this.scenario; const hp=this.isReserve(u)?u.maxHp:u.hp;
    const roster = this.battle.units.filter(unit => unit.team !== 'enemy');
    return `<main class="preparation-screen">
      <header class="prep-header"><h1 class="ornate-panel">출진 준비</h1><span class="battle-location ornate-panel">${scenario.name}</span><button class="prep-gold ornate-panel" data-action="prep-shop" aria-label="상점 열기">${artIcon('coin',32)}<span>${this.gold.toLocaleString()}<small>냥</small></span>${icon('plus',20)}</button></header>
      <div class="prep-columns">
        <section class="roster-panel ornate-panel" aria-label="출진 장수 목록"><h2>출진 무장 <span>${roster.filter(unit=>!this.isReserve(unit)).length} / ${roster.length}</span></h2>
          <div class="prep-roster">${roster.map(unit=>`<button class="roster-row ${unit.id===u.id?'selected':''}" data-action="prep-unit" data-unit-id="${unit.id}" aria-pressed="${unit.id===u.id}"><span class="roster-face">${portraitHtml(unit.id,unit.name)}</span><span class="roster-name"><strong>${unit.name}</strong><span>${artIcon(unit.role==='기병'?'flag':'sword',20)}${unit.role} <small>Lv.${unit.level}</small></span><em>${this.isReserve(unit)?'3턴 지원 예정':unit.team==='player'?'필수 출진':'연합 우군'}</em></span><span class="roster-sprite" style="--sprite-x:${unit.sprite%4*100/3}%;--sprite-y:${Math.floor(unit.sprite/4)*100}%"></span></button>`).join('')}</div>
          <div class="prep-briefing"><span>${scenario.title}</span><strong>${scenario.objective}</strong><p>${scenario.briefing}</p><button data-action="prep-objective">${icon('scroll',18)}전투 목표 확인</button></div>
        </section>
        <section class="prep-character" aria-label="선택 장수와 장비"><div class="prep-portrait-window">${portraitHtml(u.id,u.name)}<div class="character-nameplate ornate-panel"><strong>${u.name}</strong><span>${artIcon('flag',24)}${u.role}</span></div></div>
          <div class="prep-vitals ornate-panel"><div class="prep-level"><strong>Lv. ${u.level}</strong><i class="prep-exp"><b></b></i><span>EXP 0 / 1000</span></div><div class="prep-meter"><span>${icon('heart',20)}HP</span><strong>${hp} / ${u.maxHp}</strong><i><b style="width:${hp/u.maxHp*100}%"></b></i></div><div class="prep-meter mp"><span>◆ MP</span><strong>${u.mp} / ${u.maxMp}</strong><i><b style="width:${u.maxMp?100:0}%"></b></i></div></div>
          <section class="prep-equipment ornate-panel"><h2>장비</h2><div>${this.gear(u).map(item=>`<button data-action="prep-equipment" aria-label="${item.name} 장비 확인">${itemArt(item.icon,item.name)}<strong>${item.name}</strong><small>${item.effect}</small></button>`).join('')}</div></section>
        </section>
        <div class="prep-right"><section class="deployment-panel ornate-panel"><h2>출진 위치 설정</h2><button class="prep-map" style="--battle-map:url('${assetUrl(scenario.background)}')" data-action="prep-deployment" aria-label="출진 위치 변경">${roster.map((unit,index)=>this.isReserve(unit)?'':`<span class="prep-map-unit ${unit.team}" style="left:${(unit.x+.5)/scenario.cols*100}%;top:${(unit.y+.5)/scenario.rows*100}%;--sprite-x:${unit.sprite%4*100/3}%;--sprite-y:${Math.floor(unit.sprite/4)*100}%"><b class="deployment-index">${index+1}</b><span>${unit.name}</span></span>`).join('')}<span class="map-caption">조조의 시작 위치를 정하세요 ${icon('chevron',16)}</span></button></section>
          <section class="supply-panel ornate-panel"><h2>출진 보급 <span>${this.battle.choice==='protect'?scenario.protectNote:'선봉 강화'}</span></h2><div class="supply-cards"><button data-action="prep-shop">${itemArt('potion','회복약')}<strong>${this.battle.potions}<small>개</small></strong><span>회복약</span></button><button data-action="prep-equipment">${artIcon('scroll',54)}<strong>6<small>MP</small></strong><span>격려 책략</span></button><button data-action="prep-objective">${artIcon('flag',54)}<strong>${scenario.eventRound}<small>턴</small></strong><span>${scenario.eventLabel}</span></button></div></section>
        </div>
      </div>
      <footer class="prep-footer"><button class="prep-back" data-action="prep-back">${icon('back',20)}군의로</button><nav class="prep-actions" aria-label="출진 준비 메뉴"><button class="ornate-button" data-action="prep-equipment">${artIcon('armor')}장비</button><button class="ornate-button" data-action="prep-deployment">${artIcon('formation')}배치</button><button class="ornate-button" data-action="prep-shop">${artIcon('shop')}상점</button><button class="ornate-button depart" data-action="depart">${artIcon('sword',50)}출진</button></nav></footer>
    </main>`;
  }
  gear(u = this.selected) {
    const weapons: Record<string,string>={cao:'철검',liu:'쌍검',guan:'청룡도',zhang:'사모',sun:'고정도'};
    return [
      {name:weapons[u.id],icon:'sword',effect:`공격 ${u.attack}`},
      {name:'철갑',icon:'armor',effect:`방어 ${u.defense}`},
      {name:u.role==='기병'||u.id==='cao'?'군마':'군화',icon:u.role==='기병'||u.id==='cao'?'horse':'move',effect:`이동 ${u.movement}`},
    ];
  }
  equipmentContent() {
    const u=this.selected;
    return `<span class="modal-eyebrow">${u.name} · ${u.role}</span><h2>장비 확인</h2><div class="equipment-detail">${this.gear().map(item=>`<div class="equipment-item ornate-panel">${itemArt(item.icon,item.name)}<div><strong>${item.name}</strong><p>${item.effect}</p></div></div>`).join('')}</div><p class="modal-note">${this.scenario.name}에 지급된 기본 장비입니다. ${u.team==='ally'?'이 장수는 우군 차례에 스스로 행동합니다.':'이동 뒤 공격·책략·도구 중 하나를 사용할 수 있습니다.'}</p>`;
  }
  shopContent() {
    return `<span class="modal-eyebrow">출진 보급 · ${this.gold}냥</span><h2>상점</h2><div class="shop-item">${artIcon('potion',80)}<div><strong>회복약</strong><p>자신 또는 인접한 우군의 HP를 55 회복합니다.</p><span>보유 ${this.battle.potions} / 3개 · 구매 100냥</span></div></div><div class="shop-actions"><button class="secondary" data-action="prep-sell" ${this.battle.potions===0?'disabled':''}>1개 되팔기 · 50냥</button><button class="primary" data-action="prep-buy" ${this.gold<100||this.battle.potions>=3?'disabled':''}>${this.battle.potions>=3?'보급 완료':'1개 구매 · 100냥'}</button></div><p class="modal-note">${this.scenario.name} 출진 지원금은 200냥입니다. 회복약은 최대 3개까지 지참합니다.</p>`;
  }
  deploymentContent(point: Point) {
    return `<span class="modal-eyebrow">${this.scenario.location} · 관군 시작 지역</span><h2>출진 위치 설정</h2><p class="modal-note">조조의 시작 위치를 선택하세요. 전열은 우군과 가깝고, 후열은 적과 거리를 둡니다.</p><div class="deployment-board" style="--battle-map:url('${assetUrl(this.scenario.background)}')">${this.scenario.deployment.map(p=>`<button class="${key(p)===key(point)?'selected':''}" data-action="prep-position" data-x="${p.x}" data-y="${p.y}" aria-pressed="${key(p)===key(point)}">${key(p)===key(point)?artIcon('flag',24):'<span>◇</span>'}<strong>${['왼쪽','중앙','오른쪽'][p.x-this.scenario.deployment[0].x]}</strong><small>${['전열','중열','후열'][p.y-this.scenario.deployment[0].y]}</small></button>`).join('')}</div>`;
  }
}
