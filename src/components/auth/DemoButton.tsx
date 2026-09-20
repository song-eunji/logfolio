"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startDemo } from "@/lib/actions/auth";

export function DemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startDemo();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-foreground">회원가입 없이 바로 체험해보세요</p>
      <p className="text-xs text-muted-foreground">
        샘플 기록이 미리 채워진 체험 계정으로 들어가서, AI 포트폴리오 생성·편집·공유까지 그대로 써볼 수 있어요.
      </p>
      <Button size="lg" onClick={handleClick} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        로그인 없이 체험하기
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
