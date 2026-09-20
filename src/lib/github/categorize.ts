// 커밋 메시지 접두사(Conventional Commits)로 활동 분류를 추정한다.
const PREFIX_TO_CATEGORY: Record<string, string> = {
  feat: "개발",
  feature: "개발",
  add: "개발",
  perf: "개발",
  refactor: "개발",
  style: "개발",
  test: "개발",
  chore: "개발",
  build: "개발",
  ci: "개발",
  fix: "문제해결",
  hotfix: "문제해결",
  bug: "문제해결",
  revert: "문제해결",
  docs: "기획·문서",
  doc: "기획·문서",
};

export function categoryFromCommit(message: string): string | null {
  const first = message.split("\n")[0].trim();
  if (/^merge\b/i.test(first)) return "협업·회의";
  const m = /^(\w+)(?:\([^)]*\))?!?:/.exec(first.toLowerCase());
  return m ? PREFIX_TO_CATEGORY[m[1]] ?? null : null;
}
