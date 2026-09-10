"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signInWithPassword({ email, password });
    if (result.error) {
      setError(
        result.error === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : result.error
      );
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-bold text-foreground">
              Logfolio
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            매일 3줄 기록이 AI가 만드는 포트폴리오가 됩니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
        >
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="size-4 animate-spin" />}
            로그인
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
