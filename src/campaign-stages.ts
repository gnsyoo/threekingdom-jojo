/** Tactical episodes of the Romance campaign. No claim of fifty separate historical battles. */
import type {Scenario,Choice} from './scenarios.ts';
import type {Terrain,Point} from './core.ts';
import {board,deployment,unit,weiArmy,line} from './scenario-kit.ts';
export const CAMPAIGN_ARCS=[
 {id:'shangyong',name:'상용 급습',year:228,source:'제94회',count:6,theme:'신성의 산길과 성밖 진영'},
 {id:'jieting',name:'가정 차단',year:228,source:'제95회',count:6,theme:'가정의 능선과 물길'},
 {id:'xicheng',name:'서성 회군',year:228,source:'제95회',count:5,theme:'열린 성문과 성밖 도로'},
 {id:'qishan',name:'기산 방어',year:231,source:'제101회',count:5,theme:'산악 방어선과 위군 진영'},
 {id:'shangfang',name:'상방곡 화공',year:234,source:'제103회',count:5,theme:'좁은 골짜기와 건조한 절벽'},
 {id:'wuzhang',name:'오장원 대치',year:234,source:'제103~104회',count:6,theme:'위수 북쪽 평원과 방벽'},
 {id:'liaodong',name:'요동 포위',year:238,source:'제106회',count:7,theme:'요수의 강변과 양평성의 젖은 들판'},
 {id:'gaoping',name:'고평릉 정변',year:249,source:'제106~107회',count:5,theme:'낙양의 무고와 낙수 부교'},
 {id:'yangping',name:'양평관 회군',year:249,source:'제107~108회',count:5,theme:'가을 숲과 연노 매복길'},
] as const;
export type ArcId=typeof CAMPAIGN_ARCS[number]['id'];
export type StageId=`${ArcId}-${'01'|'02'|'03'|'04'|'05'|'06'}`;
type Goal=Scenario['goal'];
interface Episode {id:StageId;title:string;goal:Goal;place:string;setup:string;order:string;report:string;next:string;pointName:string;effect?:'notice'|'disrupt'|'rally';}
export const EPISODES:Episode[]=[
 {id:'shangyong-01',title:'신성 접근로 정찰',goal:'occupy',place:'신성 서쪽 산길',setup:'신의가 맹달의 반심을 알렸다. 성으로 이어지는 길을 먼저 살펴야 한다.',order:'정찰 지점을 확인하고 돌아오는 길을 열어 두어라. 적의 눈을 피하는 것도 군략이다.',report:'신성으로 향하는 길과 적 전초의 위치를 확인했다.',next:'맹달에게 의심을 주지 않으면서 진군할 준비를 갖춘다.',pointName:'정찰 지점'},
 {id:'shangyong-02',title:'격문 전달로 확보',goal:'escape',place:'신성 남쪽 역로',setup:'사마의는 양기를 먼저 보내 맹달에게 출정을 준비하라는 격문을 전하게 했다.',order:'격문이 닿을 길을 확보하라. 길목의 적을 모두 쫓느라 시간을 잃지 마라.',report:'성밖 역로를 지나 격문 전달을 뒷받침할 통로를 열었다.',next:'맹달이 위군의 의도를 헤아리기 전에 행군을 서두른다.',pointName:'역로 출구'},
 {id:'shangyong-03',title:'급행군 보급선',goal:'hold',place:'신성 산 아래 보급영',setup:'조칙을 기다리며 오가면 한 달이 걸린다. 사마의는 하루에 이틀 길을 가라고 명했다.',order:'빠른 행군에도 뒤의 군량은 지켜야 한다. 전열을 붙이고 보급영을 잃지 마라.',report:'행군 대열 뒤의 보급영을 지켜 급습을 이어갈 준비를 마쳤다.',next:'앞서 확보한 산길로 선봉과 본대가 함께 나아간다.',pointName:'보급영',effect:'rally'},
 {id:'shangyong-04',title:'신성 외곽 전초전',goal:'defeat',place:'신성 서문 외곽',setup:'위군이 예상보다 빠르게 다가왔다. 맹달은 아직 원군과 성안의 호응을 믿고 있다.',order:'외곽의 저항을 끊고 성을 둘러싸라. 민가를 약탈하여 군심을 잃어서는 안 된다.',report:'성밖 전초의 지휘가 무너졌다. 위군은 신성 포위를 준비한다.',next:'성안의 신의와 신탐이 어느 편에 설지 마지막으로 확인한다.',pointName:'전초 진영'},
 {id:'shangyong-05',title:'내응 연락선',goal:'occupy',place:'신성 북쪽 연락로',setup:'신의와 신탐의 호응이 성문을 여는 열쇠다. 성안의 이보와 등현도 맹달의 움직임을 살핀다.',order:'연락 지점과 포위 길목을 차례로 확보하라. 내응할 사람을 성급히 드러내지 마라.',report:'내응을 확인할 길목과 연락 지점을 확보했다.',next:'원군이 오기 전에 신성을 급습한다. 이제 맹달의 지휘를 끊어야 한다.',pointName:'연락 지점',effect:'disrupt'},
 {id:'jieting-01',title:'한중 보급로 탐색',goal:'occupy',place:'가정 서쪽 산 아래',setup:'맹달의 반란을 수습한 사마의는 장안으로 돌아가 촉군을 막을 임무를 받았다.',order:'가정과 열류성의 길을 살펴라. 한중에서 오는 군량이 어느 길을 지나는지 알아야 한다.',report:'촉군의 보급이 가정의 길목에 의지하고 있음을 확인했다.',next:'장합의 선봉을 보내되 제갈량의 매복을 경계한다.',pointName:'보급로 관측점'},
 {id:'jieting-02',title:'장합 선봉 엄호',goal:'hold',place:'가정 협곡 입구',setup:'장합이 가정으로 먼저 나아간다. 사마의는 멀리 정찰하고 가볍게 전진하지 말라고 경계했다.',order:'선봉이 지세를 살피는 동안 입구를 지켜라. 좁은 길에서 부대를 흩뜨리지 마라.',report:'선봉의 정찰이 이어지는 동안 협곡 입구를 지켰다.',next:'마속이 산 위에 진을 친 까닭과 산 아래의 빈틈을 살핀다.',pointName:'협곡 입구',effect:'rally'},
 {id:'jieting-03',title:'산 아래 길목전',goal:'defeat',place:'가정 남쪽 대로',setup:'왕평은 길목에 진을 쳐야 한다고 간했지만 마속은 산 위로 군사를 올렸다.',order:'산 아래 전초를 밀어내라. 높은 진영을 바로 치기보다 물과 길의 연결을 보라.',report:'산 아래 전초를 물려 가정 대로에 접근할 길을 열었다.',next:'촉군이 진영과 물길 사이를 오가는 길을 확인한다.',pointName:'산 아래 전초'},
 {id:'jieting-04',title:'물길 접근전',goal:'occupy',place:'가정의 좁은 수로',setup:'산 위 진영은 물을 길어 올리는 군사와 보급에 기대고 있다. 사마의는 그 연결을 끊으려 한다.',order:'물길 가까운 정찰점과 남쪽 길을 확보하라. 아직 산 위로 올라갈 필요는 없다.',report:'물길로 이어지는 접근로를 장악했다.',next:'가정 대로의 바깥 저항을 정리하고 차단을 완성한다.',pointName:'수로 접근점',effect:'disrupt'},
 {id:'jieting-05',title:'가정 대로 우회',goal:'escape',place:'가정 동쪽 우회로',setup:'산길의 정면만 바라보면 가정 대로를 놓친다. 장합의 군사는 촉군 진영 바깥으로 돌아간다.',order:'우회로 끝까지 전열을 옮겨라. 물길과 대로를 함께 막을 자리를 잡는다.',report:'촉군의 진영 바깥을 돌아 대로를 차단할 위치에 닿았다.',next:'마속을 뒤쫓기보다 물길과 가정 대로를 확보하여 북벌의 보급을 끊는다.',pointName:'대로 합류점'},
 {id:'xicheng-01',title:'서성 접근로',goal:'occupy',place:'서성 외곽 도로',setup:'가정을 잃은 제갈량은 촉군의 퇴각을 준비했다. 위군은 서성으로 향한다.',order:'성밖의 관측점을 확인하라. 가정에서 이겼다고 제갈량의 모든 계책을 안 것은 아니다.',report:'서성의 성문과 성밖 도로를 관측할 자리를 잡았다.',next:'성문이 열려 있는데도 수비대의 움직임이 적은 까닭을 살핀다.',pointName:'서성 관측점'},
 {id:'xicheng-02',title:'열린 성문 경계',goal:'hold',place:'서성 남문 앞 들판',setup:'성문이 크게 열려 있고 백성이 길을 쓴다. 겉으로 보이는 적은 군사만으로 속단할 수 없다.',order:'성문으로 돌입하지 말고 전열을 지켜라. 수비대가 자리를 지키는 동안 상황을 살핀다.',report:'위군은 성밖에서 전열을 유지했다. 성안의 상황은 여전히 확실하지 않다.',next:'성루에서 들리는 거문고 소리에 사마의의 의심이 깊어진다.',pointName:'성밖 대기선'},
 {id:'xicheng-03',title:'성루 관측과 회군로',goal:'occupy',place:'서성 서쪽 갈림길',setup:'제갈량이 성루에서 거문고를 타고 있다. 사마소는 군사가 없어 보인다며 나아가자고 한다.',order:'돌아갈 길부터 확인하라. 성안에 매복이 있다고 판단한다면 퇴로를 잃어서는 안 된다.',report:'성밖 갈림길과 북서쪽 회군로의 연결을 확인했다.',next:'사마의는 열린 성문을 함정으로 여기고 군사를 물리기로 한다.',pointName:'회군 갈림길'},
 {id:'xicheng-04',title:'서성 후위 정비',goal:'escape',place:'서성 북서쪽 후위로',setup:'사마의는 제갈량이 평생 조심스럽게 군사를 썼다고 생각했다. 큰 성문을 연 모습이 오히려 매복을 의심하게 한다.',order:'후위가 흩어지지 않게 회군로로 옮겨라. 불필요하게 활이 닿는 성문 앞에 남지 마라.',report:'위군 후위가 성문 앞을 벗어날 준비를 마쳤다.',next:'본대도 방향을 돌려라. 성안에 어떤 계책이 있었는지는 돌아간 뒤 확인하겠다.',pointName:'후위 합류로'},
 {id:'qishan-01',title:'기산 방어선 구축',goal:'occupy',place:'기산 서쪽 능선',setup:'231년, 제갈량의 북벌은 계속됐다. 사마의는 진영을 굳히며 함부로 나가 싸우지 않으려 한다.',order:'능선 아래 방어점과 진영 통로를 확보하라. 흩어진 부대를 먼저 하나의 전열로 묶는다.',report:'기산 방어선의 길목을 확보했다.',next:'촉군의 압박이 와도 보급과 전열을 함께 지킨다.',pointName:'방어 거점'},
 {id:'qishan-02',title:'기산 보급영 방어',goal:'hold',place:'기산 숲 가장자리',setup:'진영을 지키는 싸움은 군량을 지키는 싸움이기도 하다. 장합은 출전과 추격으로 공을 세우려 한다.',order:'숲과 진영을 이용하여 보급영을 지켜라. 적이 가깝다고 전군을 앞으로 보내지 마라.',report:'촉군의 압박 속에서도 위군 보급영을 지켰다.',next:'협곡의 전초를 정리하되 멀리 달아나는 적까지 쫓지는 않는다.',pointName:'보급 진영',effect:'rally'},
 {id:'qishan-03',title:'기산 협곡 전초전',goal:'defeat',place:'기산 협곡 동쪽',setup:'촉군의 선봉이 좁은 길을 시험한다. 방어선의 바깥을 정리할 필요가 있다.',order:'협곡 전초를 물리치고 진영으로 돌아갈 길을 남겨라. 깊은 추격은 별개의 위험이다.',report:'협곡의 전초가 물러났다. 위군 방어선은 유지된다.',next:'촉군의 군량 사정과 회군 조짐을 살핀다.',pointName:'협곡 전초'},
 {id:'qishan-04',title:'회군 징후 정찰',goal:'occupy',place:'기산 동쪽 관측로',setup:'촉군의 움직임이 달라진다. 군량이 부족한 듯하며 진영을 거두려는 징후가 보인다.',order:'관측점에서 움직임을 살펴라. 적의 퇴각과 매복 없는 길을 같은 뜻으로 여기지 마라.',report:'촉군의 회군 징후를 확인했다. 험한 길의 추격은 여전히 위험하다.',next:'기산 진영을 지켜라. 장합에게도 험한 길에서 깊이 추격하지 말라고 다시 전한다.',pointName:'회군 관측점'},
 {id:'shangfang-01',title:'위수 남쪽 정찰',goal:'occupy',place:'위수 남안 들판',setup:'234년, 제갈량과 사마의의 대치가 이어진다. 촉군의 움직임이 상방곡 쪽으로 위군을 끌어당긴다.',order:'남안의 길목을 살펴라. 버린 군량만 보고 적이 무너졌다고 단정하지 마라.',report:'상방곡으로 이어지는 길의 정찰을 마쳤다.',next:'물러나는 촉군이 남겨 놓은 군량과 골짜기 입구를 확인한다.',pointName:'남안 정찰점'},
 {id:'shangfang-02',title:'버려진 군량 접근전',goal:'defeat',place:'상방곡 바깥 군량로',setup:'촉군이 군량을 버리고 골짜기 안쪽으로 물러난다. 앞서 가는 군사를 따라가되 본대와의 연락을 놓치지 않아야 한다.',order:'바깥 전초의 저항을 끊고 대열을 붙여라. 군량을 쫓아 혼자 앞서 나가지 마라.',report:'골짜기 바깥의 저항을 물리고 군량로에 접근했다.',next:'사마의와 두 아들을 호위하며 좁은 입구로 들어간다.',pointName:'군량 전초'},
 {id:'shangfang-03',title:'골짜기 입구 호위',goal:'escape',place:'상방곡 좁은 입구',setup:'사마사와 사마소가 아버지를 호위한다. 길은 좁아지고 뒤의 군사와 연락하기 어려워진다.',order:'부자를 지키며 합류 지점으로 옮겨라. 입구에서 부대가 갈라지지 않도록 한다.',report:'호위 부대가 골짜기 안쪽 합류점에 닿았다.',next:'위군은 앞뒤 길이 막힐 위험 속에서 전열을 다시 모은다.',pointName:'안쪽 합류점'},
 {id:'shangfang-04',title:'상방곡 전열 유지',goal:'hold',place:'상방곡 안쪽 빈터',setup:'골짜기 깊은 곳에서 촉군의 매복이 드러난다. 불을 붙일 준비가 된 지세에서 위군의 퇴로가 위험하다.',order:'흩어지지 말고 부자를 호위하라. 앞뒤가 막혔다고 전열을 버리면 살아날 틈도 잃는다.',report:'매복의 압박 속에서도 호위 전열을 지켰다.',next:'길목에서 연기가 오른다. 아들들을 곁에 모으고 불길 속에서도 살아날 길을 찾아라.',pointName:'호위 대기선',effect:'rally'},
 {id:'wuzhang-01',title:'위수 북안 회군로',goal:'escape',place:'위수 북쪽 도로',setup:'상방곡의 비가 사마의 부자를 살렸다. 그러나 위수 남쪽 진영은 촉군에게 넘어갔다.',order:'남쪽을 되찾겠다고 무리하지 마라. 북쪽 진영으로 군사를 거두어 전열을 세운다.',report:'위군은 북안의 회군로를 따라 진영에 합류했다.',next:'제갈량이 어느 지세에 새 진영을 두는지 확인한다.',pointName:'북안 합류로'},
 {id:'wuzhang-02',title:'무공 방향 관측',goal:'occupy',place:'오장원 동쪽 관측선',setup:'곽회가 제갈량의 움직임을 보고한다. 사마의는 무공으로 나와 동쪽으로 향하면 위험하다고 판단했다.',order:'동쪽 관측점과 진영 연락로를 살펴라. 적의 행선지를 알고서 방어할 자리를 정한다.',report:'제갈량의 군사가 오장원 일대에 머무는 움직임을 확인했다.',next:'북쪽 진영과 서쪽 보급선을 정비한다.',pointName:'동쪽 관측점'},
 {id:'wuzhang-03',title:'북안 보급영 방어',goal:'hold',place:'오장원 서쪽 숲길',setup:'남쪽 진영을 잃은 위군에게 남은 보급선은 중요하다. 긴 대치를 견딜 군량을 확보해야 한다.',order:'서쪽 숲길과 보급영을 지켜라. 공격보다 장수의 체력과 군량을 보존한다.',report:'서쪽 보급선이 유지되어 위군은 진영을 지킬 수 있게 됐다.',next:'적 선봉의 압박을 정리하되 오장원 깊숙이 추격하지 않는다.',pointName:'서쪽 보급영',effect:'rally'},
 {id:'wuzhang-04',title:'오장원 전초 압박',goal:'defeat',place:'오장원 북쪽 전초',setup:'촉군의 선봉이 위군을 진영 밖으로 끌어내려 한다. 가까운 전초의 압박부터 걷어 내야 한다.',order:'전초의 지휘를 끊되 추격을 길게 늘이지 마라. 진영을 비우지 않는 것이 이번 싸움의 기준이다.',report:'전초의 압박을 물리쳤다. 위군 본대는 진영을 떠나지 않았다.',next:'제갈량의 도발이 사마의와 위군 장수들에게 도착한다.',pointName:'북쪽 전초'},
 {id:'wuzhang-05',title:'출전 조칙과 진영',goal:'occupy',place:'오장원 지절 연락로',setup:'제갈량이 여인의 머리쓰개와 옷을 보내 결전을 요구했다. 신비는 지절을 들고 출전하지 말라는 조칙을 전한다.',order:'조칙을 전달할 진영 통로를 확보하라. 분노로 출전하려는 장수들도 군령을 따르게 한다.',report:'진영 사이의 연락로를 확보하여 출전 금지 조칙을 전달했다.',next:'도발은 받되 진영을 지킨다. 적이 움직이려 할 때까지 우리 전열을 굳게 유지하라.',pointName:'지절 연락점'},
 {id:'liaodong-01',title:'요동 진군로 확보',goal:'occupy',place:'요동 서쪽 진군로',setup:'238년, 연왕을 칭한 공손연을 토벌하라는 명을 받았다. 사마의는 군사를 이끌고 요동으로 향한다.',order:'진군로의 관측점과 보급 통로를 확보하라. 먼 원정에서는 돌아갈 길도 군량과 함께 계산한다.',report:'요동으로 이어지는 진군로와 보급 통로를 확보했다.',next:'비연과 양조가 요수에 설치한 목책과 참호를 살핀다.',pointName:'진군 거점'},
 {id:'liaodong-02',title:'요수 목책 정찰',goal:'hold',place:'요수 서쪽 관측영',setup:'호준은 비연과 양조가 요수에 진을 치고 참호와 목책으로 길을 막았다고 보고한다.',order:'정면의 관측영을 지키며 적을 살펴라. 목책을 억지로 깨는 것만이 성으로 가는 길은 아니다.',report:'요수 방어선의 지세와 적이 지키는 방향을 확인했다.',next:'사마의는 그 방어선을 버리고 양평으로 곧장 향할 계책을 세운다.',pointName:'요수 관측영'},
 {id:'liaodong-03',title:'양평 우회 행군',goal:'escape',place:'요수 북쪽 우회로',setup:'사마의는 요수의 방어선을 두고 양평으로 향한다. 적이 성을 구원하려 뒤따르게 만드는 수다.',order:'우회로 끝까지 본대를 옮겨라. 성으로 향하는 속도를 잃지 않으면서 후위를 연결한다.',report:'위군 본대가 요수의 정면을 피하여 양평 접근로에 닿았다.',next:'뒤따라올 적을 막을 길목을 확보한다.',pointName:'양평 접근로'},
 {id:'liaodong-04',title:'수산 길목 차단',goal:'defeat',place:'수산 아래 전초로',setup:'요수의 적은 양평을 구원하려 움직인다. 사마의는 하후패와 하후위에게 뒤따르는 적을 길목에서 치게 한다.',order:'길목의 전초를 물리고 본대의 뒤를 보호하라. 적을 움직이게 한 계책을 진영의 안전으로 이어야 한다.',report:'수산 아래 길목의 전초를 물려 위군 본대의 뒤를 지켰다.',next:'양평을 포위할 자리를 잡아라. 비연이 다시 전열을 세우기 전에 성의 바깥 길을 막는다.',pointName:'수산 전초'},
 {id:'liaodong-05',title:'장마 속 포위영',goal:'hold',place:'양평성 서쪽 젖은 들판',setup:'양평을 둘러싼 뒤 한 달 동안 비가 내린다. 진영을 옮기자는 청에도 사마의는 자리를 지킨다.',order:'젖은 들판에서도 전열과 군량을 지켜라. 비가 그칠 때까지 성을 억지로 공격하지 않는다.',report:'장마 속에서도 포위영과 군량을 유지했다.',next:'공손연군은 성안에서 군량이 줄고 위군은 포위 준비를 이어간다.',pointName:'포위 보급영',effect:'rally'},
 {id:'liaodong-06',title:'운제 접근로',goal:'occupy',place:'양평성 서문 공성로',setup:'비가 그치면 토산을 쌓고 땅굴을 파며 운제를 세울 준비가 필요하다. 공손연이 달아날 길도 살펴야 한다.',order:'성문 앞 접근점과 포위 길목을 확보하라. 빠져나가는 적을 놓치지 않게 외곽을 연결한다.',report:'공성 준비에 필요한 접근로와 외곽 길목을 확보했다.',next:'양평 포위를 마무리한다. 공손연과 비연의 지휘를 함께 제압할 때다.',pointName:'공성 접근점'},
 {id:'gaoping-01',title:'낙양 소집로',goal:'occupy',place:'낙양 서쪽 군영로',setup:'조예가 죽은 뒤 조상과 사마의가 조방을 보필했다. 조상이 권력을 독점하자 사마의는 병든 모습을 보이며 물러나 있었다.',order:'병든 모습을 보고 조상이 안심한 사이 군영의 연락로를 확인하라. 움직일 때와 숨길 때를 구별한다.',report:'낙양 군영을 잇는 연락로를 확인했다.',next:'조방과 조상 형제가 고평릉에 나가는 때를 기다린다.',pointName:'군영 연락점'},
 {id:'gaoping-02',title:'성문 통제선',goal:'hold',place:'낙양 서쪽 성문',setup:'249년, 조방과 조상 형제가 고평릉으로 나간다. 사마의는 태후에게 아뢰고 움직일 때를 잡는다.',order:'소집된 군사의 전열과 성문 통제선을 지켜라. 성밖으로 무작정 적을 쫓는 싸움이 아니다.',report:'낙양 성문 쪽 전열을 유지했다.',next:'고유와 왕관이 조상 형제의 군영을 접관할 통로를 확보한다.',pointName:'성문 통제선'},
 {id:'gaoping-03',title:'군영 접관 통로',goal:'occupy',place:'낙양 군영 앞 도로',setup:'고유와 왕관이 조상 형제의 군영을 접관하도록 보내졌다. 낙양 안의 병권을 장악하는 것이 먼저다.',order:'접관할 통로와 연락 거점을 확보하라. 불필요한 교전은 피하고 군령을 연결한다.',report:'군영 접관을 뒷받침할 통로를 확보했다.',next:'조상부의 반거가 궁병을 배치한 길을 지나 무고로 향한다.',pointName:'접관 연락점'},
 {id:'gaoping-04',title:'조상부 앞 호위로',goal:'escape',place:'낙양 무고 서쪽 접근로',setup:'반거는 궁병에게 사마의를 향해 활을 쏘게 한다. 손겸이 이를 말리고 사마소가 아버지를 호위한다.',order:'아들의 호위와 우군 방침을 이용해 접근로를 통과하라. 조상을 이곳에서 쓰러뜨리는 것이 목표가 아니다.',report:'호위 부대가 위협받는 길목을 지나 무고 접근로에 합류했다.',next:'무고를 장악한 뒤 낙수 부교로 향한다. 두 거점의 순서를 지켜야 한다.',pointName:'무고 접근로'},
 {id:'yangping-01',title:'옹주 원군 연락로',goal:'occupy',place:'옹주 서쪽 군영로',setup:'강유가 옹주를 위협하자 곽회가 보고했다. 사마의는 조정과 의논하고 사마사를 원군으로 보낸다.',order:'사마사에게 길목과 원군 연락을 맡긴다. 이번 원정에서 직접 지휘하는 장수는 사마사다.',report:'사마사가 원군 연락로와 군영 접근점을 확보했다.',next:'촉군의 움직임을 살피며 곡산으로 이어지는 길을 확인한다.',pointName:'원군 연락점'},
 {id:'yangping-02',title:'곡산 보급 차단',goal:'defeat',place:'곡산 서쪽 전초로',setup:'곡산의 구안이 구원을 기다린다. 사마사는 촉군의 진영과 보급로를 압박한다.',order:'전초를 물리고 길을 확보하라. 적이 약해 보인다고 매복에 대한 경계를 버려서는 안 된다.',report:'곡산으로 이어지는 전초의 압박을 정리했다.',next:'물러나는 촉군의 뒤를 따라 양평관 쪽으로 향한다.',pointName:'곡산 전초'},
 {id:'yangping-03',title:'양평관 추격로',goal:'occupy',place:'양평관 북쪽 갈림길',setup:'사마사가 촉군의 퇴각을 따라 양평관으로 향한다. 적이 전열을 거두는 것인지, 다른 계책이 있는 것인지는 아직 알 수 없다.',order:'추격로의 관측점을 확인하라. 원정을 맡았다고 적의 계책을 모두 꿰뚫은 것은 아니다.',report:'양평관으로 이어지는 길목에 닿았다. 촉군의 매복은 아직 드러나지 않았다.',next:'길이 좁아지는 곳에서 후위와 본대의 연결을 지킨다.',pointName:'추격 관측점'},
 {id:'yangping-04',title:'양평관 후위 엄호',goal:'hold',place:'양평관 서쪽 협로',setup:'위군의 추격이 양평관까지 이어진다. 연노가 기다리는 길에 선두가 다가가고 있다.',order:'후위가 끊기지 않게 전열을 유지하라. 선두에서 화살이 쏟아져도 돌아갈 길을 남겨 두어야 한다.',report:'후위가 본대와 연결될 자리를 지켰다.',next:'강유의 연노 매복이 드러난다. 사마사를 살려 동남쪽 회군로로 물려야 한다.',pointName:'후위 합류영',effect:'rally'},
];

