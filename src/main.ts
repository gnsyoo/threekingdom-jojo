import './style.css';
import './concept.css';
import './campaign.css';
import { createBattle, findUnit, unitAt, inBounds, terrainAt, TERRAIN_INFO, reachable, key, canAttack, previewAttack, moveUnit, undoMove, attackUnit, waitUnit, encourage, usePotion, potionTargets, bonusComplete, endPlayerPhase, advancePhase, aiStep, parseSave, type BattleState, type Point, type Reachable, type Unit } from './core.ts';
import { loadBattle, saveBattle, exportBattle, loadCompleted, recordVictory } from './storage.ts';
import type { BattleScene, MapMode } from './battle-scene.ts';
import { icon } from './icons.ts';
import type Phaser from 'phaser';
import { portraitHtml, artIcon, assetUrl } from './art.ts';
import { Preparation } from './preparation.ts';
import { SCENARIOS, getScenario, isScenarioId, nextScenario, type ScenarioId } from './scenarios.ts';

const caoPortrait = `${import.meta.env.BASE_URL}assets/cao-cao.png`;
const root = document.querySelector<HTMLDivElement>('#app')!;
const loaded = loadBattle();
let state: BattleState = loaded.state ?? createBattle();
let hasSave = !!loaded.state;
if(loaded.state?.outcome==='won')recordVictory(loaded.state);
let screen: 'title' | 'story' | 'preparation' | 'battle' = 'title';
let renderer: Phaser.Game | null = null, scene: BattleScene | null = null;
let selectedId = 'cao', mode: MapMode = 'move', storyIndex = 0;
let savedOkay = true, aiRunning = false, generation = 0, resultShown = false;
let modalKind = '', modalReturnFocus: HTMLElement | null = null;
let pendingImport: BattleState | null = null;
let preparation: Preparation | null = null;
let pendingDeployment: Point | null = null;
let storyChoice: 'protect' | 'advance' | null = null;
let storyAuto = false, storyTimer = 0;
let storyScenario:ScenarioId='yeongcheon', threat=false;
const activeScenario=()=>getScenario(screen==='story'?storyScenario:screen==='preparation'&&preparation?preparation.battle.scenarioId:state.scenarioId);
type Decision = { kind: 'move'; point: Point; tile: Reachable } | { kind: 'attack'; targetId: string } | { kind: 'potion'; targetId:string } | { kind: 'encourage' };
let decision: Decision | null = null;
let audio: AudioContext | null = null;
const prefs = { sound: true, fast: false, grid: true };
try { const p = JSON.parse(localStorage.getItem('wei-tactics.preferences') ?? '{}'); for (const k of ['sound', 'fast', 'grid'] as const) if (typeof p[k] === 'boolean') prefs[k] = p[k]; } catch { /* Optional preferences do not block play. */ }
const esc = (s: string | number) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const actor = () => findUnit(state, 'cao')!;
const playerCanAct = () => screen === 'battle' && state.phase === 'player' && state.outcome === 'playing' && actor().hp > 0 && !actor().acted;
const actionButton = (action: string, label: string, symbol: string, extra = '') => `<button data-action="${action}" ${extra}>${artIcon(symbol)}<span>${label}</span></button>`;
const spriteStyle = (u: Unit) => `--sprite-x:${(u.sprite % 4) * 100 / 3}%;--sprite-y:${Math.floor(u.sprite / 4) * 100}%`;

function sound(kind: 'click' | 'attack' | 'heal' = 'click') {
  if (!prefs.sound) return;
  try {
    audio ??= new AudioContext(); void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.type = kind === 'attack' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(kind === 'heal' ? 620 : kind === 'attack' ? 170 : 430, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'heal' ? 900 : 120, audio.currentTime + .1);
    gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .14);
    oscillator.start(); oscillator.stop(audio.currentTime + .15);
  } catch { /* Browser sound permission must not interrupt the battle. */ }
}
function remember() {
  savedOkay = saveBattle(state); recordVictory(state); hasSave = hasSave || savedOkay;
  if (!savedOkay) toast('자동 저장을 사용할 수 없습니다. 메뉴에서 저장 파일을 내보내세요.');
}
function savePreferences() { try { localStorage.setItem('wei-tactics.preferences', JSON.stringify(prefs)); } catch { /* Session preferences still work. */ } }

function toast(message: string) {
  let node = document.querySelector<HTMLDivElement>('#toast');
  if (!node) { node = document.createElement('div'); node.id = 'toast'; node.setAttribute('role', 'status'); document.body.append(node); }
  node.textContent = message; node.classList.add('visible');
  window.clearTimeout(Number(node.dataset.timer)); node.dataset.timer = String(window.setTimeout(() => node?.classList.remove('visible'), 3200));
}

