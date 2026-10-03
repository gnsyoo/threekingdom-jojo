import type { Point, Terrain, Unit } from './core.ts';

export type ScenarioId = 'yeongcheon' | 'sishui' | 'hulao';
export type Choice = 'protect' | 'advance';
export interface StoryLine { speaker: string; line: string; note: string }
export interface Scenario {
  id: ScenarioId; chapter: number; year: number; name: string; title: string;
  cols: number; rows: number; turnLimit: number; background: string;
  location: string; enemyName: string; enemySeal: string;
  objective: string; bonus: string; bonusNote: string; victory: string;
  briefing: string; eventLabel: string; eventRound: number;
  protectLabel: string; protectNote: string; terrain: Terrain[][];
  deployment: Point[]; landmark: Point & { name: string };
  story: StoryLine[]; eventIds: string[]; units: (choice: Choice) => Unit[];
}

function board(cols:number,rows:number,at:(p:Point)=>Terrain):Terrain[][] {
  return Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>at({x,y})));
}
function deployment(x:number,y:number):Point[] {
  return Array.from({length:9},(_,i)=>({x:x+i%3,y:y+Math.floor(i/3)}));
}
function unit(id:string,name:string,team:Unit['team'],sprite:number,x:number,y:number,values:Partial<Unit>={}):Unit {
  return {id,name,team,sprite,x,y,role:'보병',hp:64,maxHp:64,mp:0,maxMp:0,
    attack:23,defense:16,agility:16,movement:4,range:[1,1],level:3,
    moved:false,acted:false,buff:0,confused:0,boss:false,...values};
}
function alliance(level:number,choice:Choice,positions:Point[]):Unit[] {
  const step=level-3;
  return [
    unit('cao','조조','player',0,positions[0].x,positions[0].y,{role:'군주',level,hp:132+12*step,maxHp:132+12*step,mp:18+3*step,maxMp:18+3*step,attack:39+4*step,defense:27+3*step,agility:30,movement:5,buff:choice==='advance'?1:0}),
    unit('liu','유비','ally',1,positions[1].x,positions[1].y,{role:'군주',level,hp:105+10*step,maxHp:105+10*step,attack:29+4*step,defense:22+3*step,movement:5}),
    unit('guan','관우','ally',2,positions[2].x,positions[2].y,{role:'기병',level,hp:118+12*step,maxHp:118+12*step,attack:33+4*step,defense:24+3*step,movement:6,agility:23}),
    unit('zhang','장비','ally',3,positions[3].x,positions[3].y,{level,hp:112+12*step,maxHp:112+12*step,attack:32+4*step,defense:22+3*step,agility:19}),
  ];
}

