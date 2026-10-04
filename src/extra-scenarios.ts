import type {Scenario,Choice} from './scenarios.ts';
import type {Point,Unit} from './core.ts';
import {board,deployment,unit,weiArmy,line} from './scenario-kit.ts';
const troops=(name:string,positions:Point[],archers:Point[]=[],level=3)=>[
  ...positions.map((p,i)=>unit(`e${i+1}`,`${name} 보병`,'enemy',4,p.x,p.y,{level,hp:58+level*3,maxHp:58+level*3,attack:20+level*2,defense:13+level})),
  ...archers.map((p,i)=>unit(`b${i+1}`,`${name} 궁병`,'enemy',5,p.x,p.y,{level,role:'궁병',hp:48+level*2,maxHp:48+level*2,range:[2,3],attack:21+level*2,defense:12+level})),
];
const army=(level:number,choice:Choice,positions:Point[],withHe=false)=>{
 const units=weiArmy(level,choice,positions);
 if(withHe)Object.assign(units[1],{id:'he',name:'장합',sprite:8,role:'선봉'});
 return units;
};
const health={bonus:'지휘관 체력 절반 이상',bonusNote:'목표 달성 때 직접 지휘한 장수의 HP를 50% 이상 남기세요.',bonusRule:'health' as const};
const supplies={protectLabel:'전열과 보급을 지킨다',protectNote:'안정된 보급',protectDescription:'회복약을 확보하고 숲과 진영을 이용합니다.',advanceLabel:'빠른 진군을 택한다',advanceDescription:'첫 라운드 공격을 강화해 길목을 엽니다.'};
export const EXTRA_SCENARIOS:Scenario[]=[
 {
  id:'jieting',chapter:2,year:228,name:'가정',title:'가정 차단전',cols:18,rows:12,turnLimit:12,background:'jieting-field.webp',location:'가정 · 산 아래 보급로',enemyName:'촉군',enemySeal:'蜀',goal:'occupy',objective:'물길과 가정 대로를 확보하라',
  checkpoints:[{id:'waterway',x:8,y:7,name:'물길'},{id:'mainroad',x:13,y:4,name:'가정 대로'}],landmark:{x:8,y:7,name:'물길'},deployment:deployment(3,8),
  ...health,...supplies,parTurns:8,eventLabel:'산 위의 갈증',eventRound:3,eventIds:['water-cut'],
  briefing:'두 금빛 거점에서 행동을 마치세요. 마속 처치는 필수가 아닙니다. 3턴에는 산 위 촉군의 혼란이 발생합니다.',
  victory:'산 위에 진을 친 마속의 군사는 물과 보급을 잃고 무너졌다. 가정을 잃은 제갈량은 촉군의 퇴각을 준비했다.',
  terrain:board(18,12,p=>p.x===9&&p.y<7?'wall':p.x===8&&p.y>7?'water':p.y===7||p.x===13?'road':p.x>10&&p.y<4?'forest':p.x===8&&p.y===6?'camp':'grass'),
  story:[
   line('사마의','sima','가정과 열류성은 한중으로 이어지는 길목이다. 가정의 길을 끊으면 제갈량은 군량을 잇기 어렵다.','삼국연의 제95회 · 228년. 한중의 목줄을 잡다.'),
   line('장합','he','그렇다면 가정으로 먼저 군사를 보내야겠습니다.'),
   line('사마의','sima','먼저 멀리 정찰하라. 제갈량은 맹달과 다르다. 매복을 살피지 않고 가볍게 전진하지 마라.'),
   line('왕평','wping','당도에 진을 쳐야 합니다. 산 위에만 머물면 물길이 끊겼을 때 버틸 수 없습니다.'),
   line('마속','masu','산 위에서 죽을 곳에 들어가야 살 길을 얻을 수 있다. 내 군사를 산에 올리겠다.'),
   line('사마의','sima','산 아래 물과 길을 끊어라. 적의 진영에만 매달릴 까닭이 없다.','금빛 물길·대로에서 대기나 행동을 마치면 확보됩니다.'),
  ],
  aftermath:[line('삼국연의 · 제95회','masu','마속은 왕평의 간언을 듣지 않고 산 위에 진을 쳤다. 위군이 물을 끊자 촉군은 혼란에 빠졌고, 왕평이 퇴각하는 군사를 수습했다.'),line('삼국연의 · 제95회','sima','가정의 패전 소식이 제갈량에게 닿았다. 사마의의 군사는 서성으로 향했다.')],
  units:choice=>[...army(3,choice,[{x:4,y:9},{x:3,y:7},{x:5,y:7},{x:4,y:6}],true),unit('masu','마속','enemy',6,13,2,{role:'촉군 참군',hp:150,maxHp:150,attack:26,defense:22,boss:true}),...troops('촉군',[{x:9,y:7},{x:12,y:5},{x:11,y:3}],[{x:14,y:5}])],
 },
 {
  id:'xicheng',chapter:3,year:228,name:'서성',title:'서성 회군전',cols:18,rows:12,turnLimit:7,background:'xicheng-field.webp',location:'서성 · 성문 앞',enemyName:'서성 수비대',enemySeal:'蜀',goal:'escape',objective:'성문을 피해 북서쪽 회군로로 빠져나가라',
  checkpoints:[{id:'return-road',x:2,y:2,name:'회군로'}],landmark:{x:2,y:2,name:'회군로'},deployment:deployment(5,8),stationary:['zhuge','b1','b2'],
  bonus:'교전 없이 회군',bonusNote:'직접 공격하지 않고 회군로에서 행동을 마치세요.',bonusRule:'noCombat',...supplies,parTurns:4,eventLabel:'성루의 거문고',eventRound:2,eventIds:['qin-heard'],
  briefing:'회군로는 금빛 칸입니다. 성문에 남은 수비대는 자리를 지킵니다. 공격 대신 진로와 우군 방침을 선택하세요.',
  victory:'사마의는 열린 성문과 제갈량의 거문고를 매복의 징후로 받아들여 군사를 물렸다. 촉군은 위기를 넘겼다.',
  terrain:board(18,12,p=>p.x>=14&&!(p.y>=6&&p.y<=8)?'wall':p.x===6||p.y===2||p.y===7?'road':p.x<=3&&p.y>=5?'forest':p.x>=11&&p.x<=13&&p.y>=5&&p.y<=8?'camp':'grass'),
  story:[
   line('삼국연의 · 제95회','sima','가정을 잃은 제갈량은 서성에 적은 군사만 남겨 두었다. 성문을 열고 백성에게 길을 쓸게 했다.','삼국연의 제95회 · 공성계. 퇴각도 하나의 선택이다.'),
   line('사마의','sima','성문이 열려 있고, 제갈량이 성루에서 거문고를 타고 있다.'),
   line('사마소','zhao','군사가 없어 보입니다. 어찌하여 물러나려 하십니까?'),
   line('사마의','sima','제갈량은 평생 조심스럽게 군사를 썼다. 문을 크게 열었다면 안에 매복이 있을 것이다.'),
   line('삼국연의 · 제95회','zhuge','제갈량은 성루에 앉아 위군이 물러가는 것을 지켜보았다.'),
   line('사마의','sima','다른 길로 물러나라. 성 안으로 들어가지 않는다.','이번 목표는 적 처치가 아니라 회군로 도달입니다.'),
  ],
  aftermath:[line('삼국연의 · 제95회','zhuge','제갈량의 공성계는 성공했다. 사마의는 빈 성을 함정으로 여겨 물러났고, 촉군은 퇴각할 시간을 얻었다.'),line('삼국연의 · 제95회','sima','이후 사마의는 성이 비었다는 소식을 들었다. 가정에서의 승리가 제갈량의 모든 계책을 꿰뚫었다는 뜻은 아니었다.')],
  units:choice=>[...army(3,choice,[{x:6,y:9},{x:5,y:7},{x:7,y:7},{x:6,y:6}]),unit('zhuge','제갈량','enemy',7,15,7,{role:'촉군 승상',hp:180,maxHp:180,attack:28,defense:26,range:[2,3],boss:true}),...troops('서성',[],[{x:13,y:5},{x:13,y:9}])],
 },
 {
  id:'qishan',chapter:4,year:231,name:'기산',title:'기산 방어전',cols:20,rows:12,turnLimit:6,holdUntil:6,background:'qishan-field.webp',location:'기산 · 위군 방어선',enemyName:'촉군',enemySeal:'蜀',goal:'hold',objective:'사마의를 지키며 6턴까지 버텨라',
  ...health,...supplies,parTurns:6,landmark:{x:5,y:6,name:'위군 진영'},deployment:deployment(3,8),eventLabel:'추격 경계',eventRound:3,eventIds:['pursuit-warning'],
  briefing:'숲과 진영에서 방어하고 우군을 지휘하세요. 6턴 시작까지 생존하면 방어 목표를 달성합니다. 적 지휘관 처치는 필수가 아닙니다.',
  victory:'촉군은 군량 문제와 이엄의 서신 때문에 물러났다. 추격을 고집한 장합은 목문도 매복에 걸려 죽었고, 사마의는 이를 자신의 허물이라 탄식했다.',
  terrain:board(20,12,p=>p.x===9&&p.y!==6?'wall':p.y===6?'road':p.x<=4||p.y===0?'forest':p.x>=4&&p.x<=6&&p.y>=5&&p.y<=7?'camp':'grass'),
  story:[
   line('삼국연의 · 제101회','sima','제갈량의 북벌은 계속됐다. 사마의는 함부로 싸우기보다 진영을 굳히려 했다.','삼국연의 제101회 · 방어와 추격의 경계.'),
   line('장합','he','촉군이 물러나면 제가 앞장서 추격하겠습니다.'),
   line('사마의','sima','촉군이 물러가는 험한 길에는 매복이 있을 것이다. 추격하더라도 매우 조심해야 한다.'),
   line('삼국연의 · 제101회','zhuge','이엄은 군량을 잇지 못한 책임을 감추려고 동오의 침입을 알리는 서신을 보냈다. 제갈량은 회군을 준비했다.'),
   line('사마의','sima','지금은 전열을 지킨다. 적이 물러난다고 해서 모든 위험이 사라진 것은 아니다.'),
   line('삼국연의 · 제101회','he','장합은 공을 세우려 추격을 고집했다. 목문도로 이어지는 길에 함정이 기다리고 있었다.','방어 목표 이후의 추격과 장합의 죽음은 원작 후일담에서 이어집니다.'),
  ],
  aftermath:[line('삼국연의 · 제101회','weiyan','위연과 관흥은 번갈아 거짓 패주하며 장합을 목문도로 유인했다. 길이 막힌 뒤 쇠뇌가 일제히 발사됐고 장합은 죽었다.'),line('사마의','sima','장준의가 죽었으니, 나의 허물이다.')],
  units:choice=>[...army(4,choice,[{x:4,y:9},{x:5,y:6},{x:3,y:6},{x:6,y:7}],true),unit('weiyan','위연','enemy',4,15,6,{role:'촉군 선봉',hp:150,maxHp:150,attack:29,defense:24,boss:true}),...troops('촉군',[{x:11,y:6},{x:14,y:4},{x:14,y:8}],[{x:16,y:5},{x:16,y:8}],4)],
 },
 {
  id:'shangfang',chapter:5,year:234,name:'상방곡',title:'상방곡 탈출전',cols:18,rows:12,turnLimit:8,minimumRound:4,background:'shangfang-field.webp',location:'상방곡 · 좁은 골짜기',enemyName:'촉군 매복대',enemySeal:'蜀',goal:'escape',objective:'4턴의 비를 기다린 뒤 북서쪽 출구로 탈출하라',
  ...health,...supplies,parTurns:6,weather:'비가 오기 전',landmark:{x:2,y:2,name:'골짜기 출구'},checkpoints:[{id:'valley-exit',x:2,y:2,name:'골짜기 출구'}],deployment:deployment(9,8),
  fireTiles:Array.from({length:42},(_,i)=>({x:8+i%6,y:3+Math.floor(i/6)})),eventLabel:'화공과 소나기',eventRound:2,eventIds:['fire-started','fire-tick-2','fire-tick-3','rain-arrived'],
  briefing:'2·3턴에 불길 안의 부대가 HP 12 피해를 받습니다. 4턴의 비가 불을 끄면 출구에서 행동을 마쳐 탈출하세요. 격파보다 생존이 우선입니다.',
  victory:'상방곡의 화공은 갑자기 내린 비 때문에 실패했다. 사마의 부자는 죽음의 고비에서 벗어났지만, 뒤이어 위수 남쪽 진영을 잃었다.',
  terrain:board(18,12,p=>p.x===0||p.x===17||p.y===11||p.x===6&&p.y>4?'wall':p.y===2||p.x===4||p.y===9?'road':p.x<4&&p.y>3?'forest':'grass'),
  story:[
   line('삼국연의 · 제103회','zhuge','제갈량은 상방곡에 불붙일 것을 숨기고 사마의를 골짜기 안으로 유인했다.','삼국연의 제103회 · 화공에서 벗어나다.'),
   line('사마의','sima','촉군이 버리고 간 군량과 길을 따라왔는데, 골짜기에서 불길이 일어났다.'),
   line('사마사','shi','앞뒤의 길이 막혔습니다. 군사들이 불 속에 갇혔습니다.'),
   line('삼국연의 · 제103회','sima','사마의는 두 아들과 함께 죽을 위기에 놓였다. 그때 큰비가 내려 불을 껐다.'),
   line('삼국연의 · 제103회','zhuge','제갈량은 하늘을 우러러 탄식했다. 사마의 부자는 그 틈을 타 골짜기를 빠져나갔다.'),
   line('삼국연의 · 제103회','sima','부자는 달아났으나 위수 남쪽 진영까지 촉군에게 빼앗겼다. 북쪽을 지키는 긴 대치가 이어졌다.','불길은 표시된 칸에만 피해를 줍니다. 4턴 이후 출구가 열립니다.'),
  ],
  aftermath:[line('삼국연의 · 제103회','sima','갑작스러운 비가 부자의 목숨을 살렸다. 위수 남쪽 진영을 잃은 사마의는 북쪽 진영으로 물러나 굳게 지켰다.'),line('삼국연의 · 제103회','zhuge','제갈량은 오장원에 진을 치고 위군을 다시 끌어내려 했다. 이후의 승부는 공격보다 인내를 요구했다.')],
  units:choice=>{const a=army(4,choice,[{x:10,y:9},{x:11,y:7},{x:9,y:7},{x:10,y:6}]);Object.assign(a[2],{id:'zhao',name:'사마소',sprite:2,role:'호위'});return [...a,...troops('촉군',[{x:13,y:4},{x:14,y:7}],[{x:15,y:5}],4)];},
 },
 {
  id:'gaoping',chapter:8,year:249,name:'고평릉',title:'고평릉 정변',cols:20,rows:12,turnLimit:9,background:'gaoping-field.webp',location:'낙양 · 무고와 낙수 부교',enemyName:'조상부 수비대',enemySeal:'曹',goal:'occupy',objective:'무고를 먼저 확보하고 낙수 부교에 도달하라',
  bonus:'불필요한 교전 없이 접관',bonusNote:'직접 공격하지 않고 두 거점을 순서대로 확보하세요.',bonusRule:'noCombat',...supplies,parTurns:6,checkpoints:[{id:'arsenal',x:7,y:3,name:'무고'},{id:'luo-bridge',x:17,y:8,name:'낙수 부교'}],orderedCheckpoints:true,landmark:{x:7,y:3,name:'무고'},deployment:deployment(2,8),stationary:['b1','b2'],eventLabel:'조상부의 화살',eventRound:2,eventIds:['capital-arrows'],
  briefing:'무고와 부교에서 순서대로 행동을 마칩니다. 조상부의 궁병은 자리를 지킵니다. 우회와 방어 대기를 활용하세요. 조상을 쓰러뜨리는 전투가 아닙니다.',
  victory:'사마의는 무고를 장악하고 낙수의 부교를 지켰다. 조상은 허창으로 가자는 환범의 권고를 버리고 병권을 내놓았다. 이후 조상 일족은 처형됐다.',
  terrain:board(20,12,p=>p.x===14&&p.y!==8?'water':p.x===14&&p.y===8?'bridge':p.x>=6&&p.x<=8&&p.y<=2||p.x===11&&p.y>=1&&p.y<=6?'wall':p.y===8||p.x===7||p.y===3?'road':p.x<=1?'forest':'grass'),
  story:[
   line('삼국연의 · 제106~107회','sima','조예가 죽은 뒤 조상과 사마의가 조방을 보필했다. 조상은 권력을 독점했고 사마의는 병든 모습을 보이며 물러나 있었다.','삼국연의 제106~107회 · 낙양의 권력 이동.'),
   line('삼국연의 · 제106회','lisheng','이승은 사마의의 병을 살피러 왔다. 사마의는 말을 잘 듣지 못하고 죽을 삼키지 못하는 듯 꾸며 조상을 안심시켰다.'),
   line('삼국연의 · 제107회','caoshuang','조방과 조상 형제가 고평릉에 나가자 사마의는 움직였다. 고유와 왕관을 보내 조상 형제의 군영을 접관하게 했다.'),
   line('삼국연의 · 제107회','sima','사마의는 태후에게 아뢰고 무고를 장악했다. 조상부의 반거가 궁병에게 활을 쏘게 하여 길을 막았다.'),
   line('삼국연의 · 제107회','zhao','손겸이 활쏘기를 말렸고, 사마소가 아버지를 호위해 지나갔다. 사마의는 성을 나가 낙수 부교에 주둔했다.'),
   line('삼국연의 · 제107회','sima','낙양과 부교를 확보한 뒤 사신을 보내 조상에게 병권을 내놓으라고 했다.','금빛 1번 무고를 확보한 뒤 2번 부교로 이동하세요.'),
  ],
  aftermath:[line('삼국연의 · 제107회','caoshuang','환범은 천자를 모시고 허창으로 가서 군사를 모으라고 권했다. 조상은 병권만 거두겠다는 말을 믿고 돌아와 항복했다.'),line('삼국연의 · 제107회','sima','사마의는 조상과 그 측근들을 역모로 처형하고 일족을 멸했다. 이 사건 뒤 사마씨는 조정의 권력을 장악했다.')],
  units:choice=>{const a=army(6,choice,[{x:3,y:9},{x:3,y:7},{x:4,y:7},{x:3,y:6}]);Object.assign(a[2],{id:'zhao',name:'사마소',role:'호위'});return [...a,...troops('조상부',[],[{x:10,y:5},{x:10,y:7}],4)];},
 },
 {
  id:'yangping',chapter:9,year:249,name:'양평관',title:'양평관 회군전',cols:20,rows:12,turnLimit:9,commanderName:'사마사',background:'yangping-field.webp',location:'양평관 · 연노 매복길',enemyName:'촉군',enemySeal:'蜀',goal:'escape',objective:'사마사를 살려 동남쪽 회군로로 빠져나가라',
  ...health,...supplies,parTurns:6,checkpoints:[{id:'safe-return',x:17,y:9,name:'낙양 회군로'}],landmark:{x:17,y:9,name:'낙양 회군로'},deployment:deployment(3,2),stationary:['jiangwei'],eventLabel:'연노 매복',eventRound:2,eventIds:['crossbows-fired'],
  briefing:'사마의의 명령을 받은 사마사를 직접 지휘합니다. 2턴에 북쪽 길의 연노 매복이 HP 15 피해를 줍니다. 강유 처치는 필수가 아닙니다.',
  victory:'사마사는 강유를 뒤쫓다가 양평관의 연노 매복을 만나 달아났다. 곡산에서는 구안이 위에 항복했고, 사마사는 낙양으로 돌아갔다.',
  terrain:board(20,12,p=>p.x===10&&p.y<7?'wall':p.y===7||p.y===9||p.x===5?'road':p.x<=2||p.y===0||p.x>=14&&p.y<=5?'forest':'grass'),
  story:[
   line('삼국연의 · 제107~108회','sima','강유의 군사가 옹주를 위협했다. 곽회의 보고를 받은 사마의는 조정과 의논한 뒤 장자 사마사를 원군으로 보냈다.','삼국연의 제107~108회 · 마지막 임무의 직접 지휘 장수는 사마사입니다.'),
   line('삼국연의 · 제108회','shi','사마사는 촉군이 약해졌다고 보고 뒤를 쫓았다. 추격은 양평관까지 이어졌다.'),
   line('삼국연의 · 제108회','jiangwei','강유는 제갈량에게 배운 연노를 양쪽에 숨겨 두었다. 한 번에 열 발을 쏘는 쇠뇌에 위군의 선두가 쓰러졌다.'),
   line('삼국연의 · 제108회','shi','사마사는 어지러운 군사들 사이에서 목숨을 건져 돌아갔다.'),
   line('삼국연의 · 제108회','sima','곡산의 구안은 구원이 닿지 않자 위군에 항복했다. 강유는 한중으로 물러났고 사마사는 낙양으로 돌아갔다.'),
   line('삼국연의 · 제108회','sima','이 싸움 뒤 사마의의 생애는 마지막 장으로 접어든다. 양평관에서 잃은 군사들은 돌아오지 못했다.','회군로에서 행동을 마치면 임무가 끝나고 251년 엔딩을 볼 수 있습니다.'),
  ],
  aftermath:[line('삼국연의 · 제108회','shi','사마사는 추격에 성공한 것이 아니라 연노의 매복에서 살아 돌아왔다. 낙양으로 돌아간 뒤 아버지의 마지막 부탁을 들었다.'),line('삼국연의 · 제108회','sima','251년 가을, 사마의의 병이 깊어졌다. 그는 사마사와 사마소를 불러 국정을 신중하게 다스리라고 당부했다.')],
  units:choice=>{const a=army(6,choice,[{x:4,y:3},{x:3,y:5},{x:5,y:5},{x:4,y:6}]);Object.assign(a[0],{name:'사마사',role:'총지휘',sprite:1});Object.assign(a[1],{id:'vanguard',name:'위군 선봉',sprite:4});Object.assign(a[2],{id:'cavalry',name:'위군 기병'});Object.assign(a[3],{id:'archer',name:'위군 궁병'});return [...a,unit('jiangwei','강유','enemy',4,2,2,{role:'촉군 대장',hp:195,maxHp:195,attack:34,defense:30,boss:true}),...troops('연노',[{x:7,y:2}],[{x:8,y:4},{x:9,y:6}],5)];},
 },
];
