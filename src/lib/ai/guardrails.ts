// 모든 생성 프롬프트가 공유하는 "기록을 근거로만 쓴다" 규칙.
export const EVIDENCE_RULES = `- 기록(그리고 주어졌다면 프로젝트 소개)에 적힌 내용만 근거로 삼고, 없는 사실은 만들어내지 마세요.
- 기록에 명시되지 않은 수치는 절대 쓰지 마세요. 퍼센트(%), 배수(N배), 인원·건수·시간·횟수, "100%", "대폭" 같은 표현이 해당됩니다. 수치는 기록에 있을 때만 그대로 인용하고, 없으면 "안정적으로", "명확하게" 같은 정성적 표현을 쓰세요.
- 기록에 없는 협업 형태(팀/개인), 팀 규모, 사용자 수, 서비스 규모, 사용 기술은 단정하지 마세요.
- 기록에서 확인되지 않는 결과나 효과를 추정해 부풀려 쓰지 마세요.`;

const UNSUPPORTED_NUMBER = /\d+(?:\.\d+)?\s*(?:%|퍼센트|배)/g;

const squash = (s: string) => s.replace(/\s+/g, "");

/** 결과에 나온 %/배 수치 중, 원본 자료(기록 등)에 그대로 없는 것을 찾는다. */
export function findUnsupportedNumbers(output: string, sourceText: string): string[] {
  const source = squash(sourceText);
  const found = new Set<string>();
  for (const m of output.matchAll(UNSUPPORTED_NUMBER)) {
    if (!source.includes(squash(m[0]))) found.add(m[0]);
  }
  return [...found];
}

export function stripNumbers(output: string, tokens: string[]): string {
  let text = output;
  for (const t of tokens) text = text.split(t).join("");
  return text.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.)])/g, "$1");
}
