"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Layers, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PortfolioViewer } from "@/components/portfolio/PortfolioViewer";
import { createClient } from "@/lib/supabase/client";
import { mapLogRow, type LogRow } from "@/lib/supabase/mappers";
import type { GenerationSource, Project } from "@/lib/types";

export function CombinedPortfolioGenerator({
  projects,
  onSave,
}: {
  projects: Project[];
  onSave: (
    content: string,
    generationSource: GenerationSource,
    combinedProjectNames: string[]
  ) => Promise<boolean>;
}) {
  const supabase = useRef(createClient()).current;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    markdown: string;
    generationSource: GenerationSource;
    names: string[];
  } | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selected.size < 2) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");

      const ids = Array.from(selected);
      const { data: logRows, error: fetchError } = await supabase
        .from("logs")
        .select("id, project_id, log_date, category, content, source, source_meta, created_at")
        .in("project_id", ids)
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (fetchError) throw fetchError;
      const logs = ((logRows ?? []) as LogRow[]).map(mapLogRow);
      if (logs.length === 0) {
        setError("선택한 프로젝트에 기록이 없습니다.");
        return;
      }

      const names = projects.filter((p) => selected.has(p.id)).map((p) => p.name);
      const combinedName = `${names.join(" + ")} 통합`;

      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: combinedName, logs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setResult({ markdown: data.markdown, generationSource: data.generationSource, names });
    } catch {
      setError("생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    const ok = await onSave(result.markdown, result.generationSource, result.names);
    if (ok) {
      setSaved(true);
      toast.success("통합 포트폴리오가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  if (projects.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          프로젝트가 2개 이상일 때 여러 프로젝트를 하나로 합친 포트폴리오를 만들 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Layers className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">통합 포트폴리오 만들기</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        2개 이상의 프로젝트를 선택하면, 각 프로젝트의 기록을 모아 하나의 포트폴리오로 재구성해요.
      </p>

      <ul className="flex flex-col gap-1.5">
        {projects.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selected.has(p.id)}
                onCheckedChange={() => toggle(p.id)}
              />
              {p.name}
            </label>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleGenerate}
        disabled={selected.size < 2 || generating}
        className="self-end gap-1.5"
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        통합 포트폴리오 생성 ({selected.size}개 선택)
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <PortfolioViewer
          markdown={result.markdown}
          generationSource={result.generationSource}
          onSave={handleSave}
          saved={saved}
        />
      )}
    </div>
  );
}
