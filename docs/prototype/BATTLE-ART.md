# 50개 전투의 일러스트 지도

전체 50개 전투는 서로 다른 WebP 아트를 사용한다. **공성전 15개(30%)를 새 석조 성곽·목책 성채 아트로 교체**했고 나머지 야전 35개를 유지했다. [전체 대사](SIMA_CAMPAIGN.md) · [최신 검증](SIEGE-QA.md)

## 지형과 아트

실제 지형 배열을 프로젝트 SVG 배치도로 만들고 이미지 생성 도구로 독립 일러스트를 제작했다. 상업 게임의 지도는 추출하지 않았다. 성곽의 앞·뒤 경계, 주 성문의 통행 차선, 보급 후문, 강과 진입로를 비교하며 일부 아트를 다시 생성했다. 아트만 덧씌우지 않고 성벽·성문·성벽 안쪽 통로를 실제 이동·사격·방어 규칙에 반영했다.

전투 선택·출진 준비·3×3 배치창·전투·지형 미리보기가 같은 아트를 사용한다. 칸의 경계·이동 비용·사격은 격자와 지형 정보로 확인한다. 성문은 열린 통행 칸이며 파괴 가능한 성문 HP나 조작하는 운제·투석기는 구현 범위에 포함되지 않는다. 화공·비·부대·이름·거점은 실시간 레이어다.

## 파일과 성능

원본 PNG의 해상도를 유지한 WebP quality 90이며 자르기·리사이즈·색 변경을 하지 않았다. 50장 합계 **33,626,460 bytes**, 한 장 모두 800,000 bytes 미만이다. 목록은 지연 로딩·비동기 디코딩한다. 공성전은 새 파일명으로 이전 배경 캐시와 구별한다.

`public/assets/battle-art.json`은 원본 이름·원본/출력 SHA-256·해상도·용량·품질을 기록한다. `node scripts/build-campaign-maps.ts`는 50개 SVG 아트 지시도를 `qa-artifacts/map-layouts/`에 만들며 최종 일러스트를 덮어쓰지 않는다.

## 전체 지도

