"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import type { Portfolio } from "@/lib/types";
import type { Profile } from "@/hooks/use-profile";

export function ResumeGenerator({
  portfolios,
  profile,
  onSave,
}: {
  portfolios: Portfolio[];
  profile: Profile;
  onSave: (content: string, sourcePortfolioId: string) => Promise<boolean>;
}) {
  const [selectedId, setSelectedId] = useState<string>(portfolios[0]?.id ?? "");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // portfolios는 비동기로 나중에 채워지거나(전체 프로젝트 fetch), 새로 저장되어
    // 갱신될 수 있다. 현재 선택값이 더 이상 목록에 없으면(초기 빈 목록 포함) 첫
    // 항목으로 다시 맞춘다 — 이게 없으면 "변환" 버튼이 조용히 아무 반응도 안 한다.
    if (!portfolios.some((p) => p.id === selectedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(portfolios[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios]);

  if (portfolios.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          먼저 AI 포트폴리오를 하나 이상 저장하면 이력서로 변환할 수 있어요.
        </p>
      </div>
    );
  }

  async function handleGenerate() {
    const source = portfolios.find((p) => p.id === selectedId);
    if (!source) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioContent: source.content,
          job: profile.job,
          year: profile.year,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setResult(data.markdown);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    const ok = await onSave(result, selectedId);
    if (ok) {
      setSaved(true);
      toast.success("이력서가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <FileText className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">이력서 불릿 변환</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        {profile.job
          ? `"${profile.job}" 직무에 맞춰 관련 있는 성과를 우선 강조해서 정리해요.`
          : "내 정보에서 희망 직무를 입력하면 그 직무에 맞춰 강조 포인트가 달라져요."}
      </p>

      <div className="flex gap-2">
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="변환할 포트폴리오 선택">
              {(value: string | null) => {
                const selected = portfolios.find((p) => p.id === value);
                return selected
                  ? `${selected.projectName} (${new Date(selected.createdAt).toLocaleDateString("ko-KR")})`
                  : "변환할 포트폴리오 선택";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {portfolios.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.projectName} ({new Date(p.createdAt).toLocaleDateString("ko-KR")})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerate}
          disabled={loading || !selectedId}
          className="gap-1.5 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          변환
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4">
          <article className="prose prose-sm max-w-none prose-li:text-foreground">
            <ReactMarkdown>{result}</ReactMarkdown>
          </article>
          <Button
            onClick={handleSave}
            disabled={saved}
            size="sm"
            variant="secondary"
            className="self-end gap-1.5"
          >
            <Save className="size-3.5" />
            {saved ? "저장됨" : "저장"}
          </Button>
        </div>
      )}
    </div>
  );
}
