import { z } from "zod";
import { buildJobMatchPrompt } from "@/lib/ai/prompts/jobMatchPortfolio";
import { formatLogsForPrompt } from "@/lib/ai/prompts/portfolioStarXyz";
import { generateWithGemini } from "@/lib/ai/generatePortfolio";
import type { LogEntry } from "@/lib/types";

const logSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  logDate: z.string(),
  category: z.string(),
  content: z.string(),
  source: z.enum(["manual", "github"]),
  sourceMeta: z
    .object({ repo: z.string(), sha: z.string(), url: z.string() })
    .nullable()
    .optional(),
  createdAt: z.string(),
});

const bodySchema = z.object({
  projectName: z.string().min(1),
  projectDescription: z.string().nullable().optional(),
  jobPosting: z.string().min(20, "채용공고 내용을 조금 더 자세히 붙여넣어주세요."),
  logs: z.array(logSchema).min(1, "참고할 기록이 없습니다."),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다.";
    return Response.json({ error: "invalid_request", message }, { status: 422 });
  }

  const { projectName, projectDescription, jobPosting, logs } = parsed.data;
  const logsFormatted = formatLogsForPrompt(logs as LogEntry[]);
  const prompt = buildJobMatchPrompt({
    projectName,
    projectDescription,
    jobPosting,
    logsFormatted,
  });

  try {
    const markdown = await generateWithGemini(prompt, {
      allowResultRefs: false,
      sourceText: `${logsFormatted}
${projectDescription ?? ""}
${jobPosting}`,
    });
    return Response.json({ markdown });
  } catch (err) {
    console.error("[api/portfolio/match-job] failed", err);
    return Response.json(
      { error: "generation_failed", message: "생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
