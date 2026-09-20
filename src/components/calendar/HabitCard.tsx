"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeLongestStreak, computeStreak, computeWeek } from "@/lib/habit";
import type { LogEntry } from "@/lib/types";

export function HabitCard({ logs }: { logs: LogEntry[] }) {
  const dates = useMemo(() => new Set(logs.map((l) => l.logDate)), [logs]);
  const streak = useMemo(() => computeStreak(dates), [dates]);
  const longest = useMemo(() => computeLongestStreak(dates), [dates]);
  const week = useMemo(() => computeWeek(dates), [dates]);

  const todayDone = dates.has(format(new Date(), "yyyy-MM-dd"));
  const weekCount = week.filter((d) => d.done).length;

  let message: string;
  let tone: "done" | "risk" | "start";
  if (todayDone) {
    message = "오늘 기록 완료! 이 흐름을 내일도 이어가 보세요.";
    tone = "done";
  } else if (streak > 0) {
    message = `오늘 3줄만 남기면 ${streak + 1}일 연속이 돼요. 지금 끊기기 전에 남겨보세요.`;
    tone = "risk";
  } else {
    message = "오늘 첫 3줄을 남기고 연속 기록을 시작해보세요.";
    tone = "start";
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              streak > 0 ? "bg-orange-100 text-orange-500" : "bg-muted text-muted-foreground"
            )}
          >
            <Flame className="size-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {streak > 0 ? `${streak}일 연속 기록 중` : "연속 기록 0일"}
            </p>
            <p
              className={cn(
                "text-xs",
                tone === "risk" ? "font-medium text-orange-600" : "text-muted-foreground"
              )}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-center">
          <Stat label="이번 주" value={`${weekCount}/7일`} />
          <Stat label="최장 연속" value={`${longest}일`} />
          <Stat label="누적 기록" value={`${logs.length}개`} />
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-1.5">
        {week.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-medium",
                d.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : d.isToday
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground",
                d.isFuture && "opacity-40"
              )}
            >
              {d.done ? "✓" : ""}
            </span>
            <span className={cn("text-[11px]", d.isToday ? "font-semibold text-primary" : "text-muted-foreground")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
