import { z } from "zod";
import { formatLogsForPrompt } from "@/lib/ai/prompts/portfolioStarXyz";
import { generateCoverLetterAnswer } from "@/lib/ai/generateCoverLetter";
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
  question: z.string().min(1),
  charLimit: z.number().int().min(50).max(5000),
  logs: z.array(logSchema),
  portfolioContents: z.array(z.string()).default([]),
  job: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다.";
    return Response.json({ error: "invalid_request", message }, { status: 422 });
  }

  const { question, charLimit, logs, portfolioContents, job, year } = parsed.data;
  if (logs.length === 0 && portfolioContents.length === 0) {
    return Response.json(
      { error: "no_data", message: "참고할 활동 기록이 없습니다." },
      { status: 422 }
    );
  }

  const logsFormatted = formatLogsForPrompt(logs as LogEntry[]);
  const portfolioSummaries = portfolioContents.join("\n\n---\n\n");

  try {
    const result = await generateCoverLetterAnswer({
      question,
      charLimit,
      logsFormatted,
      portfolioSummaries,
      job,
      year,
    });
    return Response.json(result);
  } catch (err) {
    console.error("[api/cover-letter/generate] failed", err);
    return Response.json(
      { error: "generation_failed", message: "자소서 답변 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
