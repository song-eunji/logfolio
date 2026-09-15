"use client";

import { AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideViewer } from "@/components/share/SlideViewer";
import type { GenerationSource } from "@/lib/types";

export function PortfolioViewer({
  markdown,
  generationSource,
  onSave,
  saved,
}: {
  markdown: string;
  generationSource: GenerationSource;
  onSave?: () => void;
  saved?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {generationSource === "local_fallback" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>
            AI 생성에 실패하여 로그를 기반으로 초안을 만들었어요. 다시
            시도해보세요.
          </span>
        </div>
      )}

      <SlideViewer content={markdown} heading="미리보기" />

      {onSave && (
        <Button onClick={onSave} disabled={saved} className="self-end gap-1.5">
          <Save className="size-4" />
          {saved ? "저장됨" : "포트폴리오 저장"}
        </Button>
      )}
    </div>
  );
}