function showTitle() {
  window.clearTimeout(storyTimer); storyAuto = false;
  generation++; renderer?.destroy(true); renderer = null; scene = null;
  screen = 'title'; modalKind = ''; const scenario=getScenario(state.scenarioId); document.querySelector('#modal-layer')?.remove();
  root.innerHTML = `<main class="title-screen">
    <div class="title-vignette"></div>
    <header class="title-header"><a class="brand" href="#" aria-label="위의 군략 시작 화면"><span class="seal">魏</span><span>WEI · TACTICS</span></a><span class="chapter-number">초반 3전투 <i></i> 황건의 난 · 반동탁 연합</span></header>
    <img class="title-portrait" src="${caoPortrait}" alt="옥색 갑옷과 자주색 망토를 입은 조조" />
    <section class="title-copy">
      <div class="eyebrow"><span></span> 삼국지 전술 연대기</div>
      <h1>위의 <span>군략</span><small>魏之軍略</small></h1>
      <p class="title-quote">난세의 길을,<br />당신의 한 수로.</p>
      <p class="title-description">영천의 불길 속에서 시작되는 조조의 이야기.<br />장수를 지휘하고, 전장을 읽고, 승리를 만들어라.</p>
      <div class="title-actions">${hasSave ? `<button class="primary title-continue" data-action="continue">${icon('flag')}<span>${state.outcome === 'playing' ? '전투 이어하기' : '전투 결과 보기'}<small>${scenario.name} · ${state.round}라운드</small></span>${icon('chevron')}</button>` : ''}
      <button class="${hasSave ? 'secondary' : 'primary'}" data-action="new">${icon('sword')}<span>${hasSave ? '새로운 출진' : '영천으로 출진'}</span>${icon('chevron')}</button><button class="secondary scenario-select" data-action="scenarios">${icon('map')}<span>전투 선택</span>${icon('chevron')}</button></div>
      ${loaded.damaged ? `<p class="save-warning">${loaded.recovered ? '이전 정상 기록을 복구했습니다.' : '저장 기록을 읽지 못했습니다. 새 전투를 시작하거나 기록을 불러오세요.'}</p>` : ''}
      <button class="text-button title-import" data-action="import">${icon('save', 16)} 저장 기록 불러오기</button>
    </section>
    <footer class="title-footer"><span>영천 · 사수관 · 호로관</span><span class="title-footer-line"></span><span>격자 위에서 펼쳐지는 삼국지</span></footer>
  </main>`;
}

const storyLines=()=>getScenario(storyScenario).story;
function showStory() {
  window.clearTimeout(storyTimer);
  if (storyIndex === 2) storyAuto = false;
  screen = 'story'; const story=storyLines(),scenario=getScenario(storyScenario),s=story[storyIndex];
  root.innerHTML = `<main class="story-screen">
    <div class="story-shade"></div><header class="story-heading ornate-panel"><span>◇</span><h1>${scenario.name}의 군의</h1></header>
    <div class="story-character story-left ${s.speaker==='조조'?'speaking':''}">${portraitHtml('cao','조조')}</div>
    <div class="story-character story-right ${s.speaker==='군관'?'speaking':''}">${portraitHtml('officer','군관')}</div>
    <div class="story-dots">${story.map((_, i) => `<span class="${i <= storyIndex ? 'active' : ''}"></span>`).join('')}</div>
    ${storyIndex === 2 ? `<div class="story-choices"><button class="${storyChoice==='protect'?'selected':''}" data-action="choice-protect" aria-pressed="${storyChoice==='protect'}">${artIcon('formation')}<strong>${scenario.protectLabel}</strong><span>회복약 3개</span></button><button class="${storyChoice==='advance'?'selected':''}" data-action="choice-advance" aria-pressed="${storyChoice==='advance'}">${artIcon('sword')}<strong>선봉을 강화한다</strong><span>회복약 2개 · 첫 턴 공격 +10%</span></button></div>` : ''}
    <section class="dialogue-box"><div class="dialogue-speaker ornate-panel">${s.speaker}</div><div class="dialogue-paper ornate-panel">${storyIndex<2?`<button class="dialogue-text" data-action="story-next" aria-label="대화 다음으로">${s.line}</button>`:`<p class="dialogue-text">${s.line}</p>`}<div class="dialogue-bottom"><span>${s.note}</span>${storyIndex < 2 ? `<button class="dialogue-next" data-action="story-next" aria-label="계속">▼</button>` : `<button class="primary" data-action="choice-confirm" ${storyChoice?'':'disabled'}>출진 준비로 ${icon('chevron',18)}</button>`}</div></div><nav class="dialogue-tools" aria-label="대화 메뉴"><button class="ornate-button" data-action="story-log">${artIcon('scroll',30)}기록</button><button class="ornate-button ${storyAuto?'active':''}" data-action="story-auto" aria-pressed="${storyAuto}">${icon(storyAuto?'pause':'chevron',22)}자동</button></nav></section>
    <button class="story-back ornate-button" data-action="title">${icon('back',18)}처음 화면</button>
  </main>`;
  scheduleStory();
}
function scheduleStory() {
  window.clearTimeout(storyTimer);
  if (screen !== 'story' || !storyAuto || modalKind || document.hidden || storyIndex >= 2) return;
  storyTimer = window.setTimeout(() => { if (screen==='story' && storyAuto && !modalKind) { storyIndex++; showStory(); } }, Math.max(4000, storyLines()[storyIndex].line.length*70));
}
function beginStory(scenarioId:ScenarioId='yeongcheon') { generation++;aiRunning=false;renderer?.destroy(true);renderer=null;scene=null;storyScenario=scenarioId;preparation=null;storyChoice=null;storyIndex=0;storyAuto=false;showStory(); }
function showPreparation() {
  if (!preparation) return;
  window.clearTimeout(storyTimer); storyAuto = false;
  generation++; aiRunning = false; renderer?.destroy(true); renderer = null; scene = null;
  screen = 'preparation'; root.innerHTML = preparation.render();
}

