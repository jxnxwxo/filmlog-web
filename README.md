# FILM & DRAMA ARCHIVE (filmlog-web)

개인 영화·드라마 관람 기록 웹사이트. 원래 Notion 데이터베이스로 관리하던 목록을 웹페이지로 옮기고, TMDb API로 한국어/영어/일본어 메타데이터를 자동 보강하고, 관리자 로그인으로 직접 작품을 추가/수정/삭제할 수 있도록 발전시킨 프로젝트.

- **배포 주소:** https://jxnxwxo.vercel.app
- **GitHub:** https://github.com/jxnxwxo/filmlog-web

## 환경 (Environment)

### 로컬 개발 환경
- OS: Windows 11
- Node.js: **v24.21.0** (npm 11.19.0)
- 패키지 매니저: npm
- 셸: PowerShell

### 주요 의존성 (`package.json`)

| 패키지 | 버전 | 용도 |
|---|---|---|
| next | 16.3.5 | 프레임워크 (App Router, Turbopack) |
| react / react-dom | 19.2.8 | UI |
| pg | ^8.23.0 | Postgres 드라이버 |
| typescript | ^5 | 타입 체크 |
| tsx | ^4.23.13 | `.mts` 일회성 스크립트 실행 (마이그레이션/백필용) |
| dotenv | ^17.4.2 | 로컬 `.env.local` 로드 |
| eslint / eslint-config-next | ^9 / 16.3.5 | 린트 |

새 npm 패키지를 추가로 설치한 적은 없음 — 세션 내내 이 의존성 목록 그대로 작업함.

### 환경 변수

`.env.local`에 저장 (`.gitignore`의 `.env*` 규칙으로 제외, git 히스토리에도 커밋된 적 없음 확인됨). Vercel 배포본은 프로젝트 **Settings → Environment Variables**에 동일한 키로 별도 설정.

| 변수명 | 용도 |
|---|---|
| `TMDB_API_KEY` | TMDb API 인증 |
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 |
| `SESSION_SECRET` | 관리자 쿠키 세션 값 |
| `DATABASE_URL` | Neon Postgres 연결 문자열 (`sslmode=require&channel_binding=require`) |