| 번호 | 전투 | 종류 | 파일 | 해상도 | 크기 |
|---|---|---|---|---|---|
| 1 | 신성 접근로 정찰 | 야전 | shangyong-01-field.webp | 1536x1024 | 664,504 bytes |
| 2 | 격문 전달로 확보 | 야전 | shangyong-02-field.webp | 1536x1024 | 688,860 bytes |
| 3 | 급행군 보급선 | 성채 방어 | shangyong-03-siege.webp | 1536x1024 | 659,128 bytes |
| 4 | 신성 외곽 전초전 | 공성 돌파 | shangyong-04-siege.webp | 1536x1024 | 711,758 bytes |
| 5 | 내응 연락선 | 포위 공방 | shangyong-05-siege.webp | 1536x1024 | 666,786 bytes |
| 6 | 상용 급습전 | 공성 돌파 | shangyong-siege.webp | 1536x1024 | 705,736 bytes |
| 7 | 한중 보급로 탐색 | 야전 | jieting-01-field.webp | 1536x1024 | 549,206 bytes |
| 8 | 장합 선봉 엄호 | 야전 | jieting-02-field.webp | 1536x1024 | 666,784 bytes |
| 9 | 산 아래 길목전 | 야전 | jieting-03-field.webp | 1536x1024 | 612,658 bytes |
| 10 | 물길 접근전 | 야전 | jieting-04-field.webp | 1536x1024 | 737,858 bytes |
| 11 | 가정 대로 우회 | 야전 | jieting-05-field.webp | 1536x1024 | 692,356 bytes |
| 12 | 가정 차단전 | 야전 | jieting-field.webp | 1536x1024 | 655,312 bytes |
| 13 | 서성 접근로 | 야전 | xicheng-01-field.webp | 1536x1024 | 685,150 bytes |
| 14 | 열린 성문 경계 | 야전 | xicheng-02-field.webp | 1536x1024 | 699,462 bytes |
| 15 | 성루 관측과 회군로 | 야전 | xicheng-03-field.webp | 1536x1024 | 600,172 bytes |
| 16 | 서성 후위 정비 | 야전 | xicheng-04-field.webp | 1536x1024 | 724,502 bytes |
| 17 | 서성 회군전 | 야전 | xicheng-field.webp | 1536x1024 | 673,328 bytes |
| 18 | 기산 방어선 구축 | 포위 공방 | qishan-01-siege.webp | 1536x1024 | 685,246 bytes |
| 19 | 기산 보급영 방어 | 성채 방어 | qishan-02-siege.webp | 1536x1024 | 723,572 bytes |
| 20 | 기산 협곡 전초전 | 야전 | qishan-03-field.webp | 1536x1024 | 574,464 bytes |
| 21 | 회군 징후 정찰 | 야전 | qishan-04-field.webp | 1536x1024 | 695,790 bytes |
| 22 | 기산 방어전 | 성채 방어 | qishan-siege.webp | 1619x971 | 653,284 bytes |
| 23 | 위수 남쪽 정찰 | 야전 | shangfang-01-field.webp | 1536x1024 | 660,928 bytes |
| 24 | 버려진 군량 접근전 | 야전 | shangfang-02-field.webp | 1536x1024 | 673,422 bytes |
| 25 | 골짜기 입구 호위 | 야전 | shangfang-03-field.webp | 1536x1024 | 601,536 bytes |
| 26 | 상방곡 전열 유지 | 야전 | shangfang-04-field.webp | 1536x1024 | 727,094 bytes |
| 27 | 상방곡 탈출전 | 야전 | shangfang-field.webp | 1536x1024 | 671,964 bytes |
| 28 | 위수 북안 회군로 | 야전 | wuzhang-01-field.webp | 1536x1024 | 633,666 bytes |
| 29 | 무공 방향 관측 | 야전 | wuzhang-02-field.webp | 1536x1024 | 650,532 bytes |
| 30 | 북안 보급영 방어 | 성채 방어 | wuzhang-03-siege.webp | 1536x1024 | 646,784 bytes |
| 31 | 오장원 전초 압박 | 야전 | wuzhang-04-field.webp | 1536x1024 | 605,580 bytes |
| 32 | 출전 조칙과 진영 | 야전 | wuzhang-05-field.webp | 1536x1024 | 594,392 bytes |
| 33 | 오장원 대치전 | 성채 방어 | wuzhang-siege.webp | 1572x1001 | 635,876 bytes |
| 34 | 요동 진군로 확보 | 야전 | liaodong-01-field.webp | 1536x1024 | 678,078 bytes |
| 35 | 요수 목책 정찰 | 포위 공방 | liaodong-02-siege.webp | 1536x1024 | 768,640 bytes |
| 36 | 양평 우회 행군 | 야전 | liaodong-03-field.webp | 1536x1024 | 656,632 bytes |
| 37 | 수산 길목 차단 | 야전 | liaodong-04-field.webp | 1536x1024 | 684,090 bytes |
| 38 | 장마 속 포위영 | 성채 방어 | liaodong-05-siege.webp | 1536x1024 | 631,678 bytes |
| 39 | 운제 접근로 | 포위 공방 | liaodong-06-siege.webp | 1536x1024 | 686,024 bytes |
| 40 | 요동 포위전 | 공성 돌파 | liaodong-siege.webp | 1642x958 | 714,894 bytes |
| 41 | 낙양 소집로 | 야전 | gaoping-01-field.webp | 1536x1024 | 701,378 bytes |
| 42 | 성문 통제선 | 야전 | gaoping-02-field.webp | 1536x1024 | 736,852 bytes |
| 43 | 군영 접관 통로 | 야전 | gaoping-03-field.webp | 1536x1024 | 648,378 bytes |
| 44 | 조상부 앞 호위로 | 야전 | gaoping-04-field.webp | 1536x1024 | 691,096 bytes |
| 45 | 고평릉 정변 | 야전 | gaoping-field.webp | 1619x971 | 701,382 bytes |
| 46 | 옹주 원군 연락로 | 야전 | yangping-01-field.webp | 1536x1024 | 646,256 bytes |
| 47 | 곡산 보급 차단 | 공성 돌파 | yangping-02-siege.webp | 1536x1024 | 711,620 bytes |
| 48 | 양평관 추격로 | 야전 | yangping-03-field.webp | 1536x1024 | 763,570 bytes |
| 49 | 양평관 후위 엄호 | 성채 방어 | yangping-04-siege.webp | 1536x1024 | 715,310 bytes |
| 50 | 양평관 회군전 | 야전 | yangping-field.webp | 1619x971 | 662,892 bytes |

## 실제 게임 화면

![신성 석조 공성전](images/siege-shangyong.webp)

![기산 목책 방어전](images/siege-qishan-02.webp)

![양평성 공성전](images/siege-liaodong.webp)
