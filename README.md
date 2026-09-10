# 로그폴리오 (Logfolio)

매일 3줄로 남긴 활동 기록을 AI가 STAR/XYZ 형식의 포트폴리오로 변환해주는 서비스.
원티드 AI 챔피언십 2026 출품작 — 이전 빅데이터캠프 해커톤 프로젝트를 Next.js + Supabase + Gemini로 재구축 중.

자세한 설계는 [plan 파일](C:\Users\user\.claude\plans\warm-bouncing-micali.md) 참고.

## 현재 상태

핵심 파이프라인(회원가입/로그인 → 3줄 기록 → GitHub 커밋 자동 수집 → AI STAR/XYZ 생성 → 저장/조회)이 **실제 Supabase DB 기준으로 end-to-end 동작 확인 완료**.

- [x] Next.js(App Router) + TypeScript + Tailwind v4 + shadcn/ui 스캐폴딩
- [x] 원티드(wanted.co.kr) 톤앤매너 디자인 시스템 적용 (Pretendard, 블루 `#0066FF`, 8px 라운드 카드, pill 배지)
- [x] Supabase 이메일/비밀번호 인증 + 세션 게이트 + 로그아웃
- [x] 3줄 기록 + 캘린더 + 연속기록 스트릭 (Supabase `logs` 테이블, RLS로 사용자별 격리)
- [x] GitHub 커밋 자동 수집 (사용자 승인 기반, `/api/github/commits`)
- [x] AI STAR/XYZ 포트폴리오 생성 (`/api/portfolio/generate`, Gemini) — 실패 시 로컬 초안 폴백 + 배너 표시
- [ ] 공개 슬라이드 공유, 이력서 압축, 자소서 매칭, 통합 포트폴리오 등은 이후 단계

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 값 채워넣기
npm run dev
```

`.env.local`에 필요한 값:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL (경로 없이 base URL만)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/publishable key
GEMINI_API_KEY=                 # Google AI Studio에서 발급 (무료 티어 가능)
GITHUB_TOKEN=                   # 선택, GitHub API rate limit 상향용
```

Supabase 스키마는 [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)을 프로젝트 SQL Editor에서 실행하면 된다. `GEMINI_API_KEY`가 없거나 호출이 실패하면 AI 생성 요청이 로컬 폴백 초안으로 대체되고 화면에 배너가 표시된다.

## 폴더 구조

```
src/
├── app/
│   ├── (auth)/login, (auth)/signup       # 이메일/비밀번호 인증
│   ├── (app)/layout.tsx                  # 세션 게이트 + 공통 헤더(로그아웃)
│   ├── (app)/page.tsx                    # 메인 화면 (기록+캘린더+GitHub임포트+AI생성)
│   └── api/
│       ├── github/commits/route.ts       # GitHub 커밋 조회 프록시
│       └── portfolio/generate/route.ts   # Gemini 호출 (STAR/XYZ 생성 + 폴백)
├── hooks/use-log-store.ts                # Supabase 기반 데이터 계층 (로그/포트폴리오 CRUD)
├── lib/
│   ├── supabase/{server,client,middleware,mappers}.ts
│   ├── gemini/client.ts
│   ├── actions/auth.ts                   # 로그인/회원가입/로그아웃 서버 액션
│   ├── ai/
│   │   ├── prompts/portfolioStarXyz.ts   # STAR/XYZ 프롬프트 (원본 이식)
│   │   ├── generatePortfolio.ts          # Gemini 호출 + sanitize
│   │   └── localDraft.ts                 # AI 실패 시 폴백 초안 생성
│   └── types.ts
└── components/
    ├── auth/LogoutButton.tsx
    ├── calendar/  (LogCalendar, DayLogForm)
    ├── github/    (RepoImportForm, CommitList)
    └── portfolio/ (GenerateButton, PortfolioViewer)
```

`hooks/use-log-store.ts`는 사용자당 "기본 프로젝트" 하나를 자동으로 찾거나 만들고, 그 프로젝트의 로그/포트폴리오를 브라우저의 Supabase 클라이언트로 직접 CRUD한다 (RLS가 사용자별 접근을 강제). 멀티 프로젝트 대시보드는 이후 단계.
