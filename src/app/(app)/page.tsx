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
import { CombinedPortfolioGenerator } from "@/components/portfolio/CombinedPortfolioGenerator";
import { ProjectSwitcher } from "@/components/project/ProjectSwitcher";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogStore } from "@/hooks/use-log-store";
import { useProfile } from "@/hooks/use-profile";
import { useProjects } from "@/hooks/use-projects";
import { useAllUserOutputs } from "@/hooks/use-all-outputs";
import type {
  CoverLetterMeta,
  GenerationSource,
  GithubCommit,
  OutputKind,
} from "@/lib/types";

const KIND_LABEL: Record<OutputKind, string> = {
  portfolio: "포트폴리오",
  resume: "이력서",
  cover_letter: "자소서",
};

function isCoverLetterMeta(meta: unknown): meta is CoverLetterMeta {
  return !!meta && typeof meta === "object" && "question" in meta;
}

export default function Home() {
  const { loaded: projectsLoaded, projects, activeProjectId, setActiveProjectId, createProject, renameProject } =
    useProjects();
  const store = useLogStore(activeProjectId);
  const { profile, updateProfile } = useProfile();
  const [refreshKey, setRefreshKey] = useState(0);
  const allOutputs = useAllUserOutputs(refreshKey);
  const bump = () => setRefreshKey((k) => k + 1);
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

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  async function handleGenerate() {
    if (!activeProject) return;
    setGenerating(true);
    setGenError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: activeProject.name,
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
    if (!generation || !activeProject) return;
    const result = await store.savePortfolio({
      content: generation.markdown,
      generationSource: generation.generationSource,
      projectName: activeProject.name,
      kind: "portfolio",
    });
    if (!result) {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    setSaved(true);
    bump();
    toast.success("포트폴리오가 저장되었습니다.");
  }

  async function handleAddLog(input: {
    logDate: string;
    category: string;
    content: string;
  }) {
    const entry = await store.addLog(input);
    if (entry) bump();
    return entry;
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
      bump();
      toast.success("커밋을 기록에 추가했어요.");
    }
  }

  async function handleSaveResume(content: string) {
    if (!activeProject) return false;
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      projectName: activeProject.name,
      kind: "resume",
    });
    return !!result;
  }

  async function handleSaveCoverLetter(
    content: string,
    meta: { question: string; charLimit: number }
  ) {
    if (!activeProject) return false;
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      projectName: activeProject.name,
      kind: "cover_letter",
      meta,
    });
    return !!result;
  }

  async function handleSaveCombined(
    content: string,
    generationSource: GenerationSource,
    combinedProjectNames: string[]
  ) {
    if (!activeProject) return false;
    const result = await store.savePortfolio({
      content,
      generationSource,
      projectName: `${combinedProjectNames.join(" + ")} 통합`,
      kind: "portfolio",
      meta: { combinedProjectNames },
    });
    if (result) bump();
    return !!result;
  }

  if (!projectsLoaded || !store.hydrated) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-foreground">
            매일 3줄만 남기면, AI가 포트폴리오로 만들어드려요
          </h1>
          <ProjectSwitcher
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={setActiveProjectId}
            onCreate={createProject}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm text-muted-foreground">
            {store.logs.length}개의 기록이 쌓였어요. 기록이 쌓일수록 더 풍부한
            포트폴리오가 만들어집니다.
          </p>
          {activeProject && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              프로젝트 이름:
              <input
                value={activeProject.name}
                onChange={(e) => renameProject(activeProject.id, e.target.value)}
                className="rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-foreground hover:border-input focus:border-input focus:outline-none"
              />
            </label>
          )}
        </div>
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
          onAdd={handleAddLog}
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
        <h2 className="text-base font-semibold text-foreground">통합 포트폴리오</h2>
        <CombinedPortfolioGenerator projects={projects} onSave={handleSaveCombined} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">이력서 변환</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          모든 프로젝트에 저장된 포트폴리오 중에서 골라 변환할 수 있어요.
        </p>
        <ResumeGenerator
          portfolios={allOutputs.portfolios}
          profile={profile}
          onSave={handleSaveResume}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">자소서 답변 생성</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          모든 프로젝트의 기록과 포트폴리오를 통틀어 관련 경험을 찾아요.
        </p>
        <CoverLetterForm
          logs={allOutputs.logs}
          portfolios={allOutputs.portfolios}
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
                      {p.kind === "cover_letter" && isCoverLetterMeta(p.meta)
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
