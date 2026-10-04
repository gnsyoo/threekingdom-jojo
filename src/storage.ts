import { parseSave, type BattleState } from './core.ts';
import { isScenarioId, type ScenarioId } from './scenarios.ts';

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
  try{localStorage.setItem(CAMPAIGN,JSON.stringify([...new Set([...loadCompleted(),s.scenarioId])]));return true;}catch{return false;}
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
