"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquareText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LogEntry, Portfolio } from "@/lib/types";
import type { Profile } from "@/hooks/use-profile";
import { useSessionState } from "@/hooks/use-session-state";

export function CoverLetterForm({
  logs,
  portfolios,
  profile,
  onSave,
}: {
  logs: LogEntry[];
  portfolios: Portfolio[];
  profile: Profile;
  onSave: (
    content: string,
    meta: { question: string; charLimit: number }
  ) => Promise<boolean>;
}) {
  const [question, setQuestion] = useSessionState("cover:question", "");
  const [charLimit, setCharLimit] = useSessionState("cover:charLimit", 500);
  const [result, setResult] = useSessionState<{ answer: string; charCount: number } | null>(
    "cover:result",
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useSessionState("cover:saved", false);

  async function handleGenerate() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          charLimit,
          logs,
          portfolioContents: portfolios.map((p) => p.content),
          job: profile.job,
          year: profile.year,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setResult({ answer: data.answer, charCount: data.charCount });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    const ok = await onSave(result.answer, { question: question.trim(), charLimit });
    if (ok) {
      setSaved(true);
      toast.success("자소서 답변이 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  const overLimit = result ? result.charCount > charLimit : false;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <MessageSquareText className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">자소서 문항 답변 생성</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        쌓인 활동 기록과 포트폴리오 전체에서 관련 경험을 찾아 답변을 만들어요. 관련 경험이 없으면 지어내지 않고 솔직하게 말씀드려요.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="question">문항</Label>
        <Textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 협업 과정에서 갈등을 해결한 경험에 대해 서술해주세요."
          rows={3}
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="charLimit">글자 수 제한</Label>
          <Input
            id="charLimit"
            type="number"
            min={50}
            max={5000}
            value={charLimit}
            onChange={(e) => setCharLimit(Number(e.target.value) || 500)}
            className="w-28"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !question.trim()}
          className="gap-1.5"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          답변 생성
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{result.answer}</p>
          <div className="flex items-center justify-between">
            <span
              className={
                overLimit
                  ? "text-xs font-medium text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {result.charCount}자 / {charLimit}자
              {overLimit && " (제한 초과)"}
            </span>
            <div className="flex items-center gap-3">
              {!saved && (
                <span className="text-xs text-muted-foreground">
                  저장을 눌러야 보관함에 남아요
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={saved}
                size="sm"
                variant="secondary"
                className="gap-1.5"
              >
                <Save className="size-3.5" />
                {saved ? "저장됨" : "저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
