import { EVIDENCE_RULES } from "@/lib/ai/guardrails";

export function buildResumeBulletsPrompt(input: {
  portfolioContent: string;
  job?: string | null;
  year?: string | null;
}) {
  const { portfolioContent, job, year } = input;

  const targetingRule = job
    ? `- 목표 직무: ${job}${year ? ` (${year})` : ""}
- 이 직무의 채용 담당자가 중요하게 볼 역량·성과(예: 개발 직무면 기술적 문제 해결·성능/구조 개선, 기획 직무면 문제 정의·의사결정·협업 조율 등)를 우선순위 상단에 배치하고, 해당 직무와 관련성이 낮은 내용은 간결하게 줄이거나 생략하세요.`
    : `- 특정 목표 직무가 지정되지 않았으므로, 범용적으로 가장 임팩트 있는 성과 위주로 정리하세요.`;

  return `아래는 한 사용자의 활동 포트폴리오(STAR 형식)입니다. 이를 채용 지원용 이력서에 바로 쓸 수 있는 불릿 형태로 압축해주세요.

${targetingRule}

규칙:
${EVIDENCE_RULES}
- 각 불릿은 "행동 동사로 시작 + 무엇을 했는지 + 결과(수치는 포트폴리오에 있을 때만)" 형태의 한 문장, 40~60자 내외로 간결하게 작성하세요.
- 전체 5~8개 불릿만 출력하세요.
- 마크다운 불릿 목록(-)으로만 출력하고, 제목이나 설명 문구는 붙이지 마세요.

포트폴리오:
${portfolioContent}`;
}
