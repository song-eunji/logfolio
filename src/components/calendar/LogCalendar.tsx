"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeStreak } from "@/lib/habit";
import type { LogEntry } from "@/lib/types";

export function LogCalendar({
  logs,
  selectedDate,
  onSelectDate,
}: {
  logs: LogEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

  const logDatesSet = useMemo(
    () => new Set(logs.map((l) => l.logDate)),
    [logs]
  );
  const streak = useMemo(() => computeStreak(logDatesSet), [logDatesSet]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {format(visibleMonth, "yyyy년 M월")}
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              <Flame className="size-3" />
              {streak}일 연속 기록중
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
            aria-label="이전 달"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            aria-label="다음 달"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const hasLog = logDatesSet.has(key);
          const isSelected = key === selectedDate;
          const inMonth = isSameMonth(day, visibleMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isToday && !isSelected && "font-semibold text-primary"
              )}
            >
              {format(day, "d")}
              {hasLog && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
