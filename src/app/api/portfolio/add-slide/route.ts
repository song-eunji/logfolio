import { z } from "zod";
import { buildAddSlidePrompt } from "@/lib/ai/prompts/addSlide";
import { generateWithGemini } from "@/lib/ai/generatePortfolio";

const bodySchema = z.object({
  title: z.string().min(1),
  brief: z.string().min(1, "슬라이드에 들어갈 내용을 간단히 적어주세요."),
  existingMarkdown: z.string(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다.";
    return Response.json({ error: "invalid_request", message }, { status: 422 });
  }

  const { title, brief, existingMarkdown } = parsed.data;
  const prompt = buildAddSlidePrompt({ title, brief, existingMarkdown });

  try {
    const body = await generateWithGemini(prompt, { allowResultRefs: false });
    return Response.json({ body });
  } catch (err) {
    console.error("[api/portfolio/add-slide] failed", err);
    return Response.json(
      { error: "generation_failed", message: "슬라이드 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
