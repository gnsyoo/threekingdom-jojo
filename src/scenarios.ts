import type { Point, Terrain, Unit } from './core.ts';
import {board,deployment,unit,weiArmy,line} from './scenario-kit.ts';
import {EXTRA_SCENARIOS} from './extra-scenarios.ts';

export type ScenarioId = 'shangyong' | 'jieting' | 'xicheng' | 'qishan' | 'shangfang' | 'wuzhang' | 'liaodong' | 'gaoping' | 'yangping';
export type Choice = 'protect' | 'advance';
export interface StoryLine { speaker: string; portrait: string; line: string; note: string }
export interface Scenario {
  id: ScenarioId; chapter: number; year: number; name: string; title: string;
  cols: number; rows: number; turnLimit: number; background: string;
  location: string; enemyName: string; enemySeal: string;
  objective: string; goal: 'defeat' | 'hold' | 'occupy' | 'escape'; holdUntil?: number;
  checkpoints?: (Point & {id:string;name:string})[]; orderedCheckpoints?:boolean; minimumRound?:number;
  fireTiles?:Point[]; stationary?:string[]; commanderName?:string; parTurns?:number; weather?:string;
  bonusRule?:'health'|'allies'|'fast'|'noCombat';
  bonus: string; bonusNote: string; victory: string; aftermath: StoryLine[];
  briefing: string; eventLabel: string; eventRound: number;
  protectLabel: string; protectNote: string; protectDescription: string;
  advanceLabel: string; advanceDescription: string; terrain: Terrain[][];
  deployment: Point[]; landmark: Point & { name: string };
  story: StoryLine[]; eventIds: string[]; units: (choice: Choice) => Unit[];
}

