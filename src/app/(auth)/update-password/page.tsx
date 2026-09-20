"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/actions/auth";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await updatePassword({ password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="size-8 text-primary" />
          <span className="text-3xl font-extrabold text-foreground">Logfolio</span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
        >
          <p className="text-base font-semibold text-foreground">새 비밀번호 설정</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">새 비밀번호 확인</Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="한 번 더 입력"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="size-4 animate-spin" />}
            비밀번호 변경
          </Button>
        </form>
      </div>
    </div>
  );
}
