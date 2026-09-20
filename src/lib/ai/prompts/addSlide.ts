import { EVIDENCE_RULES } from "@/lib/ai/guardrails";

export function buildAddSlidePrompt(input: {
  title: string;
  brief: string;
  existingMarkdown: string;
}) {
  return `아래는 이미 작성된 포트폴리오 전체 내용입니다. 사용자가 여기에 새 슬라이드를 하나 추가하려고 합니다.

[기존 포트폴리오 전체]
${input.existingMarkdown}

[새 슬라이드 제목]
${input.title}

[사용자가 적은 간단한 메모]
${input.brief}

위 메모를 바탕으로, 기존 포트폴리오와 어울리는 톤으로 이 슬라이드의 본문을 작성해주세요.

규칙:
${EVIDENCE_RULES}
- 마크다운 헤딩(#, ##, ###)이나 <br> 같은 HTML 태그는 쓰지 말고, 순수 본문 문단/불릿만 작성하세요.
- 한국어로, 3~6문장 정도의 간결한 분량으로 작성하세요.

본문만 출력하세요 (제목 반복 금지).`;
}
