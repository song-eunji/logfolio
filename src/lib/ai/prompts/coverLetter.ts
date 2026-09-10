// TODO(신뢰성): portfolioStarXyz.ts에 적어둔 "맥락 부풀리기" 문제 참고 —
// 이 프롬프트도 원본 로그를 직접 다루므로 같이 점검할 것.
export function buildCoverLetterPrompt(input: {
  question: string;
  charLimit: number;
  logsFormatted: string;
  portfolioSummaries: string;
  job?: string | null;
  year?: string | null;
}) {
  const minChars = Math.round(input.charLimit * 0.8);
  const maxChars = Math.round(input.charLimit * 0.95);
  const targetLine = input.job
    ? `- 지원 직무: ${input.job}${input.year ? ` (${input.year})` : ""}\n`
    : "";

  return `당신은 자기소개서 작성을 돕는 커리어 코치입니다.

아래는 자기소개서 문항과, 지원자가 그동안 남긴 활동 기록·포트폴리오입니다.

[문항]
${input.question}

[글자 수 제한]
${input.charLimit}자 이내 (목표: ${minChars}~${maxChars}자, 공백 포함)

${targetLine}[활동 기록]
${input.logsFormatted}

[작성한 포트폴리오]
${input.portfolioSummaries || "없음"}

규칙:
- 기록·포트폴리오에 없는 경험이나 사실을 절대 지어내지 마세요.
- 문항과 관련된 경험이 기록에 전혀 없다면, 없는 경험을 지어내는 대신 "관련 경험을 찾기 어렵습니다"라고 정직하게 답변하세요.
- 관련 경험이 있다면 결론(무엇을 했는지/느낀 점)을 먼저 말하는 두괄식으로 작성하세요.
- 글자 수 제한을 반드시 지키세요.
- 답변 본문만 출력하고, 문항 반복이나 제목은 붙이지 마세요.`;
}

export function buildRetryShortenPrompt(input: {
  previousAnswer: string;
  charLimit: number;
  excessChars: number;
}) {
  return `아래 자소서 답변이 글자 수 제한(${input.charLimit}자)을 ${input.excessChars}자 초과했습니다. 내용의 핵심(결론과 핵심 경험)은 유지하면서, 정확히 ${input.excessChars}자 이상 줄여서 다시 작성해주세요. 답변 본문만 출력하세요.

[기존 답변]
${input.previousAnswer}`;
}
