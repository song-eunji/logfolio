import type { LogEntry } from "@/lib/types";
import { formatLogsForPrompt } from "./prompts/portfolioStarXyz";

/**
 * Claude 호출이 실패했을 때의 폴백. STAR로 재구성하지 않고
 * 로그를 분류별로 기계적으로 묶어 같은 마크다운 틀에 채워 넣는다 (LLM 미사용).
 */
export function buildLocalDraft(input: {
  projectName: string;
  logs: LogEntry[];
}) {
  const { projectName, logs } = input;
  const sorted = logs.slice().sort((a, b) => a.logDate.localeCompare(b.logDate));
  const dateRange =
    sorted.length > 0
      ? `${sorted[0].logDate} ~ ${sorted[sorted.length - 1].logDate}`
      : "기록 없음";

  const byCategory = new Map<string, LogEntry[]>();
  for (const log of sorted) {
    const list = byCategory.get(log.category) ?? [];
    list.push(log);
    byCategory.set(log.category, list);
  }

  const activities = Array.from(byCategory.entries())
    .map(([category, entries]) => {
      const bullets = entries
        .map((e) => `  - (${e.logDate}) ${e.content}`)
        .join("\n");
      return `### ${category}\n- 상황: 아래 기록된 활동들이 이 분류에서 진행되었습니다.\n- 과제: (AI 생성 실패로 자동 요약되지 않았습니다. 원본 기록을 참고하세요.)\n- 행동:\n${bullets}\n- 결과: (원본 기록 기반, 재구성되지 않음)`;
    })
    .join("\n\n");

  return `# ${projectName} 포트폴리오

## 프로젝트 개요
- 기간: ${dateRange}
- 활동 분류: ${Array.from(byCategory.keys()).join(", ") || "없음"}

## 주요 활동
${activities || "기록이 없습니다."}

## 핵심 성과 요약
- AI 생성에 실패하여 로그 원문을 그대로 정리한 초안입니다. 다시 생성해보세요.

원본 로그:
${formatLogsForPrompt(sorted)}`;
}