function arcOf(id:StageId){return CAMPAIGN_ARCS.find(a=>id.startsWith(`${a.id}-`))!;}
export function buildEpisodes():Scenario[]{
 return EPISODES.map((e,index)=>{
  const arc=arcOf(e.id),arcIndex=CAMPAIGN_ARCS.indexOf(arc),level=3+Math.floor(arcIndex/3),seed=index+1;
  const cols=18,rows=12,reverse=seed%5===0,start=reverse?12:3,roadX=reverse?13:4,roadY=seed%2?7:6;
  const river=['shangyong','liaodong','gaoping'].includes(arc.id),ridge=['jieting','qishan','shangfang','yangping'].includes(arc.id);
  const checkpoints=e.goal==='occupy'?[{id:'point-a',x:reverse?8:9,y:roadY,name:e.pointName},{id:'point-b',x:reverse?3:15,y:3+seed%3,name:'전열 합류점'}]:e.goal==='escape'?[{id:'exit',x:reverse?2:16,y:2+seed%3,name:e.pointName}]:undefined;
  const landmark=checkpoints?.[0]??{x:reverse?13:4,y:7,name:e.pointName};
  const places=[{x:start+1,y:9},{x:start,y:7},{x:start+2,y:7},{x:start+1,y:6}];
  const enemies=reverse?[{x:4,y:4},{x:6,y:6},{x:3,y:7},{x:5,y:2}]:[{x:14,y:4},{x:11,y:7},{x:15,y:6},{x:12,y:2}];
  const safe=[...deployment(start,8),...places,...enemies,...(checkpoints??[]),landmark];
  const terrain=board(cols,rows,p=>{
   let t:Terrain='grass';
   if(p.x<=1||p.y===0&&p.x<7||p.x>=15&&p.y===0)t='forest';
   if((p.x===2&&p.y>3&&p.y<7&&seed%3===0)||(p.x>=13&&p.x<=14&&p.y>=8&&p.y<=9&&seed%3===1))t='forest';
   if(ridge&&p.x===9+(seed%2)&&p.y<5)t='wall';
   if(!ridge&&(p.x>=7&&p.x<=8&&p.y>=1&&p.y<=2||p.x===16&&p.y>=8))t='wall';
   if(p.x>=6&&p.x<=7&&p.y>=4&&p.y<=5)t='camp';
   if(p.x===3&&p.y===3&&seed%2===0)t='village';
   if(p.x===roadX||p.y===roadY||p.y===3&&seed%4===0)t='road';
   if(river&&p.x===10)t=p.y===roadY?'bridge':'water';
   if(safe.some(q=>q.x===p.x&&q.y===p.y)&&['wall','water'].includes(t))t='grass';
   return t;
  });
  const rounds=e.goal==='hold'?3+seed%3:12;
  const eventId=`${e.id}-signal`,effect=e.effect??'notice';
  const message=effect==='rally'?'군령이 닿았다. 생존한 위군 부대가 HP 12를 회복했다.':effect==='disrupt'?'전초의 연락이 끊겼다. 일반 적 부대가 한 라운드 혼란에 빠졌다.':`${e.place}의 보고가 도착했다. 목표와 퇴로를 다시 확인하라.`;
  return {
   id:e.id,chapter:0,arcId:arc.id,episode:Number(e.id.slice(-2)),year:arc.year,name:e.place,title:e.title,cols,rows,turnLimit:rounds,background:`${e.id}-field.webp`,
   location:e.place,enemyName:arc.id==='shangyong'?'맹달군':arc.id==='liaodong'?'공손연군':arc.id==='gaoping'?'조상부 수비대':'촉군',enemySeal:arc.id==='gaoping'?'曹':arc.id==='liaodong'?'燕':arc.id==='shangyong'?'孟':'蜀',
   goal:e.goal,movementLabel:e.goal==='escape'?(['shangfang-03','gaoping-04'].includes(e.id)?'호위':['shangyong-02','jieting-05','liaodong-03'].includes(e.id)?'행군':'회군'):undefined,objective:e.goal==='hold'?`지휘관을 지키며 ${rounds}턴까지 버텨라`:e.goal==='defeat'?'전초 지휘대를 제압하라':e.goal==='occupy'?`${e.pointName}과 전열 합류점을 확보하라`:`${e.pointName}으로 이동하라`,holdUntil:e.goal==='hold'?rounds:undefined,checkpoints,orderedCheckpoints:e.goal==='occupy',landmark,deployment:deployment(start,8),terrain,parTurns:e.goal==='hold'?rounds:e.goal==='escape'?6:e.goal==='occupy'?8:9,
   commanderName:arc.id==='yangping'?'사마사':undefined,stationary:e.goal==='escape'||arc.id==='xicheng'||arc.id==='gaoping'?['b1','leader']:undefined,
   bonus:e.goal==='escape'?'교전 없이 이동':'지휘관 체력 절반 이상',bonusNote:e.goal==='escape'?'직접 공격하지 않고 이동 목표를 달성하세요.':'목표 달성 때 지휘관 HP를 50% 이상 남기세요.',bonusRule:e.goal==='escape'?'noCombat':'health',
   briefing:e.goal==='hold'?`지휘관을 지키며 ${rounds}턴 시작까지 버티세요. 숲·진영과 방어 대기를 이용합니다.`:e.goal==='defeat'?'전초 지휘대를 제압하세요. 주변 부대는 우군 방침과 이동·공격으로 상대합니다.':e.goal==='occupy'?'두 금빛 거점에서 순서대로 행동을 마치세요. 이동만으로 확보되지 않습니다.':'금빛 합류점에서 행동을 마치세요. 모든 적을 제압할 필요는 없습니다.',
   protectLabel:'전열과 보급을 지킨다',protectNote:'원정 보급',protectDescription:'회복약을 확보하고 방어 지형을 이용합니다.',advanceLabel:'빠른 진군을 택한다',advanceDescription:'첫 라운드의 공격을 강화해 길목을 엽니다.',
   eventLabel:effect==='rally'?'군령과 회복':effect==='disrupt'?'연락선 차단':'길목의 보고',eventRound:2,eventIds:[eventId],scriptedEvents:[{id:eventId,round:2,message,kind:effect}],
   weather:arc.id==='liaodong'?'장마의 들판':arc.id==='yangping'?'가을 산길':undefined,
   victory:e.report,
   story:[line('사마의','sima',e.setup,`삼국연의 ${arc.source} · ${arc.year}년 / 원전 원정을 전술 임무로 나눈 장면`),line(arc.id==='yangping'?'사마사':'군중 보고',arc.id==='yangping'?'shi':arc.id==='jieting'||arc.id==='qishan'?'he':'guo',`${e.place}에 부대를 모았습니다. ${e.pointName}을 확인할 준비가 됐습니다.`),line('사마의','sima',e.order),line(arc.id==='yangping'?'사마사':'군중 보고',arc.id==='yangping'?'shi':'shi',e.goal==='hold'?`정해진 ${rounds}턴까지 전열을 지키겠습니다.`:e.goal==='defeat'?'전초의 지휘를 물리고 길을 열겠습니다.':e.goal==='occupy'?'거점을 확보하고 뒤의 전열과 합류하겠습니다.':'합류 지점에서 전열을 다시 모으겠습니다.',e.goal==='hold'?'방어 대기는 다음 자기 차례까지 받는 피해를 줄입니다.':e.goal==='defeat'?'적 전초 지휘대를 제압하면 목표를 달성합니다.':'금빛 거점은 이동 뒤 행동을 마쳐야 달성됩니다.')],
   aftermath:[line('전장 보고','guo',e.report,`삼국연의 ${arc.source}의 사건을 잇는 전술 단계`),line('사마의','sima',e.next)],
   units:(choice:Choice)=>{
    const a=weiArmy(level,choice,places,arc.id==='liaodong');
    if(arc.id==='jieting'||arc.id==='qishan')Object.assign(a[1],{id:'he',name:'장합',sprite:8});
    if(arc.id==='shangfang'||arc.id==='gaoping')Object.assign(a[2],{id:'zhao',name:'사마소',role:'호위'});
    if(arc.id==='yangping'){Object.assign(a[0],{name:'사마사',role:'총지휘',sprite:1});Object.assign(a[1],{id:'vanguard',name:'위군 선봉',sprite:4});Object.assign(a[2],{id:'cavalry',name:'위군 기병'});Object.assign(a[3],{id:'archer',name:'위군 궁병'});}
    return [...a,...enemies.map((p,i)=>unit(i===0?'leader':i===3?'b1':`e${i}`,i===0?'전초 지휘대':i===3?'전초 궁병':'전초 보병','enemy',i===3?5:4,p.x,p.y,{level,role:i===3?'궁병':'보병',range:i===3?[2,3]:[1,1],hp:i===0?96+level*5:48+level*3,maxHp:i===0?96+level*5:48+level*3,attack:18+level*2,defense:12+level*2,boss:i===0,movement:3}))];
   },
  } satisfies Scenario;
 });
}
