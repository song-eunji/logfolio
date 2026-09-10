import { getGeminiClient, PORTFOLIO_MODEL } from "@/lib/gemini/client";
import { sanitizePortfolioMarkdown } from "./sanitize";

export async function generateWithGemini(
  prompt: string,
  options: { allowResultRefs: boolean } = { allowResultRefs: false }
): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: PORTFOLIO_MODEL,
    contents: prompt,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini 응답에서 텍스트를 찾지 못했습니다.");
  }

  return sanitizePortfolioMarkdown(text, options);
}
