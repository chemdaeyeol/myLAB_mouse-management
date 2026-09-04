# 랩 마우스 콜로니 현황

케이지·개체 현황을 wet 파트너들과 실시간으로 공유하는 웹앱.
초기 데이터는 GNTP 엑셀(2026.08.12 기준)에서 그대로 가져왔고, **이후 업데이트는 이 사이트에서** 관리합니다.
(엑셀은 개인용으로 계속 쓰셔도 되고, 사이트와 자동 동기화되지는 않습니다.)

- React + Vite + Supabase(Postgres·Realtime) + Vercel
- 링크만 알면 **열람 가능**, 편집 시 이름을 고르면 **누가 언제 바꿨는지 기록**

## 화면
- 상단 탭: **Chd8 콜로니 / GFAP × rtTA × 4F2A / 행동실험 · IHC**
- 케이지 카드: 종류 배지(Mating·DOX·Behavior·IHC), 비고, ♂♀·baby 자동 집계
- 개체 표: 개체명 · 유전자형 3종(라인별 라벨 자동) · DOB(주령 자동 계산) · 비고 · 무게
- **DOX 스케줄**(GFAP 탭): 사이클 클릭 → 예정 → 진행중 → 완료 토글
- 검색: 개체·유전자형·DOB·비고 통합 검색
- 변경 기록: 최근 수정 내역(누가·무엇을)

## 설치
### 1) Supabase
- 새 프로젝트 또는 **기존 프로젝트에 추가 실행 가능** (테이블 접두어 `mc_`라 기존 앱과 안 겹침)
- SQL Editor에 `supabase/schema.sql` 붙여넣고 **Run** → 테이블·권한·실시간 + **초기 데이터(케이지 44 · 개체 181 · DOX 27)** 까지 한 번에
- Project Settings → API 에서 URL / anon key 복사
- 로그인이 없으므로 계정 생성 불필요

> 주의: `schema.sql` 안에 `truncate ... mc_mice, mc_cages, mc_dox` 가 있어 **다시 실행하면 기존 내용이 초기 상태로 되돌아갑니다.** 최초 1회만 실행하세요.

### 2) 로컬 실행
```bash
cp .env.example .env     # 값 2개 입력
npm install
npm run dev              # http://localhost:5173
```

### 3) 배포 (Vercel)
GitHub 비공개 저장소 push → Vercel Import(Vite 자동) → 환경변수 2개 → Deploy → 주소 공유

## 참고
- DOB는 원본 표기(`25.03.27`, `26.01.16~18`)를 그대로 두고, 첫 날짜로 주령을 자동 계산합니다.
- 유전자형 라벨(Chd8/Nes-cre/tdT, GFAP-cre/LSL-rtTA/4F2A 등)은 케이지별로 저장돼 라인마다 다르게 표시됩니다.
- 링크를 아는 사람은 편집도 가능하니 랩 내부에만 공유하세요.