### 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 (타입체크 포함)
```

### 배포

- GitHub `main` 브랜치에 push → Vercel이 자동으로 빌드/배포 (별도 CI 설정 없음)
- 배포 주소는 원래 `filmlog-web.vercel.app`이었다가 `jxnxwxo.vercel.app`으로 변경 (Vercel 프로젝트 Settings → Domains에서 무료로 서브도메인 이름 변경)
- DB: Neon Postgres, Vercel Storage 마켓플레이스로 연동, region `ap-southeast-1`(Singapore)

### 백업/복구 지점

디자인 전면 개편(Apple 스타일 적용) 직전 상태를 git 태그 `pre-apple-redesign`으로 남겨둠. 마음에 안 드는 변경이 있으면 `git checkout pre-apple-redesign`으로 되돌아볼 수 있음.

## 기술 스택

| 영역 | 사용 기술 | 언어 |
|---|---|---|
| 프론트엔드 | Next.js 16 (App Router), React 19 | TypeScript / TSX |
| 백엔드 | Next.js Route Handlers (API Routes), Vercel Serverless Functions | TypeScript |
| 데이터베이스 | PostgreSQL (Neon, Vercel Storage 마켓플레이스로 연결) | SQL (`pg` 드라이버로 직접 쿼리) |
| 외부 API | TMDb (The Movie Database) API — 제목/장르/줄거리/포스터/출연진/감독 다국어 데이터 | — |
| 스타일링 | 커스텀 CSS (프레임워크 없이 CSS Custom Properties 기반 디자인 토큰) | CSS |
| 인증 | 쿠키 기반 단일 관리자 세션 (별도 인증 라이브러리 없이 직접 구현) | TypeScript |
| 배포/호스팅 | Vercel (GitHub `main` 브랜치 push 시 자동 배포) | — |

즉 **프론트엔드와 백엔드 둘 다 TypeScript** 하나로 작성되어 있음 (Next.js가 같은 프로젝트 안에서 페이지 렌더링과 API 서버 역할을 동시에 하기 때문). 데이터베이스 쪽만 SQL을 씀.

## 왜 이 구성을 골랐는지

- **Next.js**: 프론트엔드(화면)와 백엔드(API)를 한 프로젝트에서 같이 짤 수 있어서, 별도 백엔드 서버를 안 만들어도 됐음. Server Component로 처음 로딩 속도를 빠르게(서버에서 데이터 미리 불러와서 보내줌) 하고, Client Component로 필터/검색/모달 같은 상호작용을 처리하는 식으로 역할을 나눔.
- **TypeScript**: 영화 데이터(제목/국가/장르 등)가 한국어/영어/일본어 3개 언어 구조로 복잡해서, 타입을 정해두면 실수(필드명 오타, 타입 불일치)를 미리 잡을 수 있어서 선택.
- **PostgreSQL(Neon) + Vercel Storage**: Vercel 배포와 몇 클릭으로 바로 연결되고, JSONB 컬럼으로 다국어 필드(title/genre/overview/casting/director/posterKey를 `{ko, en, ja}` 형태로)를 한 컬럼에 자연스럽게 저장할 수 있어서 선택. 무료 플랜으로 충분한 규모.
- **TMDb API**: 영화와 드라마(TV) 둘 다 지원하고, 언어 파라미터만 바꾸면 같은 작품의 한/영/일 제목·줄거리·포스터를 바로 받을 수 있어서 "제목+평점만 입력하면 나머지는 자동으로 채워지는" 기능을 구현하는 데 가장 적합했음.
- **쿠키 기반 단순 인증**: 관리자가 나 혼자뿐이라 회원가입/로그인 시스템을 통째로 만들 필요가 없었음. 비밀번호 하나를 서버 환경변수로 저장하고, 맞으면 서명된 쿠키를 내려주는 정도로 충분해서 NextAuth 같은 라이브러리 없이 직접 구현.
- **ISR (Incremental Static Regeneration)**: 방문자가 많지 않은 개인 사이트라 매번 DB를 조회할 필요는 없고, 그렇다고 완전 정적이면 관리자가 작품을 추가했을 때 안 보이는 문제가 있어서, "5분마다 자동 갱신 + 관리자가 수정하면 즉시 갱신" 방식(`revalidatePath`)으로 절충.

## 진행 과정 (시간순 상세 정리)

### 1. Notion → 웹페이지 (Claude Artifact)
Notion에 정리해둔 영화/드라마 목록(제목·연도·국가·장르·평점·출연진)을 추출해서 웹페이지로 시각화. 이 단계는 배포 없이 Claude 대화 안에서 보는 Artifact 형태였음.

### 2. TMDb 연동 + 다국어 지원
해외 영화 포스터가 전부 한글로 나오는 문제를 해결하기 위해 TMDb API를 붙여서 한국어/영어/일본어 각각의 제목·줄거리·포스터·출연진을 따로 가져오도록 함. 우측 상단에 국기 아이콘으로 언어를 전환하는 UI와 다크모드를 추가.

### 3. 정식 웹사이트로 전환 결정
"나중에 봤던 영화를 직접 추가하고 싶다"는 요구사항이 나오면서, Claude Artifact(대화 안에서만 보이는 형태)로는 한계가 있어 **Next.js + Vercel + DB로 이전**하기로 결정(사용자가 직접 선택). 이유: (1) 링크 하나로 남에게 포트폴리오처럼 보여줄 수 있고, (2) 로그인한 관리자만 작품을 추가/수정할 수 있는 실제 서버 기능이 필요했기 때문.

### 4. 인프라 구축
Node.js 설치 → GitHub 계정 → Vercel 프로젝트 생성 → Vercel Storage 마켓플레이스에서 Neon Postgres 연결 → 환경변수(`TMDB_API_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `DATABASE_URL`) 로컬(`.env.local`)과 Vercel 대시보드에 각각 설정.

