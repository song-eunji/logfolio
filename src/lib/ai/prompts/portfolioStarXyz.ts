import type { LogEntry } from "@/lib/types";

function formatMMDD(isoDate: string) {
  const d = new Date(isoDate);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function formatLogsForPrompt(logs: LogEntry[]) {
  return logs
    .slice()
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((l) => `[${formatMMDD(l.logDate)}][${l.category}] ${l.content}`)
    .join("\n");
}

/**
 * 원본 로그폴리오(빅데이터캠프 2026)의 STAR/XYZ 생성 프롬프트를 이식한 것.
 * 가드레일(사실 기반 강제, 날짜 인용, HTML 태그 금지, 분량)은 여기서 프롬프트로 강제한다.
 *
 * TODO(신뢰성): 신규 유저 페르소나 테스트에서 발견 — 숫자/사실은 안 지어내지만,
 * 로그에 전혀 없는 배경 맥락(예: "팀 프로젝트였다", "개발자 간 소통이 필요했다")을
 * 임의로 붙이는 경향이 있음. 로그 "사이드 프로젝트 API 명세서 정리"만 줬는데
 * "팀 프로젝트의 완성도를 높이기 위해 개발자 간 소통이 필요했다"는 상황(Situation)을
 * 만들어냄. 나중에 프롬프트 다듬을 때 "로그에 명시되지 않은 협업 형태(팀/개인),
 * 조직 규모 등은 절대 단정하지 말 것" 같은 규칙을 추가해서 고칠 것.
 * (자소서 프롬프트 coverLetter.ts도 원본 로그를 직접 다루므로 같은 위험 있음 — 같이 확인.)
 */
export function buildPortfolioPrompt(input: {
  projectName: string;
  logsFormatted: string;
  uploadedResultRefs?: string[];
}) {
  const { projectName, logsFormatted, uploadedResultRefs = [] } = input;

  return `아래는 "${projectName}" 기간 동안 매일 남긴 짧은 활동 기록입니다. 각 줄은 [날짜][분류] 텍스트 형식입니다.

이 기록을 바탕으로, 실제 채용 담당자가 읽는 포트폴리오처럼 **STAR 기법(상황-과제-행동-결과)**과 **정량적 성과 중심(XYZ 형식: "~함으로써 ~를 ~만큼 달성/개선")**으로 정리해주세요. 막연한 나열이 아니라 "무엇을 어떻게 해결했는지"가 드러나야 합니다.

반드시 아래 마크다운 형식과 순서를 그대로 지켜 작성하세요. 제목을 바꾸거나 섹션을 생략하지 마세요.

# ${projectName} 포트폴리오

## 프로젝트 개요
- 기간: (기록 날짜 범위, 예: 07/10~07/13)
- 활동 분류: (기록에 나온 분류 요약)

## 주요 활동
학습·문제해결·협업/회의 등 활동 분류별로 잘게 나누지 말고, 전체 기록을 문제와 목표, 해결 과정이 드러나는 2~3개의 활동으로 묶어 정리하세요. 각 활동은 반드시 아래 STAR 구조로, 각 항목을 2~3문장 이상으로 구체적으로 작성하세요 (한 줄로 짧게 끝내지 말 것).
각 항목을 "### 소제목"과 아래 4줄로:
- 상황(Situation):
- 과제(Task):
- 행동(Action):
- 결과(Result): (수치화 가능하면 수치로, 아니면 구체적인 정성적 결과로)

## 핵심 성과 요약
(불릿 4~6개, "~함으로써 ~를 ~만큼" 형태 지향, 각 불릿도 배경과 과정을 살려 구체적으로)
규칙:
- 항목마다 근거가 된 날짜를 괄호로 표시 (예: (07/13))
- 기록에 없는 사실·수치는 절대 만들어내지 말 것 — 없으면 정성적으로 서술
${
  uploadedResultRefs.length > 0
    ? `- 아래에 결과물 정보가 있으면 관련된 주요 활동의 결과(Result) 다음 줄에 해당 [[RESULT_번호]] 표시를 정확히 한 번 넣을 것\n- 결과물의 제작 내용과 실제 결과는 제공된 정보만 사용하고, 입력 없음인 내용은 추측하지 말 것\n`
    : ""
}- 한국어로 작성, 전체 2000자 내외로 충분히 상세하게
- <br> 등 HTML 태그는 절대 사용하지 말 것. 줄바꿈은 실제 줄바꿈 문자로 표시

기록:
${logsFormatted}
${
  uploadedResultRefs.length > 0
    ? `\n결과물 정보:\n${uploadedResultRefs.join("\n\n")}`
    : ""
}`;
}
