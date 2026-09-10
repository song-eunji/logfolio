"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "logfolio:onboardingDismissed";

export interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
}

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      stored = false;
    }
    // localStorage는 클라이언트에서만 읽을 수 있어 SSR과의 하이드레이션 불일치를
    // 피하려면 마운트 후 여기서 실제 값을 반영해야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(stored);
    setMounted(true);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // 저장 실패해도 이번 세션에서는 닫힌 채로 유지됨
    }
  }

  const allDone = items.every((item) => item.done);
  if (!mounted || dismissed || allDone) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">시작하기</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleDismiss}
          aria-label="닫기"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const row = (
            <div className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  item.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {item.label}
              </span>
            </div>
          );
          return (
            <li key={item.label}>
              {!item.done && item.href ? (
                <Link href={item.href} className="hover:underline">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
