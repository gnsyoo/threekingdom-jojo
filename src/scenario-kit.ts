import type {Point,Terrain,Unit} from './core.ts';
import type {Choice,StoryLine} from './scenarios.ts';
export function board(cols:number,rows:number,at:(p:Point)=>Terrain):Terrain[][] {
  return Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>at({x,y})));
}
export function deployment(x:number,y:number):Point[] {
  return Array.from({length:9},(_,i)=>({x:x+i%3,y:y+Math.floor(i/3)}));
}
export function unit(id:string,name:string,team:Unit['team'],sprite:number,x:number,y:number,values:Partial<Unit>={}):Unit {
  return {id,name,team,sprite,x,y,role:'보병',hp:64,maxHp:64,mp:0,maxMp:0,attack:23,defense:16,agility:16,movement:4,range:[1,1],level:3,moved:false,acted:false,buff:0,confused:0,boss:false,...values};
}
export function weiArmy(level:number,choice:Choice,positions:Point[],liaodong=false):Unit[] {
  const step=level-3;
  return [
    unit('sima','사마의','player',0,positions[0].x,positions[0].y,{role:'도독',level,hp:132+12*step,maxHp:132+12*step,mp:18+3*step,maxMp:18+3*step,attack:39+4*step,defense:27+3*step,agility:30,movement:5,buff:choice==='advance'?1:0}),
    unit('shi','사마사','ally',1,positions[1].x,positions[1].y,{role:'선봉',level,hp:105+10*step,maxHp:105+10*step,attack:29+4*step,defense:22+3*step,movement:5}),
    unit('niu','우금','ally',2,positions[2].x,positions[2].y,{role:'기병',level,hp:118+12*step,maxHp:118+12*step,attack:33+4*step,defense:24+3*step,movement:6,agility:23}),
    unit(liaodong?'hu':'guo',liaodong?'호준':'곽회','ally',liaodong?8:3,positions[3].x,positions[3].y,{role:liaodong?'보병':'궁병',range:liaodong?[1,1]:[2,3],level,hp:112+12*step,maxHp:112+12*step,attack:32+4*step,defense:22+3*step,agility:19}),
  ];
}
export const line=(speaker:string,portrait:string,text:string,note=''):StoryLine=>({speaker,portrait,line:text,note});
