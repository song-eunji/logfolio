"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, NotebookText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/types";

export function ProjectDescription({
  project,
  onSave,
}: {
  project: Project;
  onSave: (id: string, description: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(project.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(project.description ?? "");
  }, [project.id, project.description]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(project.id, value.trim());
    setSaving(false);
    if (ok) {
      toast.success("프로젝트 소개가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <NotebookText className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">프로젝트 소개</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        활동 기록은 &quot;무엇을 했는지&quot;만 담아요. 이 프로젝트가 뭘 만드는 프로젝트인지,
        어떤 기술을 썼는지는 여기 한 번 적어두면 포트폴리오 생성 시 개요에 반영돼요.
      </p>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="예) AI 기반 활동 기록 → 포트폴리오 자동 생성 서비스. Next.js, Supabase, Gemini API 사용. 백엔드/AI 파이프라인 담당."
        rows={3}
      />
      <Button
        onClick={handleSave}
        disabled={saving}
        size="sm"
        className="self-end gap-1.5"
      >
        {saving ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Save className="size-3.5" />
        )}
        저장
      </Button>
    </div>
  );
}
