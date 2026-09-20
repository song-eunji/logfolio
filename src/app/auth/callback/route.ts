import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 이메일 링크(비밀번호 재설정 등)로 들어온 code를 세션으로 교환한 뒤 다음 페이지로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
