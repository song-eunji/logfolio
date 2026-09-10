"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DismissibleBanner({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(true); // 첫 렌더(서버/클라 일치)는 숨김, 마운트 후 실제 값으로 갱신
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(storageKey) === "1";
    } catch {
      stored = false;
    }
    // localStorage는 클라이언트에서만 읽을 수 있어 SSR과의 하이드레이션 불일치를
    // 피하려면 마운트 후 여기서 실제 값을 반영해야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(stored);
    setMounted(true);
  }, [storageKey]);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // 저장 실패해도 이번 세션에서는 닫힌 채로 유지됨
    }
  }

  if (!mounted || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex-1 text-sm text-foreground">{children}</div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 -mt-0.5 -mr-1"
        onClick={handleDismiss}
        aria-label="닫기"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
