import { getGeminiClient, PORTFOLIO_MODEL } from "@/lib/gemini/client";
import { sanitizePortfolioMarkdown } from "./sanitize";
import { findUnsupportedNumbers, stripNumbers } from "./guardrails";

async function callGemini(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: PORTFOLIO_MODEL,
    contents: prompt,
  });
  const text = response.text;
  if (!text) {
    throw new Error("Gemini 응답에서 텍스트를 찾지 못했습니다.");
  }
  return text;
}

export async function generateWithGemini(
  prompt: string,
  options: { allowResultRefs: boolean; sourceText?: string } = { allowResultRefs: false }
): Promise<string> {
  let text = await callGemini(prompt);

  // 기록에 없는 % / 배 수치가 섞였으면 한 번 다시 생성하고, 그래도 남으면 그 수치만 지운다.
  if (options.sourceText) {
    let bad = findUnsupportedNumbers(text, options.sourceText);
    if (bad.length > 0) {
      const retryPrompt = `${prompt}\n\n[수정 요청] 직전 결과에 기록에 없는 수치(${bad.join(", ")})가 있었습니다. 이런 수치를 모두 빼고 정성적인 표현으로 바꿔서 처음부터 다시 작성하세요.`;
      text = await callGemini(retryPrompt);
      bad = findUnsupportedNumbers(text, options.sourceText);
      if (bad.length > 0) text = stripNumbers(text, bad);
    }
  }

  return sanitizePortfolioMarkdown(text, options);
}
