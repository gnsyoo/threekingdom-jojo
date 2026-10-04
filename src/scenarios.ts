import type { Point, Terrain, Unit } from './core.ts';

export type ScenarioId = 'shangyong' | 'wuzhang' | 'liaodong';
export type Choice = 'protect' | 'advance';
export interface StoryLine { speaker: string; portrait: string; line: string; note: string }
export interface Scenario {
  id: ScenarioId; chapter: number; year: number; name: string; title: string;
  cols: number; rows: number; turnLimit: number; background: string;
  location: string; enemyName: string; enemySeal: string;
  objective: string; goal: 'defeat' | 'hold'; holdUntil?: number;
  bonus: string; bonusNote: string; victory: string; aftermath: StoryLine[];
  briefing: string; eventLabel: string; eventRound: number;
  protectLabel: string; protectNote: string; protectDescription: string;
  advanceLabel: string; advanceDescription: string; terrain: Terrain[][];
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
  return {id,name,team,sprite,x,y,role:'보병',hp:64,maxHp:64,mp:0,maxMp:0,attack:23,defense:16,agility:16,movement:4,range:[1,1],level:3,moved:false,acted:false,buff:0,confused:0,boss:false,...values};
}
function weiArmy(level:number,choice:Choice,positions:Point[],liaodong=false):Unit[] {
  const step=level-3;
  return [
    unit('sima','사마의','player',0,positions[0].x,positions[0].y,{role:'도독',level,hp:132+12*step,maxHp:132+12*step,mp:18+3*step,maxMp:18+3*step,attack:39+4*step,defense:27+3*step,agility:30,movement:5,buff:choice==='advance'?1:0}),
    unit('shi','사마사','ally',1,positions[1].x,positions[1].y,{role:'선봉',level,hp:105+10*step,maxHp:105+10*step,attack:29+4*step,defense:22+3*step,movement:5}),
    unit('niu','우금','ally',2,positions[2].x,positions[2].y,{role:'기병',level,hp:118+12*step,maxHp:118+12*step,attack:33+4*step,defense:24+3*step,movement:6,agility:23}),
    unit(liaodong?'hu':'guo',liaodong?'호준':'곽회','ally',liaodong?8:3,positions[3].x,positions[3].y,{role:liaodong?'보병':'궁병',range:liaodong?[1,1]:[2,3],level,hp:112+12*step,maxHp:112+12*step,attack:32+4*step,defense:22+3*step,agility:19}),
  ];
}
const line=(speaker:string,portrait:string,text:string,note=''):StoryLine=>({speaker,portrait,line:text,note});