async function mountBattle() {
  window.clearTimeout(storyTimer); storyAuto = false;
  generation++; aiRunning = false; screen = 'battle'; selectedId = 'cao'; mode = actor().moved ? 'inspect' : 'move'; decision = null; resultShown = false; threat=false;
  renderer?.destroy(true); document.querySelector('#modal-layer')?.remove(); modalKind = '';
  const scenario=getScenario(state.scenarioId);
  root.innerHTML = `<main class="game-shell">
    <header class="battle-header"><div class="chapter-meta"><h1>${scenario.title}</h1></div><div id="phase-status" aria-live="polite"></div><div class="header-actions"><button data-action="objective" class="objective-button">${icon('flag', 18)}<span>전투 목표</span></button><button data-action="sound" class="icon-button" aria-label="음향 켜기/끄기" title="음향 켜기/끄기">${icon('sound', 18)}</button><button data-action="pause" class="icon-button ornate-button" aria-label="일시 정지" title="일시 정지">${icon('pause', 18)}</button></div></header>
    <div class="battle-body"><section id="map-area" aria-label="${scenario.name} 전장">
      <div id="battlefield" role="img" aria-label="부대를 탭해 선택하고 칸을 탭해 행동을 미리 볼 수 있는 ${scenario.name} 전장"></div>
      <div class="map-note"><span class="map-dot"></span> ${scenario.location} <span class="weather">맑음</span></div>
      <div class="map-tools">${actionButton('focus', '조조', 'flag', 'title="조조에게 지도 이동"')}${actionButton('overview', '전체', 'map', 'title="전체 지도/확대 보기"')}<button data-action="zoom-in" aria-label="지도 확대">${icon('plus', 18)}</button><button data-action="zoom-out" aria-label="지도 축소">${icon('minus', 18)}</button><button data-action="grid" aria-label="격자 표시 전환" aria-pressed="${prefs.grid}">${icon('grid', 18)}</button>${scenario.id==='hulao'?'<button data-action="threat" aria-label="지휘관 위협 범위 표시" aria-pressed="false">위협</button>':''}</div>
      <div id="decision"></div><div id="map-loading"><span class="loading-spinner"></span> 전장을 펼치는 중</div>
    </section><aside id="unit-panel" aria-label="선택 부대 정보"></aside></div>
    <footer class="command-bar"><div id="command-actor"></div><div class="command-center"><div id="command-hint"></div><nav class="command-actions" aria-label="조조의 명령">${actionButton('move', '이동', 'move', 'data-shortcut="1"')}${actionButton('attack', '공격', 'sword', 'data-shortcut="2"')}${actionButton('encourage', '책략', 'scroll', 'data-shortcut="3"')}${actionButton('potion', '도구', 'potion', 'data-shortcut="4"')}${actionButton('wait', '대기', 'wait', 'data-shortcut="5"')}</nav></div><button class="end-turn" data-action="end-turn">${artIcon('flag',48)}<span>턴 종료<small>SPACE</small></span></button></footer>
    <div class="portrait-tip">가로로 돌리면 전장이 더 넓게 보입니다.</div>
  </main>`;
  const epoch = generation;
  let engine: typeof import('./battle-scene.ts');
  try { engine = await import('./battle-scene.ts'); }
  catch { toast('전장을 불러오지 못했습니다. 새로고침 후 저장된 전투를 이어갈 수 있습니다.'); return; }
  if (epoch !== generation || screen !== 'battle') return;
  scene = new engine.BattleScene(state.scenarioId);
  scene.onTile = handleTile;
  scene.onReady = () => { document.querySelector('#map-loading')?.remove(); render(); if (innerHeight < 500) scene?.centerOn(actor()); void runAi(); };
  renderer = engine.createRenderer(document.querySelector<HTMLElement>('#battlefield')!, scene);
  render();
}

