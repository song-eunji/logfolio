"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortfolioViewer } from "@/components/portfolio/PortfolioViewer";
import { createClient } from "@/lib/supabase/client";
import { mapLogRow, type LogRow } from "@/lib/supabase/mappers";
import type { Project } from "@/lib/types";

export function JobMatchPortfolioGenerator({
  projects,
  onSave,
}: {
  projects: Project[];
  onSave: (content: string, projectName: string, jobPostingExcerpt: string) => Promise<boolean>;
}) {
  const [supabaseClient] = useState(() => createClient());
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? "");

  useEffect(() => {
    if (!projects.some((p) => p.id === selectedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(projects[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const [jobPosting, setJobPosting] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (projects.length === 0) return null;

  async function handleGenerate() {
    const project = projects.find((p) => p.id === selectedId);
    if (!project || jobPosting.trim().length < 20) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("no user");

      const { data: logRows, error: fetchError } = await supabaseClient
        .from("logs")
        .select("id, project_id, log_date, category, content, source, source_meta, created_at")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (fetchError) throw fetchError;
      const logs = ((logRows ?? []) as LogRow[]).map(mapLogRow);
      if (logs.length === 0) {
        setError("선택한 프로젝트에 기록이 없습니다.");
        return;
      }

      const res = await fetch("/api/portfolio/match-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: project.name, jobPosting, logs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setResult(data.markdown);
    } catch {
      setError("생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    const project = projects.find((p) => p.id === selectedId);
    const ok = await onSave(result, project?.name ?? "포트폴리오", jobPosting.slice(0, 200));
    if (ok) {
      setSaved(true);
      toast.success("공고 맞춤 포트폴리오가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Briefcase className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">채용공고 맞춤 포트폴리오</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        지원하려는 채용공고를 붙여넣으면, 그 공고와 관련성 높은 경험을 우선 강조해서 포트폴리오를 재구성해요.
      </p>

      <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="기록을 가져올 프로젝트 선택">
            {(value: string | null) => projects.find((p) => p.id === value)?.name ?? "프로젝트 선택"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        value={jobPosting}
        onChange={(e) => setJobPosting(e.target.value)}
        placeholder="채용공고 내용을 여기에 붙여넣으세요 (주요 업무, 자격요건, 우대사항 등)"
        rows={6}
      />

      <Button
        onClick={handleGenerate}
        disabled={generating || !selectedId || jobPosting.trim().length < 20}
        className="self-end gap-1.5"
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        공고 맞춤 포트폴리오 생성
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <PortfolioViewer
          markdown={result}
          generationSource="ai"
          onSave={handleSave}
          saved={saved}
        />
      )}
    </div>
  );
}
