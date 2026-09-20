"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideViewer } from "@/components/share/SlideViewer";
import type { GenerationSource } from "@/lib/types";

export function PortfolioViewer({
  markdown,
  generationSource,
  onSave,
  saved,
  savedId,
}: {
  markdown: string;
  generationSource: GenerationSource;
  // 저장에 성공하면 저장된 포트폴리오 id를, 실패하면 null을 돌려준다.
  onSave?: () => Promise<string | null>;
  saved?: boolean;
  savedId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSaveAndEdit() {
    if (!onSave) return;
    setBusy(true);
    const id = await onSave();
    if (id) router.push(`/library/${id}/edit`);
    else setBusy(false);
  }

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
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!saved && (
            <span className="mr-1 text-xs text-muted-foreground">
              저장을 눌러야 보관함에 남아요
            </span>
          )}
          {saved && savedId && (
            <Button
              variant="outline"
              className="gap-1.5"
              nativeButton={false}
              render={<Link href={`/library/${savedId}/edit`} />}
            >
              <Pencil className="size-4" />
              편집하기
            </Button>
          )}
          {!saved && (
            <Button
              variant="outline"
              onClick={handleSaveAndEdit}
              disabled={busy}
              className="gap-1.5"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              저장하고 편집하기
            </Button>
          )}
          <Button onClick={() => onSave()} disabled={saved || busy} className="gap-1.5">
            <Save className="size-4" />
            {saved ? "저장됨" : "포트폴리오 저장"}
          </Button>
        </div>
      )}
    </div>
  );
}