export const SCENARIOS:Scenario[]=[
  {
    id:'shangyong',chapter:1,year:228,name:'상용',title:'상용 급습전',cols:18,rows:12,turnLimit:12,background:'shangyong-map.png',
    location:'상용 남쪽 산길',enemyName:'맹달군',enemySeal:'孟',goal:'defeat',objective:'맹달을 제압하라',
    bonus:'민가의 안전 확인',bonusNote:'사마의가 왼쪽 민가로 이동한 뒤 행동을 마치세요.',
    victory:'나는 맹달의 원군이 닿기 전에 상용의 지휘를 끊었다. 싸움은 끝났지만, 서쪽에서 나를 기다리는 이름이 있다. 제갈량이다.',
    briefing:'사마의를 직접 지휘합니다. 사마사·우금·곽회는 우군입니다. 2턴의 급습 교란으로 일반 적 부대가 한 차례 멈춥니다.',
    eventLabel:'급습 교란',eventRound:2,eventIds:['mengda-isolated'],
    protectLabel:'민가와 보급을 지킨다',protectNote:'안민 보급',protectDescription:'퇴로와 백성을 살피고 회복약을 넉넉히 챙깁니다.',
    advanceLabel:'원군이 오기 전에 급습한다',advanceDescription:'초반 공격을 강화해 적의 지휘를 빠르게 끊습니다.',
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
      line('사마의 · 독백','sima','태화 2년, 맹달의 서신을 읽었다. 그는 내가 조정의 허락을 기다리리라 믿는다. 적의 계산 속에 머무는 자는 이미 진 것이다.','228년 · 상용. 맹달의 반란을 진압하는 원정입니다.'),
      line('사마사','shi','아버님, 산길을 서둘러 넘으면 보급대가 뒤처집니다. 맹달이 성을 굳히고 촉의 원군을 부를 수도 있습니다.'),
      line('사마의','sima','그래서 지금 간다. 서신으로 그의 경계를 늦추고, 행군으로 그의 시간을 빼앗는다. 칼을 빼기 전부터 승부를 시작하는 것이다.'),
      line('우금','niu','선봉이 남쪽 길을 확보했습니다. 곽회와 함께 적의 진영을 흔들겠습니다. 도독께서는 진입할 자리를 정해 주십시오.','사마의를 직접 조작하고 세 우군은 자동으로 지원합니다.'),
      line('사마의 · 독백','sima','상용의 백성까지 적으로 만들 이유는 없다. 나는 반란의 지휘를 끊으러 왔다. 두 번째 턴에 기습대가 움직이면 맹달은 혼자 남을 것이다.','2턴: 일반 맹달군이 한 라운드 혼란에 빠집니다. 맹달은 영향을 받지 않습니다.'),
      line('사마의','sima','민가와 보급을 먼저 살필 것인가, 원군이 오기 전에 전열을 밀어붙일 것인가. 나는 이번 원정의 첫 수를 정한다.','안민 보급: 회복약 3개. 급습 강화: 회복약 2개와 첫 턴 공격 +10%.'),
    ],
    aftermath:[line('사마사','shi','상용의 저항이 끝났습니다. 맹달은 원군과 연락할 틈도 얻지 못했습니다.'),line('사마의 · 독백','sima','빠른 행군만이 답은 아니다. 오늘은 서둘러야 했고, 다음에는 멈춰야 할지도 모른다. 나는 적의 뜻에 따라 싸우지 않는다.')],
    units:choice=>[
      ...weiArmy(3,choice,[{x:6,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}]),
      unit('mengda','맹달','enemy',6,13,2,{role:'반란 지휘관',hp:155,maxHp:155,attack:28,defense:21,movement:3,boss:true}),
      ...[{x:10,y:5},{x:11,y:7},{x:9,y:3},{x:10,y:1}].map((p,i)=>unit(`e${i+1}`,'맹달군 보병','enemy',4,p.x,p.y)),
      ...[{x:12,y:5},{x:17,y:6}].map((p,i)=>unit(`b${i+1}`,'맹달군 궁병','enemy',5,p.x,p.y,{role:'궁병',range:[2,3],hp:53,maxHp:53,defense:12,attack:24})),
    ],
  },
  {
    id:'wuzhang',chapter:2,year:234,name:'오장원',title:'오장원 대치전',cols:22,rows:14,turnLimit:8,background:'wuzhang-map.png',
    location:'위수 남쪽 방어선',enemyName:'촉군',enemySeal:'蜀',goal:'hold',holdUntil:8,objective:'사마의를 지키며 8턴까지 버텨라',
    bonus:'우금 생존',bonusNote:'부상당한 우금을 생존시키세요. 사마의가 인접하면 회복약으로 지원할 수 있습니다.',
    victory:'나는 끝내 제갈량이 정한 때에 싸우지 않았다. 긴 대치 끝에 촉군은 물러났다. 오늘의 승리는 상대를 쓰러뜨린 칼이 아니라 끝까지 지켜 낸 전열에 있다.',
    briefing:'공격보다 생존이 우선입니다. 우금은 부상 상태로 진영을 지킵니다. 3턴에 곽회가 합류하며 8턴 시작까지 버티면 승리합니다.',
    eventLabel:'곽회 합류',eventRound:3,eventIds:['guo-arrived'],
    protectLabel:'진영을 지키며 기다린다',protectNote:'지구전 보급',protectDescription:'회복약을 확보하고 부상당한 우금을 지원합니다.',
    advanceLabel:'전선을 짧게 압박한다',advanceDescription:'첫 공격을 강화하되 깊은 추격은 피합니다.',
    deployment:deployment(7,10),landmark:{x:6,y:5,name:'위군 진영'},
    terrain:board(22,14,p=>{
      if(p.y<=1&&p.x>=5&&p.x<=19&&!(p.x>=11&&p.x<=12))return 'wall';
      if(p.x>=11&&p.x<=12||p.x===2)return 'road';
      if(p.x===6&&p.y===5)return 'village';
      if(p.x>=5&&p.x<=7&&p.y>=4&&p.y<=6)return 'camp';
      if(p.x<=4||p.y===0||p.x===21)return 'forest';
      return 'grass';
    }),
    story:[
      line('사마의 · 독백','sima','청룡 2년, 제갈량이 다시 위수를 건너왔다. 그는 먼 길을 왔고 나는 돌아갈 곳을 지키고 있다. 저 사람이 원하는 것은 나의 조급함이다.','234년 · 오장원. 이 전투는 지휘관 처치가 아닌 방어 임무입니다.'),
      line('사마사','shi','촉군이 진영 앞까지 나왔습니다. 장수들은 도발을 견디기 어렵다며 출전을 청하고 있습니다.'),
      line('사마의','sima','분노로 출전하면 그가 우리의 발걸음을 지휘하게 된다. 나는 기다린다. 오늘 지킬 것은 체면이 아니라 살아 돌아갈 군대다.'),
      line('우금','niu','앞선 교전으로 병력이 상했습니다. 하지만 진영은 지키겠습니다. 곽회가 서쪽 길을 돌아 합류하면 전열이 두터워질 것입니다.','우금은 부상 상태로 시작합니다. 인접한 우군에게 회복약을 사용할 수 있습니다.'),
      line('사마의 · 독백','sima','제갈량을 꺾겠다고 들판 끝까지 쫓아갈 생각은 없다. 내가 살아 전열을 유지하면 시간이 우리 편이 된다. 곽회의 소식을 기다린다.','3턴 곽회 합류. 사마의가 생존한 채 8턴이 시작되면 승리합니다.'),
      line('사마의','sima','진영에 머물며 회복할 것인가, 짧은 압박으로 적의 기세만 낮출 것인가. 어느 쪽이든 깊은 추격은 하지 않는다.','지구전 보급: 회복약 3개. 압박 강화: 회복약 2개와 첫 턴 공격 +10%.'),
    ],
    aftermath:[line('사마사','shi','촉군이 진영을 거두고 있습니다. 긴 싸움이 끝났습니다.'),line('사마의 · 독백','sima','같은 하늘 아래 다른 길을 걸었던 사람이다. 제갈량의 죽음 뒤에도 그의 뜻은 군대에 남아 있다. 나는 마지막까지 퇴각의 질서를 살핀다.')],
    units:choice=>{
      const army=weiArmy(4,choice,[{x:8,y:11},{x:7,y:8},{x:6,y:5},{x:2,y:6}]);
      army.find(u=>u.id==='guo')!.hp=0;
      const niu=army.find(u=>u.id==='niu')!;niu.hp=48;niu.maxHp=108;
      return [...army,
        unit('zhuge','제갈량','enemy',7,11,3,{role:'촉군 승상',level:6,hp:190,maxHp:190,attack:30,defense:29,agility:26,movement:3,range:[2,3],boss:true}),
        ...[{x:9,y:5},{x:11,y:6},{x:14,y:5},{x:16,y:7},{x:15,y:3},{x:8,y:3}].map((p,i)=>unit(`e${i+1}`,'촉군 보병','enemy',4,p.x,p.y,{level:4,hp:70,maxHp:70,attack:26,defense:19})),
        ...[{x:12,y:4},{x:15,y:8},{x:18,y:5}].map((p,i)=>unit(`b${i+1}`,'촉군 궁병','enemy',5,p.x,p.y,{level:4,role:'궁병',range:[2,3],hp:60,maxHp:60,attack:27,defense:15})),
      ];
    },
  },
  {
    id:'liaodong',chapter:3,year:238,name:'요동',title:'요동 포위전',cols:24,rows:14,turnLimit:18,background:'liaodong-map.png',
    location:'양평성 서쪽',enemyName:'공손연군',enemySeal:'燕',goal:'defeat',objective:'공손연과 비연을 제압하라',
    bonus:'우군 2명 이상 생존',bonusNote:'사마사·우금·호준 중 2명 이상을 생존시켜 승리하세요.',
    victory:'양평의 지휘가 무너졌다. 나는 요동의 비를 견디고 돌아갈 길을 열었다. 낙양에서 또 다른 권력의 싸움이 기다리지만, 지금은 살아남은 병사들의 이름을 먼저 기록한다.',
    briefing:'공손연군은 3턴부터 반격합니다. 일반 병력을 정리하고 공손연·비연을 함께 제압하세요. 위협 표시로 위험한 칸을 확인할 수 있습니다.',
    eventLabel:'양평 반격',eventRound:3,eventIds:['xiangping-counterattack'],
    protectLabel:'비가 그칠 때를 기다린다',protectNote:'포위전 보급',protectDescription:'긴 포위를 대비해 회복약과 전열을 확보합니다.',
    advanceLabel:'드러난 틈으로 전진한다',advanceDescription:'첫 공격을 강화해 성밖 방어선을 압박합니다.',
    deployment:deployment(4,8),landmark:{x:22,y:7,name:'양평성'},
    terrain:board(24,14,p=>{
      if(p.x>=20&&!(p.y>=5&&p.y<=8))return 'wall';
      if(p.y>=6&&p.y<=8)return 'road';
      if(p.x===8&&p.y===2)return 'village';
      if(p.x>=1&&p.x<=4&&p.y>=10&&p.y<=12)return 'camp';
      if(p.x<=3||p.y===0)return 'forest';
      return 'grass';
    }),
    story:[
      line('사마의 · 독백','sima','경초 2년, 요동의 비가 그치지 않는다. 공손연은 성벽만큼이나 이 빗물을 믿고 있다. 그러나 기다리는 일은 나도 오래 배웠다.','238년 · 요동 원정. 양평성의 지휘부를 제압합니다.'),
      line('호준','hu','강물이 불어나 보급이 늦어지고 있습니다. 병사들 사이에서는 진영을 높은 곳으로 옮겨야 한다는 말이 나옵니다.'),
      line('사마의','sima','우리가 물러서는 모습을 보이면 포위는 끝난다. 통행할 길과 보급을 지키되 진영은 흔들지 않는다. 비가 멎으면 성밖의 틈이 드러날 것이다.'),
      line('우금','niu','성밖에 비연의 부대가 있습니다. 공손연은 아직 관문 뒤에 머물지만 반격을 준비하는 듯합니다.','공손연군은 3턴부터 적극적으로 전진합니다. 두 지휘관 모두 제압해야 합니다.'),
      line('사마의 · 독백','sima','성벽보다 먼저 무너뜨려야 할 것은 적의 기대다. 나는 서쪽 길에서 전열을 세우고, 성문 앞의 군대를 하나씩 분리한다.','사마사·우금·호준 중 2명 이상이 생존하면 보조 목표를 달성합니다.'),
      line('사마의','sima','병사들을 지키며 포위를 이어 갈 것인가, 드러난 틈으로 첫 타격을 넣을 것인가. 요동에서 돌아갈 길까지 생각하고 결정한다.','포위전 보급: 회복약 3개. 돌파 강화: 회복약 2개와 첫 턴 공격 +10%.'),
    ],
    aftermath:[line('호준','hu','양평의 저항이 끝났습니다. 북방으로 이어지는 길도 확보했습니다.'),line('사마의 · 독백','sima','나는 빠르게 움직일 때와 오래 기다릴 때를 구별하며 여기까지 왔다. 승리 뒤의 책임도 내 몫이다. 낙양으로 돌아가면 또 다른 판이 펼쳐질 것이다.')],
    units:choice=>[
      ...weiArmy(5,choice,[{x:5,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}],true),
      unit('gongsun','공손연','enemy',9,19,7,{role:'요동 지휘관',level:7,hp:190,maxHp:190,attack:37,defense:31,agility:27,movement:5,boss:true}),
      unit('beiyan','비연','enemy',4,13,7,{role:'요동 선봉',level:6,hp:100,maxHp:100,attack:30,defense:24,movement:4,boss:true}),
      ...[{x:11,y:5},{x:11,y:9},{x:15,y:5},{x:15,y:9},{x:17,y:4},{x:17,y:10}].map((p,i)=>unit(`e${i+1}`,'요동 보병','enemy',4,p.x,p.y,{level:5,hp:70,maxHp:70,attack:27,defense:20})),
      ...[{x:14,y:3},{x:16,y:7},{x:19,y:9}].map((p,i)=>unit(`b${i+1}`,'요동 궁병','enemy',5,p.x,p.y,{level:5,role:'궁병',range:[2,3],hp:60,maxHp:60,attack:28,defense:15})),
    ],
  },
];
export const isScenarioId=(id:unknown):id is ScenarioId=>SCENARIOS.some(s=>s.id===id);
export const getScenario=(id:ScenarioId='shangyong'):Scenario=>SCENARIOS.find(s=>s.id===id)!;
export const nextScenario=(id:ScenarioId):Scenario|undefined=>SCENARIOS[SCENARIOS.findIndex(s=>s.id===id)+1];