function render() {
  if (screen !== 'battle') return;
  const cao = actor();
  const selected = findUnit(state, selectedId); const u = selected?.hp ? selected : cao;
  selectedId = u.id;
  const phaseText = state.outcome !== 'playing' ? '전투 종료' : state.phase === 'player' ? '아군' : state.phase === 'ally' ? '우군' : '적군';
  document.querySelector('#phase-status')!.innerHTML = `<span class="phase-pill ornate-panel ${state.phase}">${phaseText} ${state.round}턴</span><span class="round-count">제한 ${getScenario(state.scenarioId).turnLimit}턴</span>`;
  document.querySelector('#unit-panel')!.innerHTML = panel(u);
  document.querySelector('#command-actor')!.innerHTML = `<div class="commander-face"><img src="${caoPortrait}" alt="" /></div><div><strong>조조 <span>Lv.${cao.level}</span></strong><small class="${cao.acted ? 'acted' : ''}">${state.outcome !== 'playing' ? '전투 완료' : state.phase !== 'player' ? '전황 관찰' : cao.acted ? '행동 완료' : '행동 가능'}</small></div>`;
  const hint = decision?.kind === 'move' ? '경로를 확인하고 이동을 확정하세요.' : decision?.kind === 'attack' ? '피해와 반격을 확인하고 공격을 확정하세요.' : cao.acted ? '이번 행동을 마쳤습니다. 턴을 종료하세요.' : mode === 'move' ? '파란 칸을 탭하면 이동 경로를 확인합니다.' : mode === 'attack' ? '인접한 적을 선택하세요. 공격 전에는 확정이 필요합니다.' : '명령을 선택하거나 전장의 부대를 살펴보세요.';
  document.querySelector('#command-hint')!.innerHTML = `<span>${state.phase === 'player' ? hint : `우군과 ${getScenario(state.scenarioId).enemyName}이 행동 중입니다. 전황을 살펴보세요.`}</span>${state.pendingMove ? `<button data-action="undo">${icon('back', 13)} 이동 되돌리기</button>` : `<small class="save-status ${savedOkay ? '' : 'save-warning'}">${icon('save', 12)}${savedOkay ? '자동 저장' : '저장 실패'}</small>`}`;
  for (const b of document.querySelectorAll<HTMLButtonElement>('.command-actions button')) {
    b.disabled = !playerCanAct(); b.classList.toggle('active', b.dataset.action === mode);
    if (b.dataset.action === 'move') b.disabled ||= cao.moved;
    if (b.dataset.action === 'potion') { b.disabled ||= state.potions===0 || potionTargets(state).length===0; b.title=state.potions===0?'회복약이 없습니다.':potionTargets(state).length===0?'자신 또는 인접한 우군의 체력이 가득합니다.':`회복약 ${state.potions}개 · 자신 또는 인접한 우군 HP 55 회복`; }
    if (b.dataset.action === 'encourage') { b.disabled ||= cao.mp < 6 || cao.buff > 0; b.title = cao.buff > 0 ? '이미 격려 효과가 적용 중입니다.' : '격려 · MP 6 · 공격력 +10%'; }
  }
  document.querySelector<HTMLButtonElement>('[data-action="end-turn"]')!.disabled = state.phase !== 'player' || state.outcome !== 'playing';
  document.querySelector<HTMLButtonElement>('[data-action="sound"]')!.classList.toggle('muted', !prefs.sound);
  const threatButton=document.querySelector<HTMLButtonElement>('[data-action="threat"]');if(threatButton){threatButton.setAttribute('aria-pressed',String(threat));threatButton.classList.toggle('active',threat);}
  document.querySelector('#decision')!.innerHTML = decisionHtml();
  scene?.present({ state, selectedId, mode: playerCanAct() ? mode : 'inspect', reachable: mode === 'move' && !cao.moved ? reachable(state, cao) : [], preview: decision?.kind === 'move' ? decision.tile.path : [], target: decision?.kind === 'move' ? decision.point : decision?.kind === 'attack' ? findUnit(state, decision.targetId)! : null, grid: prefs.grid, fast:prefs.fast, threat });
  if (state.outcome !== 'playing' && !resultShown) {
    resultShown=true; const epoch=generation;
    void (async()=>{await wait(30);await scene?.waitForAnimations();if(epoch===generation&&screen==='battle')openModal('result');})();
  }
}

function panel(u: Unit) {
  const terrain = TERRAIN_INFO[terrainAt(u,state.scenarioId)],scenario=getScenario(state.scenarioId);
  const color = u.team === 'enemy' ? 'enemy' : u.team === 'ally' ? 'ally' : 'player';
  const portrait = (u.team !== 'enemy'||['hua','lubu'].includes(u.id)) ? portraitHtml(u.id,`${u.name} 초상`,'panel-portrait') : `<div class="panel-sprite" style="${spriteStyle(u)}"></div>`;
  const bosses = state.units.filter(e => e.boss);
  return `<div class="portrait-window ${color}"><div class="portrait-bg"></div>${portrait}<span class="faction-tag">${u.team === 'enemy' ? scenario.enemySeal : '魏'}</span><span class="portrait-caption">${u.role}</span></div>
    <div class="unit-details"><div class="unit-name"><h2>${u.name}</h2><span>Lv.${u.level}</span></div><div class="unit-subtitle"><span class="team-dot ${color}"></span>${u.team === 'enemy' ? scenario.enemyName : u.team === 'ally' ? '우군 · 자동 지휘' : '아군 · 직접 지휘'}${u.buff ? '<span class="buff-chip">격려</span>' : ''}${u.confused ? '<span class="buff-chip">혼란</span>' : ''}</div>
    <div class="meter-row"><span>HP</span><div class="meter"><i style="width:${u.hp / u.maxHp * 100}%"></i></div><small>${u.hp}<em>/${u.maxHp}</em></small></div>
    <div class="meter-row mp"><span>MP</span><div class="meter"><i style="width:${u.maxMp ? u.mp / u.maxMp * 100 : 0}%"></i></div><small>${u.mp}<em>/${u.maxMp}</em></small></div>
    <div class="unit-stats"><span>${icon('sword', 14)} 공격 <b>${Math.round(u.attack * (u.buff ? 1.1 : 1))}</b></span><span>${icon('shield', 14)} 방어 <b>${u.defense}</b></span><span>${icon('move', 14)} 이동 <b>${u.movement}</b></span></div>
    ${u.boss?`<div class="boss-power"><span>공격 ${u.attack}</span><span>방어 ${u.defense}</span><span>이동 ${u.movement}</span>${u.id==='lubu'?`<small>${state.round<3?'3턴부터 진격 · 위협 범위를 확인하세요':'여포가 진격 중입니다'}</small>`:''}</div>`:''}<div class="terrain-card ornate-panel"><div class="terrain-summary"><span class="terrain-preview" style="background-image:url('${assetUrl(scenario.background)}');background-size:${scenario.cols*100}% ${scenario.rows*100}%;background-position:${u.x/(scenario.cols-1)*100}% ${u.y/(scenario.rows-1)*100}%"></span><div><strong>${terrain.name}</strong><span>${icon('shield',15)} 방어 +${Math.round(terrain.defense*100)}%</span><span>${icon('move',15)} 이동 비용 ${terrain.cost}</span></div></div><p>${terrain.description}</p></div>
    <div class="mission-progress"><div class="section-caption">승리 조건 <span>${bosses.filter(b => !b.hp).length} / ${bosses.length}</span></div>${bosses.map(b => `<div class="boss-progress"><span class="${b.hp ? '' : 'defeated'}">${b.hp ? '◇' : '✓'} ${b.name}</span><small>${b.hp ? '퇴각 목표' : '퇴각 완료'}</small></div>`).join('')}</div>
    <div class="field-journal"><div class="section-caption">전장 기록</div><p>${esc(state.logs.at(-1) ?? '')}</p><button class="text-button" data-action="log">기록 펼치기 ${icon('chevron', 12)}</button></div></div>`;
}

