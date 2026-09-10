-- 이력서/자소서도 portfolios 테이블에 함께 저장하기 위한 확장.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.

alter table public.portfolios
  add column kind text not null default 'portfolio' check (kind in ('portfolio', 'resume', 'cover_letter')),
  add column meta jsonb;

comment on column public.portfolios.kind is '산출물 종류: portfolio(포트폴리오) / resume(이력서 불릿) / cover_letter(자소서 답변)';
comment on column public.portfolios.meta is 'kind=cover_letter일 때 {question, charLimit} 등 부가 정보 저장';
