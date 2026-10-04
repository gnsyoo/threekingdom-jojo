import type {Scenario,ScenarioId} from './scenarios.ts';
import type {Point,Terrain} from './core.ts';
import {board,deployment,line} from './scenario-kit.ts';

/** Fortified tactical episodes, not additional claims about historical city captures. */
export interface Siege {
 mode:'assault'|'defense'|'encirclement'; fortress:string; material:'stone'|'timber';
 gates:Point[]; walls:Point[]; description:string;
}
interface Design {id:ScenarioId; mode:Siege['mode']; fortress:string; material:Siege['material']; order:string; report:string;lanes?:1|2;postern?:number[];}
export const SIEGE_DESIGNS:Design[]=[
 {id:'shangyong-03',mode:'defense',fortress:'신성 보급 성채',material:'timber',order:'보급 성채의 문과 성벽 뒤에서 전열을 지켜라. 본대의 급행군이 멈추지 않도록 군량을 보존한다.',report:'성채에서 보급 대열을 지켜 신성 급습을 이어갈 준비를 마쳤다.',lanes:2},
 {id:'shangyong-04',mode:'assault',fortress:'신성 외곽 보루',material:'stone',order:'신성 외곽 보루의 성문으로 진입해 전초 지휘대를 제압하라. 본성의 내응을 기다리며 포위할 자리를 넓힌다.',report:'외곽 보루의 전초 지휘를 끊었다. 신성 본성의 성문은 내응으로 열어야 한다.',lanes:1},
 {id:'shangyong-05',mode:'encirclement',fortress:'신성 북문',material:'stone',order:'북문 밖 연락점과 포위 합류점을 확보하라. 성을 먼저 함락했다고 보고하지 말고 내응을 확인한다.',report:'북문 밖 연락점과 포위 합류점을 확보했다. 신성은 아직 맹달의 지휘 아래 있다.',lanes:2},
 {id:'shangyong',mode:'assault',fortress:'신성',material:'stone',order:'신의·신탐과 이보·등현의 호응을 이용해 성문으로 진입하라. 맹달의 지휘를 끊고 신성을 수습한다.',report:''},
 {id:'qishan-01',mode:'encirclement',fortress:'기산 전선 보루',material:'stone',order:'보루 앞 관측점과 성문 연락점을 차례로 확보하라. 성채를 이용해 부대를 묶고 함부로 깊이 나가지 않는다.',report:'보루 앞 거점과 연락점을 확보해 기산 방어선의 전열을 연결했다.'},
 {id:'qishan-02',mode:'defense',fortress:'기산 군량 성채',material:'timber',order:'군량 성채를 지켜라. 성문은 좁고 성벽 뒤 통로는 방어에 유리하다. 우군을 모두 밖으로 보내지 마라.',report:'군량 성채와 성문 안쪽 전열을 지켰다. 방어선의 보급을 유지했다.'},
 {id:'qishan',mode:'defense',fortress:'기산 위군 보루',material:'stone',order:'성문과 보루 안쪽에서 사마의를 지키며 여섯 턴까지 버텨라. 촉군이 물러가도 깊이 추격하지 않는다.',report:'',postern:[2,3,4]},
 {id:'wuzhang-03',mode:'defense',fortress:'위수 북안 군량 성채',material:'timber',order:'북안 군량 성채의 좁은 성문과 성벽 통로를 이용해 버텨라. 남쪽 진영을 잃은 뒤 남은 보급을 지킨다.',report:'북안 군량 성채를 지켜 긴 대치에 필요한 보급을 남겼다.',lanes:2,postern:[2,3,4]},
 {id:'wuzhang',mode:'defense',fortress:'위수 북쪽 보루',material:'stone',order:'북쪽 보루를 지키며 여덟 턴까지 기다려라. 제갈량의 도발에도 성문 밖 깊은 추격은 허락하지 않는다.',report:'',postern:[3]},
 {id:'liaodong-02',mode:'encirclement',fortress:'요수 목책 성채',material:'timber',order:'목책 앞에서 지휘관을 지키며 다섯 턴까지 적을 묶어 두어라. 본대가 우회할 시간을 벌며 요수 주진에 매달리지 않는다.',report:'목책 앞 전열을 유지해 본대가 우회할 시간을 벌었다. 사마의는 요수 주진을 함락했다고 주장하지 않고 양평으로 향한다.'},
 {id:'liaodong-05',mode:'defense',fortress:'양평 포위 성채',material:'timber',order:'장마 속에서도 포위 성채를 옮기지 마라. 출격하는 적을 좁은 문으로 받아내고 비가 그칠 때까지 군량을 지킨다.',report:'장마와 적의 출격을 견디며 포위 성채와 군량을 유지했다. 양평성은 아직 함락되지 않았다.'},
 {id:'liaodong-06',mode:'encirclement',fortress:'양평 동남문',material:'stone',order:'양평 동남문 바깥의 탈출 길목과 포위 합류점을 확보하라. 성안으로 무리하게 들어가지 말고 공손연이 달아날 길을 막는다.',report:'양평 동남문 바깥의 탈출 길목을 막았다. 비가 그치면 본성 공략으로 이어간다.'},
 {id:'liaodong',mode:'assault',fortress:'양평성',material:'stone',order:'비가 그쳤다. 운제와 토산으로 성을 압박하고 성문의 통로를 이용하라. 공손연과 비연의 지휘를 끊고 탈출을 막는다.',report:''},
 {id:'yangping-02',mode:'assault',fortress:'곡산 전초 성채',material:'stone',order:'곡산으로 이어지는 전초 성채의 좁은 문으로 나아가 지휘대를 제압하라. 구안의 항복은 아직 일어나지 않았다.',report:'곡산 전초 성채의 지휘를 끊어 보급 차단을 뒷받침했다. 구안은 여전히 구원을 기다린다.'},
 {id:'yangping-04',mode:'defense',fortress:'양평관 후위 보루',material:'stone',order:'후위 보루와 좁은 성문을 지켜 본대와의 연락을 유지하라. 전방에서 무슨 일이 일어날지 아직 단정하지 마라.',report:'후위 보루의 전열을 지켰다. 본대가 향하는 양평관 길의 매복은 아직 드러나지 않았다.',postern:[3]},
];
export const siegeModeName=(mode:Siege['mode'])=>mode==='assault'?'공성 돌파':mode==='defense'?'성채 방어':'포위 공방';

