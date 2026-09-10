import { z } from "zod";
import { buildResumeBulletsPrompt } from "@/lib/ai/prompts/resumeBullets";
import { generateWithGemini } from "@/lib/ai/generatePortfolio";

const bodySchema = z.object({
  portfolioContent: z.string().min(1),
  job: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", message: "요청 형식이 올바르지 않습니다." },
      { status: 422 }
    );
  }

  const { portfolioContent, job, year } = parsed.data;
  const prompt = buildResumeBulletsPrompt({ portfolioContent, job, year });

  try {
    const markdown = await generateWithGemini(prompt, { allowResultRefs: false });
    return Response.json({ markdown });
  } catch (err) {
    console.error("[api/resume/generate] failed", err);
    return Response.json(
      { error: "generation_failed", message: "이력서 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
