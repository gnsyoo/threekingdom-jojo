import {SCENARIOS,type StoryLine} from './scenarios.ts';
const scene=(speaker:string,portrait:string,line:string,note:string):StoryLine=>({speaker,portrait,line,note});
export const INTRO:StoryLine[]=[
 scene('삼국연의 · 제78회','sima','220년, 조조는 병상에서 사마의를 비롯한 신하들에게 조비를 보필하라고 부탁했다. 사마의의 길은 조씨 정권의 안에서 이어졌다.','序 · 위나라의 신하 / 원전 사건을 한국어로 요약'),
 scene('삼국연의 · 제91회','sima','226년, 조비도 마지막 부탁을 남겼다. 사마의는 조예를 보필하고 옹주와 양주의 군사를 맡았다.','226년 · 또 한 번의 고명'),
 scene('삼국연의 · 제91회','masu','제갈량과 마속은 사마의가 반역을 꾀한다는 소문을 퍼뜨렸다. 의심을 받은 사마의는 벼슬에서 물러났지만 위나라가 위기에 처하자 다시 불려 나왔다.','의심과 복귀 · 승리와 실패를 함께 기록한다'),
 scene('삼국연의 · 제94회','sima','228년, 맹달의 반란 소식이 도착했다. 사마의는 허락을 기다리는 시간을 버리고 빠른 행군을 택했다. 성밖의 접근로를 살피는 첫 전투가 시작된다.','50개 전투·전술 임무 · 급습 / 확보 / 방어 / 회군'),
];
export const ENDING:StoryLine[]=[
 scene('삼국연의 · 제108회','shi','양평관에서 돌아온 사마사는 낙양에 머물렀다. 아버지의 마지막은 새 영토를 얻는 전장이 아니라 병상이었다.','終 · 251년 가을'),
 scene('사마의 · 원전 유언','sima','나는 여러 해 위를 섬겼고 태부에 이르렀다. 사람들은 내게 다른 뜻이 있다고 의심했고, 나도 늘 두려워했다. 내가 죽은 뒤 너희는 국정을 잘 다스려라. 신중하라, 또 신중하라.','삼국연의 제108회의 유언을 한국어로 옮김'),
 scene('사마의 · 마지막 생각','sima','이제 남은 수는 너희의 몫이다. 내 길의 끝에서, 다음 길을 지켜보겠다.','이 두 문장만 사마의의 시점으로 짧게 각색'),
 scene('삼국연의 · 제108회','zhao','사마의는 말을 마친 뒤 세상을 떠났다. 사마사와 사마소는 조방에게 알렸고, 조정은 장례와 시호를 내렸다. 두 아들이 권력을 이어 맡았다.','사마의의 생애는 여기에서 끝난다'),
 scene('연대기의 끝','sima','급습의 성공, 빈 성 앞의 망설임, 불길에서의 생환, 긴 대치와 권력의 장악. 승리만으로 이 생애를 설명할 수는 없다.','기록을 돌아보고 다른 전략으로 원정을 다시 지휘할 수 있습니다.'),
];

/** The canon ending stays fixed; these are summaries of the player's campaign record. */
export function endingSummary(completed:string[],records:Record<string,{stars:number}|undefined>){
 const stars=completed.reduce((sum,id)=>sum+(records[id]?.stars??1),0),full=completed.length===SCENARIOS.length;
 return {stars,title:full&&stars>=Math.ceil(SCENARIOS.length*3*.88)?'군략을 남긴 완주':full?'연대기 완주':'남겨진 원정 기록',
  detail:full&&stars>=Math.ceil(SCENARIOS.length*3*.88)?'보조 목표와 빠른 진군까지 살핀 기록입니다. 다른 우군 방침과 장비로 원정을 다시 지휘할 수 있습니다.':full?'아홉 원정의 50개 전투와 이야기를 모두 이었습니다. 아직 얻지 못한 평가와 보조 목표에 다시 도전할 수 있습니다.':'종막에 도달했습니다. 아직 완료하지 않은 원정은 원정 기록에서 이야기 순서로 이어갈 수 있습니다.'};
}