export function applySieges(scenarios:Scenario[]):void {
 for(const d of SIEGE_DESIGNS){
  const s=scenarios.find(s=>s.id===d.id)!;
  const defense=d.mode==='defense',wide=s.cols>18;
  const wallX=defense?(wide?10:8):(wide?13:9),top=1,bottom=s.rows-2;
  const gateY=Math.floor(s.rows/2),gates=Array.from({length:d.lanes??1},(_,i)=>({x:wallX,y:gateY+i}));
  if(defense)for(const x of d.postern??(d.material==='timber'?[3,4]:[]))gates.push({x,y:bottom});
  const edge=defense?0:s.cols-1;
  const walls:Point[]=[];
  s.terrain=board(s.cols,s.rows,p=>{
   const inside=defense?p.x<wallX:p.x>wallX;
   if((p.x===wallX&&p.y>=top&&p.y<=bottom)||(p.y===top||p.y===bottom)&& (defense?p.x<=wallX:p.x>=wallX)||p.x===edge&&p.y>=top&&p.y<=bottom){if(gates.some(g=>g.x===p.x&&g.y===p.y))return 'gate';walls.push(p);return 'wall';}
   if(inside&&p.y>top&&p.y<bottom){
    if(p.x===wallX+(defense?-1:1)||p.y===top+1||p.y===bottom-1)return 'rampart';
    if(p.y===gateY||p.y===gateY+1)return 'road';
    if(p.x===(defense?4:s.cols-4)&&p.y===4)return 'camp';
    return 'grass';
   }
   if(p.y===gateY||p.y===gateY+1||p.x===3)return 'road';
   if(!defense&&d.id.startsWith('liaodong')&&p.x===wallX-2)return 'water';
   if(p.y===0||p.x===0&&!defense||p.x>=s.cols-2&&defense)return 'forest';
   if(p.x===3&&p.y===3)return 'village';
   return 'grass';
  });
  const allied:Point[]=[{x:3,y:s.rows-3},{x:5,y:gateY+1},{x:3,y:gateY},{x:5,y:gateY-2}];
  const enemy:Point[]=defense?[{x:wallX+4,y:gateY},{x:wallX+3,y:gateY-2},{x:wallX+4,y:gateY+2},{x:wallX+2,y:gateY+1},{x:wallX+5,y:gateY-1},{x:wallX+3,y:gateY+3},{x:wallX+1,y:gateY-3},{x:wallX+4,y:gateY-4},{x:wallX+2,y:gateY+4},{x:wallX+5,y:gateY+3}]:[{x:s.cols-4,y:gateY},{x:wallX+3,y:gateY-2},{x:s.cols-3,y:gateY+2},{x:wallX+2,y:gateY+1},{x:s.cols-4,y:3},{x:wallX+2,y:gateY-3},{x:s.cols-3,y:gateY-1},{x:wallX+3,y:gateY+3},{x:s.cols-4,y:gateY+3},{x:wallX+1,y:3}];
  const oldUnits=s.units,anchorArmy=s.id.includes('-')?null:oldUnits('protect').filter(u=>u.team!=='enemy').map(u=>({x:u.x,y:u.y}));
  if(s.id==='qishan'&&anchorArmy){anchorArmy[1]={x:4,y:6};anchorArmy[2]={x:6,y:5};anchorArmy[3]={x:3,y:4};}
  const oldDeployment=s.deployment;
  s.units=choice=>{
   const units=oldUnits(choice);let ai=0,ei=0;
   for(const u of units){const p=u.team==='enemy'?enemy[ei++]:(anchorArmy??allied)[ai++];Object.assign(u,p);}
   return units;
  };
  // All initial cells and the entire deployment square stay traversable in both choices.
  s.deployment=defense?deployment(s.id==='wuzhang'?7:s.id==='qishan'?3:2,s.rows-5):s.id.includes('-')?deployment(2,s.rows-4):oldDeployment;
  for(const p of [...s.deployment,...s.units('protect')])if(['wall','water'].includes(s.terrain[p.y][p.x]))s.terrain[p.y][p.x]='grass';
  s.siege={mode:d.mode,fortress:d.fortress,material:d.material,gates,walls,description:d.order};s.mapRevision=2;
  s.background=`${s.id}-siege.webp`;
  s.location=`${d.fortress} · ${siegeModeName(d.mode)}`;
  if(s.checkpoints){
   const points=d.mode==='encirclement'?[{x:wallX-2,y:gateY},{x:wallX-1,y:gateY-2}]:[{x:wallX,y:gateY},{x:wallX+2,y:gateY}];
   s.checkpoints=s.checkpoints.map((p,i)=>({...p,...points[i],name:i===0?'성문 앞 연락점':'포위 합류점'}));
   s.objective='성문 앞 연락점과 포위 합류점을 차례로 확보하라';
   for(const p of s.checkpoints)s.terrain[p.y][p.x]='road';
  }
  s.landmark=s.id==='shangyong'?{x:3,y:3,name:'민가'}:{...gates[0],name:defense?'수비 성문':'진입 성문'};
  if(s.id==='shangyong')s.terrain[3][3]='village';
  if(s.id==='wuzhang'){s.landmark={x:6,y:5,name:'위군 진영'};s.terrain[5][6]='village';}
  if(s.goal==='defeat'&&s.id.includes('-'))s.objective='성문의 좁은 통로를 넘어 전초 지휘대를 제압하라';
  s.briefing+=` ${d.order} 성벽은 통행과 사격을 막습니다. 성문은 이동 비용 1·방어 +15%, 성벽 안쪽 통로는 이동 비용 2·방어 +25%입니다.`;
  if(s.id.includes('-')){
   s.story[1]=line(s.commanderName??'군중 보고',s.commanderName?'shi':'guo',`${d.fortress}에 성벽과 좁은 성문이 있습니다. ${defense?'적이 성문 밖으로 다가옵니다.':'성문으로 이어지는 길을 살폈습니다.'}`);
   s.story[2]=line('사마의','sima',d.order);
   s.story[3]=line(s.commanderName??'군중 보고','shi',s.goal==='hold'?`지휘관과 전열을 지키며 ${s.holdUntil}턴까지 버티겠습니다.`:d.mode==='encirclement'?'성문 밖 두 지점에서 순서대로 행동을 마치겠습니다. 성 함락과는 구별해 보고하겠습니다.':'좁은 성문에서 전열을 붙이고 전초 지휘대를 제압하겠습니다.','성채 배치는 원전의 원정을 잇는 게임용 전술 재구성입니다.');
   s.victory=d.report;s.aftermath[0].line=d.report;
  }else s.story[s.story.length-1].note+=` ${d.order}`;
 }
}