### 5. 핵심 기능 구현
- `lib/tmdb.ts`: TMDb 검색 + 상세정보(한/영/일 병렬 호출) 조회
- `lib/i18n.ts`: 다국어 UI 문자열 사전, `Movie` 타입, 언어별 필드를 꺼내는 헬퍼 함수들
- `lib/auth.ts`: 쿠키 기반 관리자 로그인/로그아웃
- `lib/movies.ts`: DB에서 전체 작품 목록을 가져오는 공통 함수 (API 라우트와 서버 컴포넌트 양쪽에서 재사용)
- API 라우트: 목록 조회, 관리자 로그인/로그아웃/세션 확인, TMDb 검색, 추가/수정/삭제, 중복 확인
- 관리자 페이지(`/admin`): 로그인 폼 + 새 작품 추가/기존 작품 수정 탭
- 홈 화면: 텍스트 목록/포스터 그리드 보기 전환, 검색, 정렬, 카테고리(영화/드라마)·국가 필터, 상세 모달
- 기존 Notion 데이터(약 326편)를 TMDb와 매칭시켜 DB에 일괄 삽입하는 마이그레이션 스크립트 실행
- GitHub 저장소 생성 후 push, Vercel에 연결해서 `main` 브랜치에 push할 때마다 자동 배포되도록 구성

### 6. UI/UX 개선 (사용자 피드백 기반, 여러 라운드)
- 컨트롤 바가 화면 양옆으로 삐져나오는 문제 수정 (max-width 컨테이너 분리)
- 목록 컬럼 순서 정리 + 배우/한줄평 컬럼 추가
- 국기 이모지가 윈도우에서 깨지는 문제 → 직접 그린 SVG 국기로 교체
- 관리자 페이지의 추가/수정 기능을 탭으로 분리
- 별점 호버 시 숫자가 실시간으로 안 바뀌던 버그 수정
- 다크모드에서 관리자 검색 결과 글자가 안 보이던 버그 수정 (버튼 기본 글자색 상속 문제)
- 정렬 드롭다운 크기/디자인 다듬기, 로그인 시 "관리자"→"로그아웃" 전환
- 중복 작품 추가 시 확인 팝업, 관리자 로그인 상태에서 목록의 작품을 눌렀을 때 모달 안에서 바로 수정/삭제 가능하도록 개선

### 7. 로딩 속도 개선
초기에는 홈 화면이 빈 화면으로 뜬 뒤 브라우저에서 `/api/movies`를 다시 호출해서 채우는 방식이라 느렸음. `page.tsx`를 **서버 컴포넌트**로 바꿔서 서버에서 미리 데이터를 불러와 내려주고(5분 ISR 캐시), 화면의 상호작용 로직은 `HomeClient.tsx`라는 클라이언트 컴포넌트로 분리. 관리자가 추가/수정/삭제하면 캐시를 즉시 갱신(`revalidatePath`)하도록 처리.

### 8. 데이터 정합성 버그 발견 및 수정
사용자가 "비포 선라이즈=오스트리아, 나비효과=캐나다로 잘못 나온다"고 발견. TMDb의 `production_countries` 필드가 순서 없는 배열(촬영지 포함)이라 첫 번째 값을 그대로 썼던 게 원인. 실제 "본국"을 나타내는 `origin_country` 필드로 교체하고, 기존 DB의 326개 작품 전체를 다시 검증하는 스크립트(`scripts/fix-countries.mts`)를 실행해서 33개 항목(인터스텔라, 인셉션, 다크나이트, 반지의 제왕 등)의 잘못된 국가 정보를 실제 운영 DB에서 직접 수정.