function decisionHtml() {
  if (!decision) return '';
  let content = '';
  if (decision.kind === 'move') content = `<span class="decision-icon">${icon('move', 26)}</span><div><strong>이곳으로 이동</strong><p>이동 비용 ${decision.tile.cost} / ${actor().movement} · ${TERRAIN_INFO[terrainAt(decision.point,state.scenarioId)].name}</p></div>`;
  if (decision.kind === 'attack') {
    const target = findUnit(state, decision.targetId)!; const p = previewAttack(actor(), target,state.scenarioId);
    content = `<span class="decision-icon attack">${icon('sword', 26)}</span><div><strong>${target.name} 공격</strong><p>피해 <b>${p.damage}</b> · 명중 <b>${p.accuracy}%</b> · 명중 시 반격 <b>${p.counter}</b></p><small>적 HP ${target.hp} → ${Math.max(0, target.hp - p.damage)}${target.hp <= p.damage ? ' · 명중 시 퇴각' : ''}</small></div>`;
  }
  if(decision.kind==='potion'){const target=findUnit(state,decision.targetId)!;content=`<span class="decision-icon">${icon('potion',26)}</span><div><strong>${target.name}에게 회복약</strong><p>HP ${target.hp} → ${Math.min(target.maxHp,target.hp+55)} · 회복약 ${state.potions}개</p><div class="potion-targets">${potionTargets(state).map(u=>`<button class="${u.id===target.id?'selected':''}" data-action="potion-target" data-target-id="${u.id}">${u.name}</button>`).join('')}</div><small>사용하면 조조의 이번 행동이 끝납니다.</small></div>`;}
  if (decision.kind === 'encourage') content = `<span class="decision-icon">${icon('scroll', 26)}</span><div><strong>격려 · MP 6</strong><p>2라운드 동안 조조의 공격력 +10%</p><small>책략 사용으로 이번 행동이 끝납니다.</small></div>`;
  return `<div class="decision-card">${content}<div class="decision-buttons"><button class="secondary" data-action="cancel">취소</button><button class="primary" data-action="confirm">${icon('check', 16)} 확정</button></div></div>`;
}

function handleTile(p: Point) {
  if (modalKind || !inBounds(p,state.scenarioId) || state.outcome !== 'playing') return;
  const u = unitAt(state, p);
  if (!playerCanAct()) { if (u) { selectedId = u.id; render(); } return; }
  if (mode === 'move' && !actor().moved) {
    if (u?.id === 'cao') { decision = null; selectedId = 'cao'; render(); return; }
    const tile = reachable(state, actor()).find(t => key(t) === key(p));
    if (tile && tile.cost) { decision = { kind: 'move', point: p, tile }; selectedId = 'cao'; render(); return; }
  }
  if (u && u.team === 'enemy' && canAttack(state, actor(), u)) { decision = { kind: 'attack', targetId: u.id }; selectedId = 'cao'; mode = 'attack'; render(); return; }
  if (u) { selectedId = u.id; decision = null; render(); return; }
  if (mode === 'move') toast('이동 가능한 파란 칸을 선택하세요.');
}
function setMode(next: MapMode) {
  if (!playerCanAct()) return;
  if (next === 'move' && actor().moved) return;
  selectedId = 'cao'; mode = next; decision = null; sound(); render();
  if (innerHeight < 500) scene?.centerOn(actor());
}
function confirmDecision() {
  if (!decision || !playerCanAct()) return;
  const d = decision; let ok = false;
  if (d.kind === 'move') { ok = moveUnit(state, 'cao', d.point); if (ok) mode = 'inspect'; }
  if (d.kind === 'attack') { const result = attackUnit(state, 'cao', d.targetId); ok = !!result; if (result) { sound('attack'); scene?.hits(result.hits,'cao'); } }
  if (d.kind === 'potion') { ok = usePotion(state,d.targetId); if (ok) sound('heal'); }
  if (d.kind === 'encourage') { ok = encourage(state); if (ok) sound('heal'); }
  decision = null;
  if (ok) { remember(); render(); if (innerHeight < 500) scene?.centerOn(actor()); } else toast('지금은 이 행동을 할 수 없습니다.');
}

async function runAi() {
  if (aiRunning || screen !== 'battle' || state.phase === 'player' || state.outcome !== 'playing') return;
  const epoch = generation; aiRunning = true;
  try {
    while (screen === 'battle' && epoch === generation && ['ally', 'enemy'].includes(state.phase) && state.outcome === 'playing') {
      if (modalKind || document.hidden) { await wait(120); continue; }
      await scene?.waitForAnimations();
      if(epoch!==generation || screen!=='battle') break;
      if(modalKind || document.hidden) continue;
      const hadFire = state.fireTriggered, previousEvents=new Set(state.events);
      const step = aiStep(state);
      if (!step) advancePhase(state);
      remember(); render();
      if (step) { const u = findUnit(state, step.unitId); if (u && innerHeight < 500) scene?.centerOn(u); if (step.result) { scene?.hits(step.result.hits,step.unitId); sound('attack'); } }
      if (!hadFire && state.fireTriggered) toast('우군의 화공! 황건 일반 부대가 혼란에 빠졌습니다.');
      if(state.events.some(e=>!previousEvents.has(e)))toast(state.logs.at(-1)!);
      await wait(prefs.fast ? 140 : 580);
    }
  } finally {
    if (epoch === generation) { aiRunning = false; selectedId = 'cao'; mode = actor().moved ? 'inspect' : 'move'; render(); if (innerHeight < 500) scene?.centerOn(actor()); }
  }
}

