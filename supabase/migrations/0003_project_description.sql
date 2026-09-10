-- 프로젝트 자체의 소개(뭘 만드는 프로젝트인지, 기술 스택 등)를 저장하는 컬럼.
-- 활동 로그는 "무엇을 했는지"만 담당하고, 이 필드가 "이게 뭔지"를 담당해서
-- 포트폴리오 생성 시 프로젝트 개요에 반영된다.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.

alter table public.projects
  add column description text;

comment on column public.projects.description is '프로젝트 소개(무엇을 만드는지, 기술 스택 등) — 사용자가 직접 작성, 포트폴리오 생성 시 고정 컨텍스트로 사용됨';