### 9. Apple 스타일 디자인 시스템 적용
사용자가 `DESIGN.md`(Apple 마케팅 사이트를 참고한 색상·타이포그래피·간격·라운드 값이 정의된 디자인 토큰 문서)를 프로젝트에 추가하고 "이 느낌 나게 바꿔달라"고 요청. 되돌릴 수 있게 `pre-apple-redesign` 태그를 먼저 만들어 백업한 뒤, `globals.css`의 색상/폰트(Inter, SF Pro 대체)/여백/라운드 값을 DESIGN.md에 정의된 값만 사용해서 전면 재작성. 각 파일에 어떤 DO/DON'T 규칙을 지켰는지 주석으로 남김.

### 10. 디자인 재조정 + 마무리 다듬기
막상 적용해보니 "하양+파랑이 스팸사이트 같다"는 피드백을 받아 **다크모드를 기본값**으로 전환(깜빡임 없이 다크로 먼저 뜨도록 처리), 파비콘을 🎞️ 이모지로 교체, 탭 제목을 "FILM & DRAMA ARCHIVE"로 변경. 이후 모바일에서 컨트롤 바가 고정되어 있으면 너무 크다는 피드백으로 모바일에서는 스크롤 시 같이 내려가도록 수정, 검색창 포커스 시 화면 상단으로 자동 스크롤(키보드에 결과가 가려지는 문제 해결), 맨 위로 가기 버튼 추가, 제목 클릭 시 필터 초기화+새로고침 기능 추가.

### 11. 감독(director) 필드 추가
장르와 배우 사이에 "감독" 컬럼 추가 요청. TMDb 크레딧 API의 `crew` 배열에서 `job === "Director"`를 찾아 채움. 드라마는 TMDb에 회차별 감독만 있고 쇼 전체의 "감독" 크레딧이 거의 없어서, 없을 경우 `created_by`(제작자) 값으로 대체. DB에 `director` JSONB 컬럼을 추가(`ALTER TABLE`)하고, 기존 327개 작품 전체를 TMDb로 다시 조회해 채우는 백필 스크립트(`scripts/fix-directors.mts`)를 운영 DB에 실행해서 325개 항목을 채움 (2개는 TMDb 자체에 크레딧 정보가 없어서 공란).

### 12. 감독/배우 클릭 필터링, 평점 체크박스 필터, CSV 내보내기, 검색 범위 토글
- 상세 모달에서 감독/배우 이름을 각각 클릭하면 그 인물이 참여한 **내 기록 안의** 다른 작품으로 필터링 (외부 API 재조회 없이 이미 메모리에 있는 데이터로 클라이언트에서 처리)
- 평점 0.5~5.0을 체크박스로 다중 선택해서 필터링하는 드롭다운 추가
- 현재 필터링된 목록을 CSV로 내보내는 버튼 추가 (엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 포함)
- 노래방 제목/가수 검색처럼, 검색을 "제목"/"배우" 두 모드로 나누는 토글 추가(기본값 제목) — 배우 이름 부분 문자열이 다른 이름과 우연히 겹치는 문제(예: "IU" 검색 시 일본 배우 "Arata **Iu**ra"가 같이 걸리던 것)를 기본 모드에서는 피할 수 있게 됨

### 13. 모바일 UI 여러 차례 다듬기
- 컨트롤 바를 모바일에서 스크롤 시 같이 내려가도록 하고, 관련 있는 컨트롤을 두 개씩 짝지어 배치해서 세로 공간을 크게 줄임 (영화 목록이 스크롤 없이 바로 보이도록)
- iOS Safari가 16px 미만 입력창에 포커스하면 자동으로 화면을 확대하는 문제 때문에, 입력 요소는 실제 폰트 크기 16px를 유지하되 `transform: scale()`로 화면에는 작게 보이도록 처리
- 정렬 드롭다운을 네이티브 `<select>`에서 평점 필터와 동일한 커스텀 버튼+패널 컴포넌트로 교체해서 두 컨트롤의 크기/폰트를 통일
- 드롭다운(정렬/평점 필터)이 열려 있을 때 화면 전체를 덮는 투명 레이어(scrim)를 깔아서, 드롭다운 바깥 아무 곳(특히 근처 영화 목록)을 눌러도 안전하게 드롭다운만 닫히도록 수정. 원인은 컨트롤 바의 `backdrop-filter`가 별도 CSS stacking context를 만들어서 드롭다운 패널의 z-index가 그 안에 갇혀버렸던 것 — 컨트롤 바 자체의 z-index를 올려서 해결.