function objectiveContent() {
  const scenario=activeScenario();
  return `<span class="modal-eyebrow">제${scenario.chapter}전투 · ${scenario.name}</span><h2>전투 목표</h2><div class="objective-line"><span class="objective-symbol win">${icon('flag',22)}</span><div><strong>${scenario.objective}</strong><p>적 지휘관을 퇴각시키면 승리합니다.</p></div></div><div class="objective-line"><span class="objective-symbol loss">${icon('shield',22)}</span><div><strong>조조의 퇴각 · ${scenario.turnLimit}라운드 초과</strong><p>조조를 지키고 제한 라운드 안에 목표를 달성하세요.</p></div></div><div class="objective-line"><span class="objective-symbol bonus">${icon('heart',22)}</span><div><strong>보조 목표 · ${scenario.bonus}</strong><p>${scenario.bonusNote}</p></div></div><p class="modal-note">${scenario.briefing}</p>`;
}

function openModal(kind: string) {
  window.clearTimeout(storyTimer);
  modalKind = kind;
  let body = '', footer = ''; const scenario=activeScenario();
  if (kind === 'story-log') body = `<span class="modal-eyebrow">${scenario.name}의 군의</span><h2>대화 기록</h2><ol class="journal-list">${storyLines().slice(0,storyIndex+1).map(s=>`<li><strong>${s.speaker}</strong><p>${s.line}</p></li>`).join('')}</ol>`;
  if (kind === 'prep-objective') body = objectiveContent();
  if (kind === 'prep-equipment' && preparation) body = preparation.equipmentContent();
  if (kind === 'prep-shop' && preparation) body = preparation.shopContent();
  if (kind === 'prep-deployment' && preparation) {
    pendingDeployment ??= {x:findUnit(preparation.battle,'cao')!.x,y:findUnit(preparation.battle,'cao')!.y};
    body = preparation.deploymentContent(pendingDeployment);
    footer = '<button class="secondary" data-action="close-modal">취소</button><button class="primary" data-action="prep-deploy-confirm">배치 확정</button>';
  }
  if (kind === 'objective') body = objectiveContent();
  if (kind === 'log') body = `<span class="modal-eyebrow">${scenario.title}</span><h2>전장 기록</h2><ol class="journal-list">${state.logs.map(l => `<li>${esc(l)}</li>`).join('')}</ol>`;
  if (kind === 'pause') {
    body = `<span class="modal-eyebrow">${scenario.title} · ${state.round}라운드</span><h2>잠시 전열을 정비하다</h2><p class="modal-note">${savedOkay ? '현재까지의 행동이 자동으로 저장됐습니다.' : '자동 저장에 실패했습니다. 저장 파일을 내보내 기록을 보관하세요.'}</p>
    <div class="settings-row"><span>전투 속도</span><div class="segmented"><button data-action="speed-normal" class="${prefs.fast ? '' : 'selected'}">일반</button><button data-action="speed-fast" class="${prefs.fast ? 'selected' : ''}">빠르게</button></div></div>
    <div class="settings-row"><span>효과음</span><button class="toggle ${prefs.sound ? 'on' : ''}" data-action="sound" aria-pressed="${prefs.sound}">${prefs.sound ? '켜짐' : '꺼짐'}</button></div>
    <div class="settings-row"><span>전장 격자</span><button class="toggle ${prefs.grid ? 'on' : ''}" data-action="grid" aria-pressed="${prefs.grid}">${prefs.grid ? '표시' : '숨김'}</button></div>
    <div class="save-actions"><button class="secondary" data-action="export">${icon('save', 18)} 저장 파일 내보내기</button><button class="secondary" data-action="import">${icon('scroll', 18)} 저장 파일 불러오기</button></div>`;
    footer = `<button class="text-button" data-action="title">${icon('back', 16)} 처음 화면</button><button class="primary" data-action="close-modal">전투 계속</button>`;
  }
  if (kind === 'end-turn') { body = `<span class="modal-eyebrow">조조 · 행동 가능</span><h2>이번 차례를 마칠까요?</h2><p class="modal-note">조조가 아직 행동하지 않았습니다. 턴을 종료하면 우군과 적군이 움직입니다.${state.pendingMove ? ' 현재 이동은 확정됩니다.' : ''}</p>`; footer = '<button class="secondary" data-action="close-modal">취소</button><button class="primary" data-action="end-confirm">턴 종료</button>'; }
  if (kind === 'new') { body = '<span class="modal-eyebrow">새로운 출진</span><h2>영천의 이야기를 다시 시작합니다</h2><p class="modal-note">현재 전투 기록 대신 새 전투가 저장됩니다. 필요하면 먼저 저장 파일을 내보내세요.</p>'; footer = '<button class="secondary" data-action="close-modal">취소</button><button class="primary" data-action="new-confirm">새로 시작</button>'; }
  if (kind === 'import-confirm' && pendingImport) { body = `<span class="modal-eyebrow">저장 기록</span><h2>${getScenario(pendingImport.scenarioId).name} · ${pendingImport.round}라운드</h2><p class="modal-note">확인한 기록을 불러오고 현재 전투를 교체합니다. 조조 HP ${findUnit(pendingImport, 'cao')!.hp}, 회복약 ${pendingImport.potions}개.</p>`; footer = '<button class="secondary" data-action="close-modal">취소</button><button class="primary" data-action="import-confirm">기록 불러오기</button>'; }
  if(kind==='scenarios') {
    const completed=loadCompleted();
    body=`<span class="modal-eyebrow">조조의 전술 연대기 · 3개 전투</span><h2>전투 선택</h2><div class="scenario-list">${SCENARIOS.map(s=>`<button class="scenario-card" data-action="scenario-pick" data-scenario-id="${s.id}"><img src="${assetUrl(s.background)}" alt="${s.name} 전장"/><small>제${s.chapter}전투 · ${s.year}년</small><strong>${s.title}</strong><span>${s.objective}<br>${s.cols}×${s.rows} · 제한 ${s.turnLimit}턴</span><em>${completed.includes(s.id)?'✓ 승리 기록':'출진 가능'}</em></button>`).join('')}</div><p class="modal-note">각 전투를 바로 시작할 수 있습니다. 출진을 확정하면 현재 전투 기록이 교체됩니다.</p>`;
  }
  if (kind === 'result') {
    const won=state.outcome==='won',bosses=state.units.filter(u=>u.boss),bonus=bonusComplete(state),next=nextScenario(state.scenarioId);
    body=`<span class="modal-eyebrow">${scenario.name} · 전투 종료</span><div class="result-seal ${won?'won':'lost'}">${won?'勝':'退'}</div><h2 class="result-title">${scenario.title} ${won?'승리':'패배'}</h2><p class="result-quote">${won?'“길을 읽고, 함께 싸운다.”':actor().hp===0?'조조가 전장에서 퇴각했습니다.':'제한 라운드 안에 지휘관을 제압하지 못했습니다.'}</p><div class="result-metrics"><div><strong>${state.round}</strong><span>소요 라운드</span></div><div><strong>${state.attacksMade}</strong><span>조조의 공격</span></div><div><strong>${bosses.filter(u=>!u.hp).length}/${bosses.length}</strong><span>지휘관 퇴각</span></div></div><div class="result-objective"><span>${bonus?'✓':'◇'} ${scenario.bonus}</span><strong>${bonus?'완료':'미완료'}</strong></div><p class="modal-note">${won?scenario.victory:'위치와 회복 시점을 바꿔 다시 도전해 보세요.'}</p>`;
    footer=`<button class="secondary" data-action="title">처음 화면</button>${won?next?`<button class="primary" data-action="next-battle">${next.name}으로 진군 ${icon('chevron',18)}</button>`:'<button class="primary" data-action="scenarios">전투 선택</button>':'<button class="primary" data-action="restart">다시 출진</button>'}`;
  }
  if (!footer) footer = `<button class="primary" data-action="close-modal">${kind === 'objective' ? '전장으로' : '닫기'} ${icon('chevron', 16)}</button>`;
  modalReturnFocus = document.activeElement as HTMLElement;
  let layer = document.querySelector<HTMLDivElement>('#modal-layer');
  if (!layer) { layer = document.createElement('div'); layer.id = 'modal-layer'; document.body.append(layer); }
  layer.innerHTML = `<div class="modal-scrim"></div><section class="modal ${kind === 'result' ? 'result-modal' : ''}" role="dialog" aria-modal="true" aria-label="${kind === 'result' ? '전투 결과' : '전투 메뉴'}" tabindex="-1"><button class="modal-close" data-action="close-modal" aria-label="닫기">×</button><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div></section>`;
  const dialog = layer.querySelector<HTMLElement>('.modal');
  dialog?.focus({ preventScroll: true });
  if (dialog) dialog.scrollTop = 0;
}
function closeModal() { modalKind = ''; pendingDeployment = null; document.querySelector('#modal-layer')?.remove(); if (modalReturnFocus?.isConnected) modalReturnFocus.focus(); scheduleStory(); }
function startPhase() { closeModal(); decision = null; if (endPlayerPhase(state)) { remember(); render(); void runAi(); } }

