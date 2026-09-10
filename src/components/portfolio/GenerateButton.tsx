"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      size="lg"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          포트폴리오 생성 중... (최대 15초)
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          AI로 포트폴리오 생성하기
        </>
      )}
    </Button>
  );
}
