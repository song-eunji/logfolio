-- 캔바식 슬라이드 편집기에서 저장하는 레이아웃/스타일 오버라이드.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.

alter table public.portfolios
  add column layout jsonb;

comment on column public.portfolios.layout is
  '슬라이드 편집기 상태: 테마, 슬라이드 순서/삭제/추가, 블록(제목·본문)별 위치·크기·텍스트·스타일 오버라이드 (kind=portfolio에서만 사용)';
