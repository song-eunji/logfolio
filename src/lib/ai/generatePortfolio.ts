import { getAnthropicClient, PORTFOLIO_MODEL } from "@/lib/anthropic/client";
import { sanitizePortfolioMarkdown } from "./sanitize";

export async function generateWithClaude(
  prompt: string,
  options: { allowResultRefs: boolean } = { allowResultRefs: false }
): Promise<string> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: PORTFOLIO_MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find(
    (block): block is Extract<typeof block, { type: "text" }> =>
      block.type === "text"
  );
  if (!textBlock?.text) {
    throw new Error("Claude 응답에서 텍스트를 찾지 못했습니다.");
  }

  return sanitizePortfolioMarkdown(textBlock.text, options);
}
