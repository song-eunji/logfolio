"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function ShareToggle({
  portfolioId,
  isPublic,
  onToggle,
}: {
  portfolioId: string;
  isPublic: boolean;
  onToggle: (id: string, next: boolean) => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);

  async function handleChange(next: boolean) {
    setPending(true);
    const ok = await onToggle(portfolioId, next);
    setPending(false);
    if (!ok) {
      toast.error("변경에 실패했습니다.");
      return;
    }
    toast.success(next ? "공개로 전환했어요." : "비공개로 전환했어요.");
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/share/${portfolioId}`;
    await navigator.clipboard.writeText(url);
    toast.success("공유 링크를 복사했어요.");
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {isPublic ? "공개" : "비공개"}
      </span>
      <Switch checked={isPublic} disabled={pending} onCheckedChange={handleChange} />
      {isPublic && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleCopyLink}
        >
          <Link2 className="size-3.5" />
          링크 복사
        </Button>
      )}
    </div>
  );
}
