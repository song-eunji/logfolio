"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LogCalendar } from "@/components/calendar/LogCalendar";
import { DayLogForm } from "@/components/calendar/DayLogForm";
import { RepoImportForm } from "@/components/github/RepoImportForm";
import { GenerateButton } from "@/components/portfolio/GenerateButton";
import { PortfolioViewer } from "@/components/portfolio/PortfolioViewer";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ResumeGenerator } from "@/components/resume/ResumeGenerator";
import { CoverLetterForm } from "@/components/cover-letter/CoverLetterForm";
import { ShareToggle } from "@/components/portfolio/ShareToggle";
import { Badge } from "@/components/ui/badge";
import { useLogStore } from "@/hooks/use-log-store";
import { useProfile } from "@/hooks/use-profile";
import type { GenerationSource, GithubCommit, OutputKind } from "@/lib/types";

const KIND_LABEL: Record<OutputKind, string> = {
  portfolio: "포트폴리오",
  resume: "이력서",
  cover_letter: "자소서",
};

export default function Home() {
  const store = useLogStore();
  const { profile, updateProfile } = useProfile();
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

  async function handleSave() {
    if (!generation) return;
    const result = await store.savePortfolio({
      content: generation.markdown,
      generationSource: generation.generationSource,
      kind: "portfolio",
    });
    if (!result) {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    setSaved(true);
    toast.success("포트폴리오가 저장되었습니다.");
  }

  async function handleImportCommit(repo: string, commit: GithubCommit) {
    const { alreadyImported } = await store.importCommitAsLog({
      repo,
      commit,
      category: "개발",
    });
    if (alreadyImported) {
      toast.info("이미 기록에 추가된 커밋이에요.");
    } else {
      toast.success("커밋을 기록에 추가했어요.");
    }
  }

  async function handleSaveResume(content: string) {
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      kind: "resume",
    });
    return !!result;
  }

  async function handleSaveCoverLetter(
    content: string,
    meta: { question: string; charLimit: number }
  ) {
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      kind: "cover_letter",
      meta,
    });
    return !!result;
  }

  if (!store.hydrated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </main>
    );
  }

  const savedPortfolios = store.portfolios.filter((p) => p.kind === "portfolio");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            매일 3줄만 남기면, AI가 포트폴리오로 만들어드려요
          </h1>
          <input
            value={store.projectName}
            onChange={(e) => store.setProjectName(e.target.value)}
            className="rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm font-medium text-foreground hover:border-input focus:border-input focus:outline-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {store.logs.length}개의 기록이 쌓였어요. 기록이 쌓일수록 더 풍부한
          포트폴리오가 만들어집니다.
        </p>
      </section>

      <section>
        <ProfileSettings profile={profile} onSave={updateProfile} />
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

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">이력서 변환</h2>
        <ResumeGenerator
          portfolios={savedPortfolios}
          profile={profile}
          onSave={handleSaveResume}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">자소서 답변 생성</h2>
        <CoverLetterForm
          logs={store.logs}
          portfolios={savedPortfolios}
          profile={profile}
          onSave={handleSaveCoverLetter}
        />
      </section>

      {store.portfolios.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            저장된 산출물
          </h2>
          <ul className="flex flex-col gap-2">
            {store.portfolios.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="secondary" className="text-[11px]">
                      {KIND_LABEL[p.kind]}
                    </Badge>
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.kind === "cover_letter" && p.meta
                        ? p.meta.question.slice(0, 30)
                        : p.projectName}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.createdAt), "yyyy-MM-dd HH:mm")} ·{" "}
                    {p.generationSource === "ai" ? "AI 생성" : "로컬 초안"}
                  </p>
                </div>
                {p.kind === "portfolio" && (
                  <ShareToggle
                    portfolioId={p.id}
                    isPublic={p.isPublic}
                    onToggle={store.togglePublic}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
