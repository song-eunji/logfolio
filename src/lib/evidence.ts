import type { LogEntry } from "@/lib/types";

function mmdd(iso: string) {
  return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
}

/** "근거: 기록 10개 (09/14 ~ 09/20)" 형태의 한 줄 설명 */
export function buildEvidenceNote(logs: LogEntry[]): string {
  if (logs.length === 0) return "";
  const dates = logs.map((l) => l.logDate).sort();
  const range =
    dates[0] === dates[dates.length - 1]
      ? mmdd(dates[0])
      : `${mmdd(dates[0])} ~ ${mmdd(dates[dates.length - 1])}`;
  return `근거: 내 기록 ${logs.length}개 (${range})`;
}
