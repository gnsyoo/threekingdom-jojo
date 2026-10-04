import {INTRO,ENDING} from './chronicle.ts';
import { bonusComplete, parseSave, type BattleState } from './core.ts';
import { getScenario, isScenarioId, type ScenarioId } from './scenarios.ts';

const SAVE = 'simayi-chronicle.battle.v2';
const BACKUP = 'simayi-chronicle.battle.backup.v2';
const CAMPAIGN = 'simayi-chronicle.campaign.v2';
export function loadCompleted():ScenarioId[] {
  try {
    const data=JSON.parse(localStorage.getItem(CAMPAIGN)??'[]');
    return Array.isArray(data)?[...new Set(data.filter(isScenarioId))]:[];
  }catch{return [];}
}
export function recordVictory(s:BattleState):boolean {
  if(s.outcome!=='won')return true;
  try{
    localStorage.setItem(CAMPAIGN,JSON.stringify([...new Set([...loadCompleted(),s.scenarioId])]));
    const records=loadRecords(),old=records[s.scenarioId];
    records[s.scenarioId]={stars:Math.max(old?.stars??0,missionStars(s)),turns:Math.min(old?.turns??Infinity,s.round),bonus:(old?.bonus??false)||bonusComplete(s)};
    localStorage.setItem(RECORDS,JSON.stringify(records));return true;
  }catch{return false;}
}
export function loadBattle(): { state: BattleState | null; recovered: boolean; damaged: boolean } {
  try {
    const raw = localStorage.getItem(SAVE);
    if (!raw) return { state: null, recovered: false, damaged: false };
    const current = parseSave(raw);
    if (current) return { state: current, recovered: false, damaged: false };
    const backup = localStorage.getItem(BACKUP);
    return { state: backup ? parseSave(backup) : null, recovered: !!backup && !!parseSave(backup), damaged: true };
  } catch { return { state: null, recovered: false, damaged: true }; }
}
export function saveBattle(s: BattleState): boolean {
  try {
    const previous = localStorage.getItem(SAVE);
    if (previous === JSON.stringify(s)) return true;
    if (previous && parseSave(previous)) localStorage.setItem(BACKUP, previous);
    s.savedAt = Date.now();
    localStorage.setItem(SAVE, JSON.stringify(s));
    return true;
  } catch { return false; }
}
export function exportBattle(s: BattleState) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'simayi-chronicle-save.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const RECORDS='simayi-chronicle.records.v1';
const JOURNEY='simayi-chronicle.journey.v1';
export interface MissionRecord {stars:number;turns:number;bonus:boolean}
export function loadRecords():Partial<Record<ScenarioId,MissionRecord>> {
 try{
  const raw=JSON.parse(localStorage.getItem(RECORDS)??'{}'),records:Partial<Record<ScenarioId,MissionRecord>>={};
  if(!raw||Array.isArray(raw)||typeof raw!=='object')return records;
  for(const [id,v] of Object.entries(raw) as [string,MissionRecord][]){
   if(isScenarioId(id)&&v&&Number.isInteger(v.stars)&&v.stars>=1&&v.stars<=3&&Number.isInteger(v.turns)&&v.turns>=1&&v.turns<=getScenario(id).turnLimit&&typeof v.bonus==='boolean')records[id]=v;
  }return records;
 }catch{return {};}
}
export function missionStars(s:BattleState):number {
 return s.outcome==='won'?1+Number(bonusComplete(s))+Number(s.round<=(getScenario(s.scenarioId).parTurns??getScenario(s.scenarioId).turnLimit)):0;
}
export interface Journey {
 stage:'intro'|'ending'|'story'|'preparation';scenarioId:ScenarioId;index:number;choice:'protect'|'advance'|null;
 preparation?:{battle:BattleState;gold:number;selectedId:string};
}
export function loadJourney():Journey|null {
 try {
  const j=JSON.parse(localStorage.getItem(JOURNEY)??'null');
  if(!j||!['intro','ending','story','preparation'].includes(j.stage)||!isScenarioId(j.scenarioId)||!Number.isInteger(j.index)||j.index<0||!['protect','advance',null].includes(j.choice))return null;
  const lines=j.stage==='intro'?INTRO:j.stage==='ending'?ENDING:getScenario(j.scenarioId).story;
  if(j.index>=lines.length)return null;
  if(j.stage==='preparation'){
   const p=j.preparation,b:BattleState|null=p?parseSave(JSON.stringify(p.battle)):null;
   if(!b||b.scenarioId!==j.scenarioId||b.choice!==j.choice||b.round!==1||b.phase!=='player'||b.attacksMade||b.units.some(u=>u.acted||u.moved)||!Number.isInteger(p.gold)||p.gold<0||p.gold>10000||!b.units.some(u=>u.id===p.selectedId&&u.team!=='enemy'))return null;
   j.preparation.battle=b;
  }
  return j;
 }catch{return null;}
}
export function saveJourney(j:Journey):boolean {try{localStorage.setItem(JOURNEY,JSON.stringify(j));return true;}catch{return false;}}
export function clearJourney(){try{localStorage.removeItem(JOURNEY);}catch{/* The active session remains usable. */}}
