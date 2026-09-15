import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SlideViewer } from "@/components/share/SlideViewer";
import { DocumentViewer } from "@/components/share/DocumentViewer";
import { Sparkles } from "lucide-react";
import type { CoverLetterMeta, OutputKind } from "@/lib/types";

const KIND_LABEL: Record<OutputKind, string> = {
  portfolio: "포트폴리오",
  resume: "이력서",
  cover_letter: "자소서",
};

function isCoverLetterMeta(meta: unknown): meta is CoverLetterMeta {
  return !!meta && typeof meta === "object" && "question" in meta;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let { data: output } = await supabase
    .from("portfolios")
    .select("project_name, content, kind, meta, is_public, created_at, layout")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (!output) {
    // layout 컬럼이 아직 없는 DB(마이그레이션 0004 미적용)에서도 공유 링크는 보이도록 재시도
    const fallback = await supabase
      .from("portfolios")
      .select("project_name, content, kind, meta, is_public, created_at")
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();
    output = fallback.data ? { ...fallback.data, layout: null } : null;
  }

  if (!output) {
    notFound();
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Logfolio</span>
          </div>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            {KIND_LABEL[output.kind as OutputKind]}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {output.kind === "portfolio" ? (
          <SlideViewer
            content={output.content}
            layout={output.layout}
            heading={output.project_name}
          />
        ) : (
          <DocumentViewer
            heading={output.project_name}
            subheading={
              output.kind === "cover_letter" && isCoverLetterMeta(output.meta)
                ? output.meta.question
                : undefined
            }
            content={output.content}
          />
        )}
      </main>
    </div>
  );
}