export const SCENARIOS:Scenario[]=[
  {
    id:'yeongcheon',chapter:1,year:184,name:'영천',title:'영천 전투',cols:18,rows:12,turnLimit:12,background:'battlefield.png',
    location:'영천 외곽',enemyName:'황건군',enemySeal:'黃巾',objective:'장보와 장량을 퇴각시켜라',
    bonus:'민가의 안전 확인',bonusNote:'왼쪽 마을에 조조가 이동한 뒤 행동을 마치세요.',
    victory:'황건군의 지휘가 무너졌습니다. 영천에 잠시 평온이 돌아옵니다.',
    briefing:'조조를 직접 지휘합니다. 유비·관우·장비는 함께 진격합니다.',eventLabel:'우군 화공',eventRound:2,
    protectLabel:'민가 보호를 준비한다',protectNote:'민가 보호',eventIds:[],
    deployment:deployment(5,8),landmark:{x:3,y:3,name:'민가'},
    terrain:board(18,12,p=>{
      if(p.y===6&&p.x>=14&&p.x<=16)return 'bridge';
      if(p.x===15||p.x===16)return 'water';
      if(p.y<=1&&p.x<=3||p.x===0&&p.y<=5)return 'wall';
      if(p.x===3&&p.y===3)return 'village';
      if(p.y<=1||p.x<=3&&p.y>=7||p.x===17&&p.y!==6)return 'forest';
      if(p.x===7)return 'road';
      if(p.x>=11&&p.x<=13&&p.y>=2&&p.y<=3)return 'camp';
      return 'grass';
    }),
    story:[
      {speaker:'군관',line:'황건군이 영천의 길을 막았습니다. 장보와 장량이 저 진영에서 군대를 지휘하고 있습니다.',note:'두 지휘관을 퇴각시키면 전투에서 승리합니다.'},
      {speaker:'조조',line:'길만 보고 달려들지 마라. 우리가 설 곳부터 정한다. 우군과 함께 전열을 만들어야 한다.',note:'조조를 직접 지휘합니다. 유비·관우·장비는 스스로 움직입니다.'},
      {speaker:'조조',line:'백성이 머무는 마을이 있다. 우리의 군대는 무엇을 먼저 준비할 것인가?',note:'민가 보호는 회복약 3개, 선봉 강화는 회복약 2개와 첫 라운드 공격력 +10%입니다.'},
    ],
    units:choice=>[
      ...alliance(3,choice,[{x:6,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}]),
      unit('bao','장보','enemy',6,13,2,{role:'황건 지휘관',hp:88,maxHp:88,attack:25,defense:19,movement:3,boss:true}),
      unit('liang','장량','enemy',7,13,4,{role:'황건 지휘관',hp:94,maxHp:94,attack:28,defense:21,movement:3,boss:true}),
      ...[{x:10,y:5},{x:11,y:7},{x:9,y:3},{x:10,y:1}].map((p,i)=>unit(`e${i+1}`,'황건병','enemy',4,p.x,p.y)),
      ...[{x:12,y:5},{x:17,y:6}].map((p,i)=>unit(`b${i+1}`,'황건 궁병','enemy',5,p.x,p.y,{role:'궁병',range:[2,3],hp:53,maxHp:53,defense:12,attack:24})),
    ],
  },
  {
    id:'sishui',chapter:2,year:190,name:'사수관',title:'사수관 구원전',cols:22,rows:14,turnLimit:16,background:'sishui.png',
    location:'사수관 남쪽',enemyName:'동탁군',enemySeal:'董',objective:'화웅을 퇴각시켜라',
    bonus:'손견 구원',bonusNote:'손견을 생존시킨 채 승리하세요. 인접하면 회복약으로 지원할 수 있습니다.',
    victory:'화웅이 물러나고 사수관의 길이 열렸습니다. 연합군은 호로관으로 향합니다.',
    briefing:'손견이 고립됐습니다. 인접해 회복약을 건네세요. 관우는 3턴에 서쪽 숲길로 도착합니다.',
    eventLabel:'관우 지원',eventRound:3,protectLabel:'구원 보급을 준비한다',protectNote:'구원 보급',eventIds:['guan-arrived'],
    deployment:deployment(7,10),landmark:{x:6,y:5,name:'구원 진영'},
    terrain:board(22,14,p=>{
      if(p.y<=1&&p.x>=5&&p.x<=19&&!(p.x>=11&&p.x<=12))return 'wall';
      if(p.x>=11&&p.x<=12||p.x===2)return 'road';
      if(p.x===6&&p.y===5)return 'village';
      if(p.x>=5&&p.x<=7&&p.y>=4&&p.y<=6)return 'camp';
      if(p.x<=4)return 'forest';
      if(p.y===0||p.x===21)return 'forest';
      return 'grass';
    }),
    story:[
      {speaker:'군관',line:'동탁의 장수 화웅이 사수관을 지키고 있습니다. 먼저 나선 손견군이 숲 옆 진영에 고립됐습니다.',note:'화웅 퇴각이 승리 조건입니다. 손견 퇴각은 보조 목표 실패입니다.'},
      {speaker:'조조',line:'앞에 고립된 군대가 있다. 저들을 잃고 얻는 승리는 오래가지 못한다. 가까이 가서 회복약을 전해라.',note:'손견은 부상 상태로 시작합니다. 도구로 인접한 우군을 회복할 수 있습니다.'},
      {speaker:'조조',line:'관우가 서쪽 숲길로 합류한다. 그가 도착할 때까지 전열을 지킨다. 보급을 넉넉히 준비할 것인가?',note:'3턴에 관우가 도착합니다. 구원 보급은 회복약 3개, 선봉 강화는 2개와 첫 턴 공격 +10%입니다.'},
    ],
    units:choice=>{
      const allies=alliance(4,choice,[{x:8,y:11},{x:7,y:8},{x:2,y:6},{x:9,y:8}]);
      allies.find(u=>u.id==='guan')!.hp=0;
      return [...allies,
        unit('sun','손견','ally',7,6,5,{role:'군주',level:4,hp:48,maxHp:108,attack:31,defense:24,agility:24,movement:4}),
        unit('hua','화웅','enemy',8,11,3,{role:'보병',level:5,hp:150,maxHp:150,attack:34,defense:27,agility:24,movement:3,boss:true}),
        ...[{x:9,y:5},{x:11,y:6},{x:14,y:5},{x:16,y:7},{x:15,y:3},{x:8,y:3}].map((p,i)=>unit(`e${i+1}`,'동탁군 보병','enemy',4,p.x,p.y,{level:4,hp:70,maxHp:70,attack:26,defense:19})),
        ...[{x:12,y:4},{x:15,y:8},{x:18,y:5}].map((p,i)=>unit(`b${i+1}`,'동탁군 궁병','enemy',5,p.x,p.y,{level:4,role:'궁병',range:[2,3],hp:60,maxHp:60,attack:27,defense:15})),
      ];
    },
  },
  {
    id:'hulao',chapter:3,year:190,name:'호로관',title:'호로관 전투',cols:24,rows:14,turnLimit:18,background:'hulao.png',
    location:'호로관 서쪽',enemyName:'동탁군',enemySeal:'董',objective:'여포를 퇴각시켜라',
    bonus:'우군 2명 이상 생존',bonusNote:'유비·관우·장비 중 2명 이상을 생존시켜 승리하세요.',
    victory:'여포가 성문 안으로 물러났습니다. 세 전투의 기록을 남겼습니다. 전투 선택에서 다시 도전할 수 있습니다.',
    briefing:'여포는 3턴부터 진격합니다. 우군과 집중 공격하고 회복 시점을 조절하세요.',
    eventLabel:'여포 진격',eventRound:3,protectLabel:'지구전을 준비한다',protectNote:'지구전 보급',eventIds:['lubu-charge'],
    deployment:deployment(4,8),landmark:{x:22,y:7,name:'호로관'},
    terrain:board(24,14,p=>{
      if(p.x>=20&&!(p.y>=5&&p.y<=8))return 'wall';
      if(p.y>=6&&p.y<=8)return 'road';
      if(p.x===8&&p.y===2)return 'village';
      if(p.x>=1&&p.x<=4&&p.y>=10&&p.y<=12)return 'camp';
      if(p.x<=3||p.y===0)return 'forest';
      return 'grass';
    }),
    story:[
      {speaker:'군관',line:'호로관 앞에 여포가 버티고 있습니다. 처음 두 턴은 관문을 지키지만, 세 번째 턴부터 직접 진격합니다.',note:'여포는 강한 기병입니다. 위협 표시로 이동과 공격 범위를 확인하세요.'},
      {speaker:'조조',line:'한 사람이 강하면, 우리는 함께 싸우면 된다. 궁병부터 정리하고 우군과 함께 전열을 만든다.',note:'유비·관우·장비 중 2명 이상이 생존하면 보조 목표를 달성합니다.'},
      {speaker:'조조',line:'성급한 돌격보다 한 번 더 버티는 것이 중요하다. 긴 싸움을 위한 보급을 준비할 것인가?',note:'지구전 보급은 회복약 3개, 선봉 강화는 2개와 첫 턴 공격 +10%입니다.'},
    ],
    units:choice=>[
      ...alliance(5,choice,[{x:5,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}]),
      unit('lubu','여포','enemy',9,19,7,{role:'기병',level:7,hp:260,maxHp:260,attack:44,defense:36,agility:29,movement:6,boss:true}),
      ...[{x:11,y:5},{x:11,y:9},{x:13,y:7},{x:15,y:5},{x:15,y:9},{x:17,y:4},{x:17,y:10},{x:19,y:5}].map((p,i)=>unit(`e${i+1}`,'동탁군 보병','enemy',4,p.x,p.y,{level:5,hp:70,maxHp:70,attack:27,defense:20})),
      ...[{x:14,y:3},{x:16,y:7},{x:19,y:9}].map((p,i)=>unit(`b${i+1}`,'동탁군 궁병','enemy',5,p.x,p.y,{level:5,role:'궁병',range:[2,3],hp:60,maxHp:60,attack:28,defense:15})),
    ],
  },
];

export const isScenarioId=(id:unknown):id is ScenarioId=>SCENARIOS.some(s=>s.id===id);
export const getScenario=(id:ScenarioId='yeongcheon'):Scenario=>SCENARIOS.find(s=>s.id===id)!;
export const nextScenario=(id:ScenarioId):Scenario|undefined=>SCENARIOS[SCENARIOS.findIndex(s=>s.id===id)+1];
