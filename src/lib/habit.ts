import { addDays, format, startOfWeek } from "date-fns";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/** 오늘 기록이 아직 없어도 어제까지 이어졌으면 스트릭으로 인정한다. */
export function computeStreak(logDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!logDates.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (logDates.has(fmt(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(logDates: Set<string>): number {
  const sorted = [...logDates].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of sorted) {
    const d = new Date(`${s}T00:00:00`);
    run = prev && fmt(addDays(prev, 1)) === s ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

const WEEK_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 이번 주(월~일)의 기록 여부 */
export function computeWeek(logDates: Set<string>) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = fmt(new Date());
  return WEEK_LABELS.map((label, i) => {
    const date = fmt(addDays(start, i));
    return { label, date, done: logDates.has(date), isToday: date === today, isFuture: date > today };
  });
}
