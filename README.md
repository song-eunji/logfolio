# 로그폴리오 (Logfolio)

매일 3줄로 남긴 활동 기록을 AI가 STAR/XYZ 형식의 포트폴리오로 변환해주는 서비스.
원티드 AI 챔피언십 2026 출품작 — 이전 빅데이터캠프 해커톤 프로젝트를 Next.js + Supabase + Claude로 재구축 중.

자세한 설계는 [plan 파일](C:\Users\user\.claude\plans\warm-bouncing-micali.md) 참고.

## 현재 상태

핵심 파이프라인(3줄 기록 → GitHub 커밋 자동 수집 → AI STAR/XYZ 생성 → 저장/조회)이 **로컬 저장소(localStorage) 기준으로 end-to-end 동작 확인 완료**. Supabase 연동 전이라 새로고침해도 브라우저에 남아있지만, 기기 간 동기화나 로그인은 아직 없음.

- [x] Next.js(App Router) + TypeScript + Tailwind v4 + shadcn/ui 스캐폴딩
- [x] 원티드(wanted.co.kr) 톤앤매너 디자인 시스템 적용 (Pretendard, 블루 `#0066FF`, 8px 라운드 카드, pill 배지)
- [x] 3줄 기록 + 캘린더 + 연속기록 스트릭
- [x] GitHub 커밋 자동 수집 (사용자 승인 기반, `/api/github/commits`)
- [x] AI STAR/XYZ 포트폴리오 생성 (`/api/portfolio/generate`) — Claude 실패 시 로컬 초안 폴백 + 배너 표시
- [ ] Supabase 연동 (인증, DB 영속화, RLS) — **환경변수 필요**
- [ ] 실제 Claude 호출 테스트 — **`ANTHROPIC_API_KEY` 필요**
- [ ] 공개 슬라이드 공유, 이력서 압축, 자소서 매칭, 통합 포트폴리오 등은 이후 단계

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 값 채워넣기
npm run dev
```

`.env.local`에 필요한 값:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
ANTHROPIC_API_KEY=              # Claude API 키 (서버 전용)
GITHUB_TOKEN=                   # 선택, GitHub API rate limit 상향용
```

Supabase 값이 없어도 로컬 저장소 기준으로 핵심 기능(기록/캘린더/GitHub 임포트/AI 생성)은 그대로 동작한다. `ANTHROPIC_API_KEY`가 없으면 AI 생성 요청이 로컬 폴백 초안으로 대체되고 화면에 배너가 표시된다.

## 폴더 구조

```
src/
├── app/
│   ├── page.tsx                       # 메인 데모 화면 (기록+캘린더+GitHub임포트+AI생성)
│   └── api/
│       ├── github/commits/route.ts    # GitHub 커밋 조회 프록시
│       └── portfolio/generate/route.ts # Claude 호출 (STAR/XYZ 생성 + 폴백)
├── hooks/use-log-store.ts             # 임시 localStorage 스토어 (추후 Supabase로 교체)
├── lib/
│   ├── ai/
│   │   ├── prompts/portfolioStarXyz.ts # STAR/XYZ 프롬프트 (원본 이식)
│   │   ├── generatePortfolio.ts        # Claude 호출 + sanitize
│   │   └── localDraft.ts               # AI 실패 시 폴백 초안 생성
│   ├── anthropic/client.ts
│   └── types.ts
└── components/
    ├── calendar/  (LogCalendar, DayLogForm)
    ├── github/    (RepoImportForm, CommitList)
    └── portfolio/ (GenerateButton, PortfolioViewer)
```

`hooks/use-log-store.ts`가 Supabase 연동 전까지의 유일한 데이터 계층이다. Supabase가 붙으면 이 훅이 반환하는 인터페이스(`logs`, `addLog`, `importCommitAsLog`, `portfolios`, `savePortfolio`)는 그대로 두고 내부 구현만 DB 호출로 교체하면 된다.
