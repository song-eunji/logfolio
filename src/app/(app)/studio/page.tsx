"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GenerateButton } from "@/components/portfolio/GenerateButton";
import { PortfolioViewer } from "@/components/portfolio/PortfolioViewer";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ResumeGenerator } from "@/components/resume/ResumeGenerator";
import { CoverLetterForm } from "@/components/cover-letter/CoverLetterForm";
import { CombinedPortfolioGenerator } from "@/components/portfolio/CombinedPortfolioGenerator";
import { JobMatchPortfolioGenerator } from "@/components/portfolio/JobMatchPortfolioGenerator";
import { ProjectDescription } from "@/components/project/ProjectDescription";
import { Skeleton } from "@/components/ui/skeleton";
import { DismissibleBanner } from "@/components/onboarding/DismissibleBanner";
import { useLogStore } from "@/hooks/use-log-store";
import { useProfile } from "@/hooks/use-profile";
import { useProjectsContext } from "@/components/project/ProjectsProvider";
import { useAllUserOutputs } from "@/hooks/use-all-outputs";
import type { GenerationSource } from "@/lib/types";

export default function StudioPage() {
  const {
    loaded: projectsLoaded,
    projects,
    activeProjectId,
    updateProjectDescription,
  } = useProjectsContext();
  const store = useLogStore(activeProjectId);
  const { profile, updateProfile } = useProfile();
  const [refreshKey, setRefreshKey] = useState(0);
  const allOutputs = useAllUserOutputs(refreshKey);
  const bump = () => setRefreshKey((k) => k + 1);

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
          projectDescription: activeProject.description,
          logs: store.logs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.message ?? "생성에 실패했습니다.");
        return;
      }
      setGeneration({ markdown: data.markdown, generationSource: data.generationSource });
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

  async function handleSaveJobMatch(
    content: string,
    projectName: string,
    jobPostingExcerpt: string
  ) {
    if (!activeProjectId) return false;
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      projectName: `${projectName} (공고 맞춤)`,
      kind: "portfolio",
      meta: { jobPostingExcerpt },
    });
    if (result) bump();
    return !!result;
  }

  async function handleSaveResume(content: string) {
    if (!activeProject) return false;
    const result = await store.savePortfolio({
      content,
      generationSource: "ai",
      projectName: activeProject.name,
      kind: "resume",
    });
    if (result) bump();
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
    if (result) bump();
    return !!result;
  }

  if (!projectsLoaded || !store.hydrated) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">AI 스튜디오</h1>
        <p className="text-sm text-muted-foreground">
          현재 프로젝트: <span className="font-medium text-foreground">{activeProject?.name}</span> ·
          {" "}{store.logs.length}개의 기록
        </p>
      </section>

      <DismissibleBanner storageKey="logfolio:studioIntroDismissed">
        <p>
          <strong className="font-semibold">AI 스튜디오</strong>에서는 기록을 포트폴리오로
          생성하고, 여러 프로젝트를 하나로 합치거나, 채용공고에 맞춰 재구성하고, 이력서·자소서
          로도 바꿀 수 있어요. 아래에서 하나씩 시도해보세요.
        </p>
      </DismissibleBanner>

      <section>
        <ProfileSettings profile={profile} onSave={updateProfile} />
      </section>

      {activeProject && (
        <section>
          <ProjectDescription
            project={activeProject}
            onSave={updateProjectDescription}
          />
        </section>
      )}

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
            먼저 &quot;기록&quot; 탭에서 활동 기록을 하나 이상 남겨주세요.
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
        <h2 className="text-base font-semibold text-foreground">채용공고 맞춤 포트폴리오</h2>
        <JobMatchPortfolioGenerator projects={projects} onSave={handleSaveJobMatch} />
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
    </main>
  );
}
