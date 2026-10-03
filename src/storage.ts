import { parseSave, type BattleState } from './core.ts';

const SAVE = 'wei-tactics.battle.v1';
const BACKUP = 'wei-tactics.battle.backup.v1';
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
  const a = document.createElement('a'); a.href = url; a.download = 'wei-tactics-save.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
