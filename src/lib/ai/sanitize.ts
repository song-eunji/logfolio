/**
 * 프롬프트 가드레일을 보완하는 얇은 후처리 안전망.
 * 자동 사실검증은 하지 않는다 — 원본 설계와 동일하게 가드레일은 프롬프트가 담당한다.
 */
export function sanitizePortfolioMarkdown(
  raw: string,
  options: { allowResultRefs: boolean }
) {
  let text = raw.replace(/<br\s*\/?>/gi, "\n");

  if (!options.allowResultRefs) {
    text = text.replace(/\[\[RESULT_\d+\]\]/g, "");
  }

  return text.trim();
}
