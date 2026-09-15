"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareToggle } from "@/components/portfolio/ShareToggle";
import { SlideViewer } from "@/components/share/SlideViewer";
import { DocumentViewer } from "@/components/share/DocumentViewer";
import { splitIntoSlides } from "@/lib/slides";
import { useLogStore } from "@/hooks/use-log-store";
import { useAllUserOutputs } from "@/hooks/use-all-outputs";
import { useProjectsContext } from "@/components/project/ProjectsProvider";
import type { CoverLetterMeta, OutputKind, Portfolio } from "@/lib/types";

const KIND_LABEL: Record<OutputKind, string> = {
  portfolio: "포트폴리오",
  resume: "이력서",
  cover_letter: "자소서",
};

const TABS: { key: OutputKind | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "portfolio", label: "포트폴리오" },
  { key: "resume", label: "이력서" },
  { key: "cover_letter", label: "자소서" },
];

function isCoverLetterMeta(meta: unknown): meta is CoverLetterMeta {
  return !!meta && typeof meta === "object" && "question" in meta;
}

export default function LibraryPage() {
  const { activeProjectId } = useProjectsContext();
  // togglePublic은 프로젝트에 무관하게 portfolios.id로 동작하므로, 현재 활성
  // 프로젝트의 store를 그대로 재사용한다 (별도 훅을 새로 만들 필요 없음).
  const store = useLogStore(activeProjectId);
  const [refreshKey, setRefreshKey] = useState(0);
  const allOutputs = useAllUserOutputs(refreshKey);
  const [selected, setSelected] = useState<Portfolio | null>(null);
  const [activeTab, setActiveTab] = useState<OutputKind | "all">("all");

  const filteredOutputs =
    activeTab === "all"
      ? allOutputs.outputs
      : allOutputs.outputs.filter((p) => p.kind === activeTab);

  const countByKind = (kind: OutputKind | "all") =>
    kind === "all"
      ? allOutputs.outputs.length
      : allOutputs.outputs.filter((p) => p.kind === kind).length;

  async function handleToggle(id: string, isPublic: boolean) {
    const ok = await store.togglePublic(id, isPublic);
    if (ok) setRefreshKey((k) => k + 1);
    return ok;
  }

  if (!allOutputs.loaded) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">보관함</h1>
        <p className="text-sm text-muted-foreground">
          지금까지 저장한 포트폴리오·이력서·자소서를 모아볼 수 있어요. 클릭하면 전체 내용을 볼 수 있습니다.
        </p>
      </section>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({countByKind(tab.key)})
          </button>
        ))}
      </div>

      {allOutputs.outputs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 저장된 산출물이 없어요. &quot;AI 스튜디오&quot;에서 먼저 하나 만들어보세요.
          </p>
        </div>
      ) : filteredOutputs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            이 종류로 저장된 산출물이 아직 없어요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredOutputs.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <button
                onClick={() => setSelected(p)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {KIND_LABEL[p.kind]}
                  </Badge>
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.kind === "cover_letter" && isCoverLetterMeta(p.meta)
                      ? p.meta.question.slice(0, 40)
                      : p.projectName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(p.createdAt), "yyyy-MM-dd HH:mm")} ·{" "}
                  {p.generationSource === "ai" ? "AI 생성" : "로컬 초안"}
                </p>
              </button>
              <ShareToggle
                portfolioId={p.id}
                isPublic={p.isPublic}
                onToggle={handleToggle}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {KIND_LABEL[selected.kind]}
                  </Badge>
                  {selected.projectName}
                </DialogTitle>
              </DialogHeader>
              {selected.kind === "portfolio" ? (
                <SlideViewer
                  slides={splitIntoSlides(selected.content)}
                  heading={selected.projectName}
                />
              ) : (
                <DocumentViewer
                  heading={selected.projectName}
                  subheading={
                    selected.kind === "cover_letter" && isCoverLetterMeta(selected.meta)
                      ? selected.meta.question
                      : undefined
                  }
                  content={selected.content}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
