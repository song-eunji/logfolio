"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestPasswordReset({ email });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="size-8 text-primary" />
          <span className="text-3xl font-extrabold text-foreground">Logfolio</span>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium text-foreground">재설정 메일을 보냈어요.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              메일함(스팸함 포함)에서 링크를 눌러 새 비밀번호를 정해주세요.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
          >
            <div>
              <p className="text-base font-semibold text-foreground">비밀번호 찾기</p>
              <p className="mt-1 text-xs text-muted-foreground">
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="size-4 animate-spin" />}
              재설정 링크 보내기
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