export const SCENARIOS:Scenario[]=[
  {
    id:'shangyong',chapter:1,year:228,name:'상용',title:'상용 급습전',cols:18,rows:12,turnLimit:12,background:'shangyong-field.webp',
    location:'상용 · 신성 성밖',enemyName:'맹달군',enemySeal:'孟',goal:'defeat',objective:'맹달을 제압하라',
    bonus:'민가의 안전 확인',bonusNote:'사마의가 왼쪽 민가로 이동한 뒤 행동을 마치세요.',
    victory:"맹달은 신탐에게 죽고, 이보와 등현이 성문을 열었다. 사마의는 신성을 수습한 뒤 장안에서 조예를 만나 촉군을 막을 임무를 받았다.",
    briefing:'사마의를 직접 지휘합니다. 사마사·우금·곽회는 우군입니다. 2턴 신의·신탐의 내응 준비로 일반 적 부대가 한 차례 멈춥니다.',
    eventLabel:'내응 준비',eventRound:2,eventIds:['mengda-isolated'],
    protectLabel:'포위망과 보급을 정비한다',protectNote:'포위전 보급',protectDescription:'성을 에워싸고 회복약을 넉넉히 챙깁니다.',
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
      line("사마의","sima","신의가 맹달의 반심을 알려 왔다. 이보와 등현의 고변도 같다. 맹달은 제갈량과 내통하고 있다.","삼국연의 제94회 · 228년. 맹달의 반란과 신성 공방."),
      line("사마사","shi","아버님, 먼저 천자께 표문을 올려 군사를 움직일 허락을 받으시지요."),
      line("사마의","sima","허락을 기다리며 오가면 한 달이 걸린다. 하루에 이틀 길을 가라. 양기는 먼저 가서 맹달에게 출정을 준비하라는 격문을 전하라."),
      line("맹달","mengda","사마의는 장안으로 갔다고 한다. 신의와 신탐에게 알려 군사를 일으키고 낙양으로 나아가겠다."),
      line("사마의","sima","맹달의 사자가 지닌 제갈량의 답서를 얻었다. 우리의 빠른 진군을 내다보았구나. 더욱 서둘러 성을 에워싸라.","사마의를 직접 조작하고 세 우군은 자동으로 지원합니다."),
      line("사마사","shi","서황 장군이 맹달의 화살에 맞아 돌아가셨습니다. 신의와 신탐은 우리 군에 호응할 준비가 되어 있습니다.","포위전 보급: 회복약 3개. 급습 강화: 회복약 2개와 첫 턴 공격 +10%."),
    ],
    aftermath:[line("삼국연의 · 제94회","sima","맹달은 신의와 신탐을 구원군으로 여겨 성문을 열었다가 배신을 알았다. 성 안의 이보와 등현도 위군에 호응했고, 달아나던 맹달은 신탐에게 죽었다."),line("사마의","sima","조칙을 기다리느라 늦었다면 제갈량의 계책에 빠졌을 것입니다. 급히 진군한 까닭은 그 때문입니다.")],
    units:choice=>[
      ...weiArmy(3,choice,[{x:6,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}]),
      unit('mengda','맹달','enemy',6,13,2,{role:'반란 지휘관',hp:155,maxHp:155,attack:28,defense:21,movement:3,boss:true}),
      ...[{x:10,y:5},{x:11,y:7},{x:9,y:3},{x:10,y:1}].map((p,i)=>unit(`e${i+1}`,'맹달군 보병','enemy',4,p.x,p.y)),
      ...[{x:12,y:5},{x:17,y:6}].map((p,i)=>unit(`b${i+1}`,'맹달군 궁병','enemy',5,p.x,p.y,{role:'궁병',range:[2,3],hp:53,maxHp:53,defense:12,attack:24})),
    ],
  },
  {
    id:'wuzhang',chapter:2,year:234,name:'오장원',title:'오장원 대치전',cols:22,rows:14,turnLimit:8,background:'wuzhang-field.webp',
    location:'위수 북쪽 방어선',enemyName:'촉군',enemySeal:'蜀',goal:'hold',holdUntil:8,objective:'사마의를 지키며 8턴까지 버텨라',
    bonus:'우금 생존',bonusNote:'부상당한 우금을 생존시키세요. 사마의가 인접하면 회복약으로 지원할 수 있습니다.',
    victory:"방어 목표를 달성했다. 삼국연의에서는 제갈량이 세상을 떠난 뒤 촉군이 퇴각한다. 추격에 나선 사마의는 제갈량의 목상을 보고 복병을 의심해 물러난다.",
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
      line("사마의","sima","상방곡에서 겨우 벗어났고 위수 남쪽 진영마저 잃었다. 이제 북쪽 진영을 지켜라. 다시 함부로 출전하지 마라.","삼국연의 제103~104회 · 234년. 상방곡 이후의 대치와 목상 계책."),
      line("곽회","guo","제갈량이 군사를 이끌고 지세를 살피고 있습니다. 새로 진을 칠 곳을 찾는 듯합니다."),
      line("사마의","sima","무공으로 나와 동쪽으로 향하면 위험하다. 오장원에 머문다면 지켜 낼 수 있다. 어디에 주둔하는지 살펴라."),
      line("제갈량","zhuge","출전하지 않으니 여인의 머리쓰개와 옷을 보내겠소. 결전을 할 생각이 있다면 약속한 날에 나오시오."),
      line("사마의","sima","도발은 받되 출전하지 않는다. 사자에게 제갈량이 어떻게 먹고 쉬며 일을 맡는지 물어라.","우금은 부상 상태로 시작합니다. 3턴에 곽회가 합류합니다."),
      line("사마의","sima","신비가 지절을 들고 출전하지 말라는 조칙을 전했다. 진영을 지키고 출전을 요구하는 장수들도 따르게 하라.","사마의가 생존한 채 8턴이 시작되면 방어 목표를 달성합니다."),
    ],
    aftermath:[line("삼국연의 · 제104회","zhuge","촉군은 제갈량의 유언대로 목상을 수레에 앉혀 추격군 앞에 내보냈다. 사마의는 제갈량이 살아 있다고 여겨 달아났고, 뒤늦게 목상이었음을 알았다."),line("사마의","sima","살아 있을 때의 계책은 헤아렸으나 죽은 뒤의 계책은 헤아리지 못했구나. 진영을 살펴보니 과연 천하의 기재로다.")],
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
    id:'liaodong',chapter:3,year:238,name:'요동',title:'요동 포위전',cols:24,rows:14,turnLimit:18,background:'liaodong-field.webp',
    location:'양평성 서쪽',enemyName:'공손연군',enemySeal:'燕',goal:'defeat',objective:'공손연과 비연을 제압하라',
    bonus:'우군 2명 이상 생존',bonusNote:'사마사·우금·호준 중 2명 이상을 생존시켜 승리하세요.',
    victory:"요수에서 양평으로 방향을 바꾸어 적을 움직이고, 장마가 끝난 뒤 성을 공격했다. 사마의는 공손연 부자를 사로잡아 처형하고, 호준은 양평에 들어갔다.",
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
      line("사마의","sima","공손연은 스스로 연왕을 칭했다. 성을 버리고 달아나는 것이 상책이요, 양평에 틀어박혀 지키는 것은 하책이다. 사만 군사로 토벌하겠다.","삼국연의 제106회 · 238년. 요수의 계책과 양평 포위."),
      line("호준","hu","비연과 양조가 요수에 진을 치고, 긴 참호와 목책으로 길을 막았습니다."),
      line("사마의","sima","그곳을 버리고 곧장 양평으로 간다. 적이 구원하러 뒤따르면 하후패와 하후위가 길목에서 치게 하라."),
      line("삼국연의 · 제106회","sima","양평을 에워싼 뒤 한 달 동안 비가 내렸다. 사마의는 진영을 옮기자는 청을 막고, 군령을 어긴 장수를 처형하면서까지 자리를 지켰다."),
      line("사마의","sima","맹달을 칠 때는 우리 군량이 적어 서둘렀다. 지금은 적이 굶주리고 우리는 군량이 있다. 성을 억지로 공격할 까닭이 없다.","요수·수산·양평의 공방을 한 전장에서 진행합니다."),
      line("사마의","sima","비가 그치면 토산을 쌓고 땅굴을 파며 운제를 세워 성을 공격하라. 공손연이 빠져나갈 길에도 군사를 두어라.","포위전 보급: 회복약 3개. 돌파 강화: 회복약 2개와 첫 턴 공격 +10%."),
    ],
    aftermath:[line("삼국연의 · 제106회","sima","비연은 수산에서 하후패에게 죽었다. 성을 빠져나온 공손연 부자는 사마의와 두 아들, 호준 등의 포위에 붙잡혀 처형됐다. 사마의는 군사들에게 상을 내리고 낙양으로 돌아갔다."),line('삼국연의 · 제106회','sima','낙양에서는 병든 조예가 사마의의 귀환을 기다리고 있었다. 사마의는 조상을 비롯한 신하들과 함께 어린 조방을 보필하라는 부탁을 받았다.')],
    units:choice=>[
      ...weiArmy(5,choice,[{x:5,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}],true),
      unit('gongsun','공손연','enemy',9,19,7,{role:'요동 지휘관',level:7,hp:190,maxHp:190,attack:37,defense:31,agility:27,movement:5,boss:true}),
      unit('beiyan','비연','enemy',4,13,7,{role:'요동 선봉',level:6,hp:100,maxHp:100,attack:30,defense:24,movement:4,boss:true}),
      ...[{x:11,y:5},{x:11,y:9},{x:15,y:5},{x:15,y:9},{x:17,y:4},{x:17,y:10}].map((p,i)=>unit(`e${i+1}`,'요동 보병','enemy',4,p.x,p.y,{level:5,hp:70,maxHp:70,attack:27,defense:20})),
      ...[{x:14,y:3},{x:16,y:7},{x:19,y:9}].map((p,i)=>unit(`b${i+1}`,'요동 궁병','enemy',5,p.x,p.y,{level:5,role:'궁병',range:[2,3],hp:60,maxHp:60,attack:28,defense:15})),
    ],
  },
];
SCENARIOS.push(...EXTRA_SCENARIOS);
const chronology:ScenarioId[]=['shangyong','jieting','xicheng','qishan','shangfang','wuzhang','liaodong','gaoping','yangping'];
SCENARIOS.sort((a,b)=>chronology.indexOf(a.id)-chronology.indexOf(b.id));
SCENARIOS.forEach((s,i)=>{s.chapter=i+1;s.parTurns??=s.goal==='hold'?s.holdUntil:s.turnLimit-3;});
export const isScenarioId=(id:unknown):id is ScenarioId=>SCENARIOS.some(s=>s.id===id);
export const getScenario=(id:ScenarioId='shangyong'):Scenario=>SCENARIOS.find(s=>s.id===id)!;
export const nextScenario=(id:ScenarioId):Scenario|undefined=>SCENARIOS[SCENARIOS.findIndex(s=>s.id===id)+1];
