import { generateWithGemini } from "./generatePortfolio";
import { buildCoverLetterPrompt, buildRetryShortenPrompt } from "./prompts/coverLetter";

/**
 * 목표 글자수의 80~95%를 1차 목표로 프롬프트에 명시하고, 그래도 초과하면
 * 정확한 초과 글자 수를 알려주며 최대 3회까지 재축약을 반복한다 (총 최대 4회 생성).
 */
export async function generateCoverLetterAnswer(input: {
  question: string;
  charLimit: number;
  logsFormatted: string;
  portfolioSummaries: string;
  job?: string | null;
  year?: string | null;
}): Promise<{ answer: string; charCount: number; attempts: number }> {
  const prompt = buildCoverLetterPrompt(input);
  const sourceText = `${input.logsFormatted}
${input.portfolioSummaries}
${input.question}`;
  let answer = await generateWithGemini(prompt, { allowResultRefs: false, sourceText });
  let attempts = 1;

  while (answer.length > input.charLimit && attempts < 4) {
    const excessChars = answer.length - input.charLimit;
    const retryPrompt = buildRetryShortenPrompt({
      previousAnswer: answer,
      charLimit: input.charLimit,
      excessChars,
    });
    answer = await generateWithGemini(retryPrompt, { allowResultRefs: false, sourceText });
    attempts += 1;
  }

  return { answer, charCount: answer.length, attempts };
}
