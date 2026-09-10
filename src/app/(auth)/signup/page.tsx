"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword } from "@/lib/actions/auth";
import { ServiceIntro } from "@/components/onboarding/ServiceIntro";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signUpWithPassword({ name, email, password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.sessionCreated) {
      router.push("/");
      router.refresh();
      return;
    }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            가입 확인 메일을 보냈어요.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            메일함에서 인증 링크를 눌러 가입을 완료한 뒤 로그인해주세요.
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => router.push("/login")}
          >
            로그인 화면으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-4xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="order-2 md:order-1">
          <ServiceIntro />
        </div>

        <div className="order-1 flex w-full flex-col gap-6 md:order-2">
          <div className="flex items-center gap-1.5 md:justify-center">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Logfolio</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="size-4 animate-spin" />}
              회원가입
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