function chooseImport() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 100_000) { toast('저장 파일이 너무 큽니다. 게임에서 내보낸 기록을 선택하세요.'); return; }
    try { pendingImport = parseSave(await file.text()); if (!pendingImport) { toast('이 게임의 올바른 저장 기록이 아닙니다.'); return; } openModal('import-confirm'); } catch { toast('저장 파일을 읽지 못했습니다.'); }
  };
  input.click();
}

document.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
  if (!button || button.disabled) return;
  const a = button.dataset.action;
  if (a === 'new') { if (hasSave) openModal('new'); else beginStory(); }
  if (a === 'new-confirm') { closeModal(); beginStory(); }
  if (a === 'continue') mountBattle();
  if (a === 'title') { if (screen === 'battle') remember(); closeModal(); showTitle(); }
  if (a === 'story-next' && screen==='story' && storyIndex<2) { storyIndex++; sound(); showStory(); }
  if (a === 'story-auto' && screen==='story') { storyAuto = storyIndex<2 && !storyAuto; showStory(); }
  if (a === 'story-log' && screen==='story') openModal(a);
  if ((a === 'choice-protect' || a === 'choice-advance') && screen==='story') { storyChoice = a === 'choice-protect' ? 'protect' : 'advance'; sound(); showStory(); }
  if (a === 'choice-confirm' && screen==='story' && storyChoice) { if(!preparation || preparation.battle.choice!==storyChoice || preparation.battle.scenarioId!==storyScenario) preparation = new Preparation(storyChoice,storyScenario); sound(); showPreparation(); }
  if (a === 'prep-back' && screen==='preparation') { storyIndex=2; showStory(); }
  if (a === 'prep-unit' && preparation && screen==='preparation' && preparation.battle.units.some(u=>u.team!=='enemy'&&u.id===button.dataset.unitId)) { preparation.selectedId=button.dataset.unitId!; showPreparation(); sound(); }
  if ((a === 'prep-equipment' || a === 'prep-shop' || a === 'prep-deployment' || a === 'prep-objective') && screen==='preparation') openModal(a);
  if ((a === 'prep-buy' || a === 'prep-sell') && preparation && screen==='preparation') { if (a==='prep-buy'?preparation.buyPotion():preparation.sellPotion()) { showPreparation(); openModal('prep-shop'); sound(); } }
  if (a === 'prep-position' && screen==='preparation' && modalKind==='prep-deployment') { pendingDeployment={x:Number(button.dataset.x),y:Number(button.dataset.y)}; openModal('prep-deployment'); }
  if (a === 'prep-deploy-confirm' && preparation && pendingDeployment && screen==='preparation') { if (preparation.deploy(pendingDeployment)) { closeModal(); showPreparation(); sound(); } }
  if (a === 'depart' && preparation && screen==='preparation') { state=structuredClone(preparation.battle); remember(); sound(); mountBattle(); }
  if (a === 'restart') { closeModal(); storyScenario=state.scenarioId;storyChoice=state.choice;preparation = new Preparation(state.choice,state.scenarioId); showPreparation(); }
  if (a === 'move' || a === 'attack') setMode(a);
  if (a === 'confirm') confirmDecision();
  if (a === 'cancel') { decision = null; sound(); render(); }
  if (a === 'undo' && undoMove(state)) { decision = null; mode = 'move'; remember(); render(); }
  if(a==='potion'&&playerCanAct()){const target=potionTargets(state)[0];if(target){selectedId='cao';decision={kind:'potion',targetId:target.id};sound();render();}}
  if(a==='encourage'&&playerCanAct()){selectedId='cao';decision={kind:'encourage'};sound();render();}
  if(a==='potion-target'&&decision?.kind==='potion'&&potionTargets(state).some(u=>u.id===button.dataset.targetId)){decision.targetId=button.dataset.targetId!;render();}
  if (a === 'wait' && waitUnit(state, 'cao')) { decision = null; remember(); render(); sound(); }
  if (a === 'end-turn') { if (playerCanAct()) openModal('end-turn'); else startPhase(); }
  if (a === 'end-confirm') startPhase();
  if (a === 'pause' || a === 'objective' || a === 'log') openModal(a);
  if (a === 'close-modal') closeModal();
  if (a === 'focus') { selectedId = 'cao'; scene?.centerOn(actor()); render(); }
  if(a==='scenarios')openModal('scenarios');
  if(a==='scenario-pick'&&isScenarioId(button.dataset.scenarioId)){closeModal();beginStory(button.dataset.scenarioId);}
  if(a==='next-battle'&&state.outcome==='won'){const next=nextScenario(state.scenarioId);if(next){closeModal();beginStory(next.id);}}
  if(a==='threat'){threat=!threat;render();}
  if (a === 'overview') scene?.toggleOverview();
  if (a === 'zoom-in') scene?.zoom(.12);
  if (a === 'zoom-out') scene?.zoom(-.12);
  if (a === 'grid') { prefs.grid = !prefs.grid; savePreferences(); render(); if (modalKind === 'pause') openModal('pause'); }
  if (a === 'sound') { prefs.sound = !prefs.sound; savePreferences(); sound(); if (screen === 'battle') render(); if (modalKind === 'pause') openModal('pause'); }
  if (a === 'speed-normal' || a === 'speed-fast') { prefs.fast = a === 'speed-fast'; savePreferences(); openModal('pause'); }
  if (a === 'export') { exportBattle(state); toast('현재 전투 기록을 내보냈습니다.'); }
  if (a === 'import') chooseImport();
  if (a === 'import-confirm' && pendingImport) { closeModal(); state = pendingImport; pendingImport = null; remember(); mountBattle(); }
});
document.addEventListener('keydown', e => {
  if (modalKind) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Tab') {
      const items = [...document.querySelectorAll<HTMLElement>('#modal-layer button:not(:disabled)')];
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    return;
  }
  if (screen !== 'battle') return;
  if (e.key === 'Escape') { if (decision) { decision = null; render(); } else openModal('pause'); }
  const mapping: Record<string, string> = { '1': 'move', '2': 'attack', '3': 'encourage', '4': 'potion', '5': 'wait', ' ': 'end-turn' };
  if (mapping[e.key]) { e.preventDefault(); document.querySelector<HTMLButtonElement>(`[data-action="${mapping[e.key]}"]`)?.click(); }
});
document.addEventListener('visibilitychange', () => { if (screen === 'battle' && document.hidden) remember(); if(screen==='story') { if(document.hidden) window.clearTimeout(storyTimer); else scheduleStory(); } });
window.addEventListener('pagehide', () => { if (screen === 'battle') remember(); });

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__WEI_DEBUG__ = { state: () => structuredClone(state), tile: (point: Point) => scene?.tileToScreen(point), ready: () => !!scene && !document.querySelector('#map-loading'), motion:()=>scene?.motionSnapshot() };
}
showTitle();
