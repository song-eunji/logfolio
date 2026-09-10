"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, GitCommit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { LogEntry } from "@/lib/types";

export function DayLogForm({
  selectedDate,
  logs,
  onAdd,
  onRemove,
}: {
  selectedDate: string;
  logs: LogEntry[];
  onAdd: (input: { logDate: string; category: string; content: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [content, setContent] = useState("");

  const dayLogs = useMemo(
    () => logs.filter((l) => l.logDate === selectedDate),
    [logs, selectedDate]
  );

  const hint =
    dayLogs.length === 0
      ? "오늘 한 일을 3줄로 짧게 남겨보세요."
      : dayLogs.length < 3
      ? "조금만 더 남기면 더 풍부한 포트폴리오가 됩니다."
      : "오늘 기록 완료! 이 흐름을 이어가 보세요.";

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    const finalCategory = category === "__custom__" ? customCategory.trim() : category;
    if (!finalCategory) return;
    onAdd({ logDate: selectedDate, category: finalCategory, content: trimmed });
    setContent("");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {format(parseISO(selectedDate), "M월 d일")} 기록
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setCategory("__custom__")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            category === "__custom__"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          + 직접 입력
        </button>
      </div>

      {category === "__custom__" && (
        <input
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="분류 이름"
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
        />
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={"예)\n1. API 응답 속도 개선을 위해 캐싱 로직 추가\n2. 팀원과 페어프로그래밍으로 버그 원인 파악\n3. 내일 발표 자료 초안 작성"}
        rows={4}
        className="resize-none"
      />

      <Button onClick={handleSubmit} className="self-end gap-1.5">
        <Plus className="size-4" />
        기록 추가
      </Button>

      {dayLogs.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {dayLogs.map((log) => (
            <li
              key={log.id}
              className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {log.category}
                  </Badge>
                  {log.source === "github" && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <GitCommit className="size-3" />
                      커밋
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {log.content}
                </p>
              </div>
              <button
                onClick={() => onRemove(log.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="삭제"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
