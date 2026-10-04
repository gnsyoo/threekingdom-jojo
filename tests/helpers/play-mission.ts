import {createBattle,findUnit,reachable,distance,terrainAt,TERRAIN_INFO,canAttack,attackUnit,moveUnit,waitUnit,usePotion,endPlayerPhase,advancePhase,aiStep,setTactic,parseSave,type BattleState,type Point} from '../../src/core.ts';
import {getScenario,type ScenarioId,type Choice} from '../../src/scenarios.ts';
/** Tactical test pilot. It only uses public rule actions; no HP, position or outcome injection. */
export function chooseAction(s:BattleState):{move?:Point;attack?:string;heal?:boolean} {
 const u=findUnit(s,'sima')!,scenario=getScenario(s.scenarioId),enemies=s.units.filter(u=>u.team==='enemy'&&u.hp>0);
 if(u.hp<u.maxHp*.45&&s.potions)return {heal:true};
 const goals=scenario.checkpoints?.filter(p=>!s.objectives.includes(p.id));
 const target=goals?.[0];
 const distances=new Map<string,number>();
 if(target){
  const queue=[{...target,cost:0}];
  while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const p=queue.shift()!,k=`${p.x},${p.y}`;if(distances.has(k))continue;distances.set(k,p.cost);
   for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const next={x:p.x+d.x,y:p.y+d.y};const cost=TERRAIN_INFO[terrainAt(next,s.scenarioId)].cost;if(Number.isFinite(cost)&&!distances.has(`${next.x},${next.y}`))queue.push({...next,cost:p.cost+cost});}
  }
 }
 const options=reachable(s,u);let move:Point|undefined;
 if(target){options.sort((a,b)=>(distances.get(`${a.x},${a.y}`)??1e6)-(distances.get(`${b.x},${b.y}`)??1e6)||a.cost-b.cost);if(options[0]&&distance(options[0],u))move=options[0];}
 else if(scenario.goal==='defeat'&&!enemies.some(e=>canAttack(s,u,e))){options.sort((a,b)=>Math.min(...enemies.map(e=>distance(a,e)))-Math.min(...enemies.map(e=>distance(b,e)))||a.cost-b.cost);if(options[0]&&distance(options[0],u))move=options[0];}
 const at=move?{...u,...move}:u;
 if(target&&distance(at,target)===0)return {move};
 const enemy=enemies.filter(e=>distance(at,e)>=u.range[0]&&distance(at,e)<=u.range[1]).sort((a,b)=>a.hp-b.hp)[0];
 return {move,attack:scenario.bonusRule==='noCombat'?undefined:enemy?.id};
}
export function playMission(id:ScenarioId,choice:Choice='protect',seed=190):BattleState {
 let s=createBattle(choice,seed,id);setTactic(s,getScenario(id).goal==='escape'?'guard':'advance');let steps=0;
 while(s.outcome==='playing'){
  const action=chooseAction(s);
  if(action.heal)usePotion(s);else{if(action.move)moveUnit(s,'sima',action.move);if(action.attack&&canAttack(s,findUnit(s,'sima')!,findUnit(s,action.attack)!))attackUnit(s,'sima',action.attack);else waitUnit(s,'sima');}
  const playerSave=parseSave(JSON.stringify(s));if(!playerSave)throw new Error(`${id}: player state cannot resume: ${s.logs.join('\n')}`);s=playerSave;
  if(s.outcome!=='playing')break;endPlayerPhase(s);
  while(s.phase!=='player'&&s.outcome==='playing'){
   if(!aiStep(s))advancePhase(s);if(++steps>500)throw new Error(`${id}: AI does not terminate`);
   const restored=parseSave(JSON.stringify(s));if(!restored)throw new Error(`${id}: cannot resume round ${s.round}: ${s.logs.join('\n')}`);s=restored;
  }
 }
 return s;
}
