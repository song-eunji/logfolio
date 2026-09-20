"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(input: { email: string }) {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(input: { password: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "재설정 링크가 만료됐어요. 비밀번호 찾기를 다시 진행해주세요." };
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) return { error: error.message };
  return { error: null };
}

const DEMO_PROJECT_NAME = "로그폴리오 (체험용)";
const DEMO_PROJECT_DESCRIPTION =
  "활동 기록을 매일 3줄로 남기면 AI가 STAR 형식 포트폴리오로 바꿔주는 웹 서비스 '로그폴리오'를 만드는 프로젝트. Next.js, Supabase, Gemini API를 사용했고 풀스택 개발을 맡았다.";

// [며칠 전, 분류, 내용] — 체험 계정에 미리 채워둘 샘플 기록
const DEMO_LOGS: [number, string, string][] = [
  [6, "개발", "Next.js 프로젝트를 세팅하고 Supabase 이메일 인증을 연결했다"],
  [6, "기획·문서", "핵심 사용자 시나리오를 '3줄 기록 → AI 포트폴리오'로 정리하고 화면 흐름을 스케치했다"],
  [5, "개발", "활동 기록을 저장하는 logs 테이블과 RLS 정책을 설계해 사용자별로 데이터가 분리되게 했다"],
  [4, "개발, 문제해결", "GitHub 커밋 불러오기에서 같은 커밋이 중복 저장되는 문제를 sha 기준 유니크 인덱스로 막았다"],
  [3, "학습", "STAR 기법과 XYZ 공식을 공부하고 포트폴리오 문장 구조에 적용해봤다"],
  [3, "개발", "Gemini API를 연동해 기록을 STAR 형식 포트폴리오로 바꾸는 생성 API를 구현했다"],
  [2, "협업·회의", "팀원에게 프로토타입을 보여주고 '기록 입력이 번거롭다'는 피드백을 받았다"],
  [2, "문제해결", "피드백을 반영해 입력을 3줄 텍스트 한 칸으로 줄이고 분류를 버튼 선택으로 바꿨다"],
  [1, "개발", "AI 생성이 실패하면 로컬 초안으로 대체하고 화면에 배너로 알리는 폴백을 추가했다"],
  [0, "개발, 협업·회의", "생성된 포트폴리오를 슬라이드로 공유하는 공개 링크 기능을 만들고 팀원과 리뷰했다"],
];

function kstDateDaysAgo(daysAgo: number) {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  kstNow.setUTCDate(kstNow.getUTCDate() - daysAgo);
  return kstNow.toISOString().slice(0, 10);
}

/**
 * 로그인 없이 서비스를 체험할 수 있도록 방문자마다 익명 계정을 만들고 샘플 기록을 채워준다.
 * Supabase 대시보드에서 "Allow anonymous sign-ins"가 켜져 있어야 동작한다.
 */
export async function startDemo() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("[auth] startDemo signInAnonymously failed", error);
    return { error: "체험 모드를 시작하지 못했어요. 잠시 후 다시 시도하거나 회원가입 후 이용해주세요." };
  }
  const userId = data.user.id;

  await supabase
    .from("profiles")
    .update({ job: "프론트엔드 개발자", year: "대학생 3학년" })
    .eq("id", userId);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: DEMO_PROJECT_NAME, description: DEMO_PROJECT_DESCRIPTION })
    .select("id")
    .single();
  if (projectError || !project) {
    console.error("[auth] startDemo project insert failed", projectError);
    return { error: null };
  }

  const { error: logsError } = await supabase.from("logs").insert(
    DEMO_LOGS.map(([daysAgo, category, content]) => ({
      project_id: project.id,
      user_id: userId,
      log_date: kstDateDaysAgo(daysAgo),
      category,
      content,
      source: "manual",
    }))
  );
  if (logsError) console.error("[auth] startDemo logs insert failed", logsError);

  return { error: null };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  name: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  });
  if (error) return { error: error.message, sessionCreated: false };
  // "Confirm email"이 꺼져 있으면 signUp이 바로 세션을 만든다.
  return { error: null, sessionCreated: !!data.session };
}
