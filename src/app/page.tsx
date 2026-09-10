"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LogCalendar } from "@/components/calendar/LogCalendar";
import { DayLogForm } from "@/components/calendar/DayLogForm";
import { RepoImportForm } from "@/components/github/RepoImportForm";
import { GenerateButton } from "@/components/portfolio/GenerateButton";
import { PortfolioViewer } from "@/components/portfolio/PortfolioViewer";
import { useLogStore } from "@/hooks/use-log-store";
import type { GenerationSource } from "@/lib/types";

export default function Home() {
  const store = useLogStore();
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [generation, setGeneration] = useState<{
    markdown: string;
    generationSource: GenerationSource;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: store.projectName,
          logs: store.logs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setGeneration({
        markdown: data.markdown,
        generationSource: data.generationSource,
      });
    } catch {
      setGenError("네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    if (!generation) return;
    store.savePortfolio({
      content: generation.markdown,
      generationSource: generation.generationSource,
    });
    setSaved(true);
    toast.success("포트폴리오가 저장되었습니다.");
  }

  function handleImportCommit(repo: string, commit: Parameters<typeof store.importCommitAsLog>[0]["commit"]) {
    const { alreadyImported } = store.importCommitAsLog({ repo, commit, category: "개발" });
    if (alreadyImported) {
      toast.info("이미 기록에 추가된 커밋이에요.");
    } else {
      toast.success("커밋을 기록에 추가했어요.");
    }
  }

  if (!store.hydrated) {
    return null;
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-bold text-foreground">
              Logfolio
            </span>
            <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              BETA
            </span>
          </div>
          <input
            value={store.projectName}
            onChange={(e) => store.setProjectName(e.target.value)}
            className="rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm font-medium text-foreground hover:border-input focus:border-input focus:outline-none"
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        <section className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">
            매일 3줄만 남기면, AI가 포트폴리오로 만들어드려요
          </h1>
          <p className="text-sm text-muted-foreground">
            {store.logs.length}개의 기록이 쌓였어요. 기록이 쌓일수록 더 풍부한
            포트폴리오가 만들어집니다.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <LogCalendar
            logs={store.logs}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <DayLogForm
            selectedDate={selectedDate}
            logs={store.logs}
            onAdd={store.addLog}
            onRemove={store.removeLog}
          />
        </section>

        <section>
          <RepoImportForm
            importedShas={store.importedShas}
            onImport={handleImportCommit}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              AI 포트폴리오 생성
            </h2>
            <GenerateButton
              onClick={handleGenerate}
              loading={generating}
              disabled={store.logs.length === 0}
            />
          </div>

          {store.logs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              먼저 위에서 활동 기록을 하나 이상 남겨주세요.
            </p>
          )}

          {genError && <p className="text-sm text-destructive">{genError}</p>}

          {generation && (
            <PortfolioViewer
              markdown={generation.markdown}
              generationSource={generation.generationSource}
              onSave={handleSave}
              saved={saved}
            />
          )}
        </section>

        {store.portfolios.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">
              저장된 포트폴리오
            </h2>
            <ul className="flex flex-col gap-2">
              {store.portfolios.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {p.projectName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.createdAt), "yyyy-MM-dd HH:mm")} ·{" "}
                    {p.generationSource === "ai" ? "AI 생성" : "로컬 초안"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
