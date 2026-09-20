import { z } from "zod";
import { buildPortfolioPrompt, formatLogsForPrompt } from "@/lib/ai/prompts/portfolioStarXyz";
import { generateWithGemini } from "@/lib/ai/generatePortfolio";
import { buildLocalDraft } from "@/lib/ai/localDraft";
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
  logs: z.array(logSchema).min(1, "기록된 로그가 없습니다."),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다.";
    return Response.json({ error: "invalid_request", message }, { status: 422 });
  }

  const { projectName, projectDescription, logs } = parsed.data;
  const logsFormatted = formatLogsForPrompt(logs as LogEntry[]);
  const prompt = buildPortfolioPrompt({ projectName, projectDescription, logsFormatted });

  try {
    const markdown = await generateWithGemini(prompt, {
      allowResultRefs: false,
      sourceText: `${logsFormatted}
${projectDescription ?? ""}`,
    });
    return Response.json({ markdown, generationSource: "ai" as const });
  } catch (err) {
    console.error("[api/portfolio/generate] Gemini call failed, falling back to local draft", err);
    const markdown = buildLocalDraft({ projectName, logs: logs as LogEntry[] });
    return Response.json({ markdown, generationSource: "local_fallback" as const });
  }
}