### 14. 재미 요소: 클릭 파티클
사이트 어디를 클릭하든 클릭 지점에서 색색의 작은 파티클이 튀었다가 사라지는 이스터에그 추가 (`components/ClickBurst.tsx`).

### 15. 버그 수정 모음
- 포스터 그리드의 별점 배지(★5.0)가 다크모드에서 어두운 포스터 위에 거의 안 보이던 문제 — 배지 글자색이 테마에 따라 바뀌는 변수를 쓰고 있어서 다크모드에서는 어두운 배경 위에 어두운 글자가 되던 버그였음. 고정된 흰 글자로 수정.
- 관리자 화면 문구를 더 짧게, 돌아가기 링크를 "← 뒤로"로, 로그인 버튼을 작게 수정
- 상세 모달의 줄거리(overview) 텍스트 크기를 한 단계 축소, 목록 뷰의 장르 태그도 축소

### 16. 라이트모드 색상을 다크모드의 골드 톤으로 통일
원래 DESIGN.md(Apple 스타일) 기준대로 라이트모드는 파란색(#0071e3), 다크모드는 기존 골드(#dfae57)였는데, "라이트모드도 다크모드 노란색으로 통일해달라"는 요청. 색상값을 그대로 복사하면 명도 대비가 깨지는 문제가 있었음 (다크모드 전용 옅은 크림색 텍스트를 밝은 배경에 그대로 쓰면 거의 안 보임) — 버튼 배경색(`--accent`)은 두 테마가 공유하되, 일반 텍스트에 쓰는 강조색(`--accent-text`)과 "버튼 위에 올라가는 텍스트" 색(`--on-accent`, 새로 추가)은 테마별로 따로 계산해서 대비를 유지하며 통일.

## 디렉터리 구조 (핵심 파일)

```
src/
  app/
    page.tsx                 # 홈 — 서버 컴포넌트, ISR로 초기 데이터 로드
    HomeClient.tsx            # 홈 화면 상호작용 로직 (클라이언트 컴포넌트)
    layout.tsx                 # 폰트, 다크모드 기본값 스크립트, 메타데이터, ClickBurst 마운트
    globals.css                 # 디자인 토큰 + 전체 스타일
    icon.svg                     # 파비콘 (🎞️)
    admin/page.tsx                # 관리자 로그인 + 추가/수정 페이지
    api/
      movies/route.ts               # 전체 목록 조회
      admin/{login,logout,session,search,add,edit,delete,check}/route.ts
  lib/
    db.ts        # Postgres 커넥션 풀
    tmdb.ts       # TMDb API 연동 (검색/상세/크레딧/감독)
    i18n.ts        # 다국어 문자열 + Movie 타입 + 헬퍼
    auth.ts         # 관리자 세션
    movies.ts        # 목록 조회 공통 함수
  components/
    StarRating.tsx      # 반개 단위 별점 위젯
    Flags.tsx             # 국기 SVG 아이콘
    ConfirmDialog.tsx      # 확인/취소 팝업
    ClickBurst.tsx           # 클릭 파티클 이스터에그
scripts/
  schema.sql                # DB 테이블 정의
  migrate.mts                 # 초기 데이터 마이그레이션 (일회성, 완료됨)
  fix-countries.mts             # 국가 데이터 검증/수정 스크립트 (일회성, 완료됨)
  add-director-column.mts         # director 컬럼 추가 (일회성, 완료됨)
  fix-directors.mts                 # 감독 데이터 백필 스크립트 (일회성, 완료됨)
DESIGN.md   # Apple 스타일 디자인 토큰 정의 (디자인 작업의 기준 문서 — 색상 일부는 이후 골드로 재조정됨)
```
