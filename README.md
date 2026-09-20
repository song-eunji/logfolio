# 로그폴리오 (Logfolio)

**매일 3줄만 남기면, AI가 포트폴리오로 만들어드려요.**

바쁘게 활동하느라 놓치기 쉬운 경험을 매일 짧게 기록하고, 그 기록을 AI가 STAR 형식의 포트폴리오·이력서·자소서로 재구성해주는 서비스입니다. 원티드 AI 챔피언십 2026 출품작.

- 배포: https://logfolio-liart.vercel.app

## 주요 기능

| 영역 | 기능 |
|---|---|
| 기록 | 캘린더 기반 3줄 기록, 연속 기록 스트릭, 로그당 여러 분류 선택, 프로젝트별 소개 입력 |
| GitHub | 저장소 커밋 불러오기 → 원하는 커밋만 골라 기록에 추가 (내 커밋만 필터, 중복 방지) |
| 포트폴리오 | 기록 → STAR/XYZ 포트폴리오 자동 생성, 여러 프로젝트 통합, 채용공고 맞춤 재구성 |
| 이력서·자소서 | 희망 직무 기반 이력서 변환, 글자 수 제한에 맞춘 자소서 답변 생성(자동 재축약) |
| 편집기 | 캔바식 슬라이드 편집 — 드래그 이동/크기 조절/텍스트 편집/테마/슬라이드 추가·삭제·순서 변경/실행취소 |
| 공유 | 공개 전환 시 로그인 없이 볼 수 있는 슬라이드 링크, PDF 내보내기 |
| 보관함 | 포트폴리오·이력서·자소서 종류별 탭 |

### 신뢰성 설계

- AI가 로그에 없는 사실·수치를 만들지 않도록 프롬프트 가드레일 + 후처리(sanitize)
- AI 호출 실패 시 조용히 숨기지 않고 **로컬 초안으로 대체하며 화면에 배너로 명시**
- 생성 결과는 자동 저장하지 않고 사용자가 검토 후 저장, 저장 전 이탈 시 경고
- 모든 데이터는 Supabase RLS로 사용자별 격리, 조회 쿼리에도 `user_id`를 명시

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres/Auth/RLS) · Google Gemini API · Vercel

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 값 채워넣기
npm run dev
```

`.env.local`에 필요한 값:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL (경로 없이 base URL만)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase publishable key
GEMINI_API_KEY=                 # Google AI Studio에서 발급 (서버 전용)
GITHUB_TOKEN=                   # 선택, GitHub API rate limit 상향용
```

### DB 마이그레이션

Supabase SQL Editor에서 [`supabase/migrations`](supabase/migrations)의 파일을 번호 순서대로 실행합니다.

| 파일 | 내용 |
|---|---|
| `0001_init.sql` | profiles / projects / logs / portfolios + RLS |
| `0002_outputs.sql` | 이력서·자소서 저장용 `kind`, `meta` |
| `0003_project_description.sql` | 프로젝트 소개 |
| `0004_slide_layout.sql` | 슬라이드 편집기 레이아웃 저장 |

## 폴더 구조

```
src/
├── app/
│   ├── (auth)/            로그인·회원가입
│   ├── (app)/             세션 게이트 + 공통 헤더/프로젝트 바
│   │   ├── page.tsx       기록 (캘린더, GitHub 임포트, 프로젝트 소개)
│   │   ├── studio/        AI 스튜디오 (생성·통합·공고맞춤·이력서·자소서)
│   │   └── library/       보관함 + [id]/edit 슬라이드 편집기
│   ├── share/[id]/        공개 공유 페이지 (로그인 불필요)
│   └── api/               github/commits, portfolio/*, resume, cover-letter
├── components/            calendar, github, portfolio(+editor), project, share, onboarding …
├── hooks/                 use-projects, use-log-store, use-portfolio-editor …
└── lib/
    ├── ai/                프롬프트, Gemini 호출, 폴백 초안, sanitize
    ├── supabase/          server/client/middleware/mappers
    └── slideLayout.ts     편집기 레이아웃 모델
```
