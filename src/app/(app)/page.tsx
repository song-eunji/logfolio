"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LogCalendar } from "@/components/calendar/LogCalendar";
import { DayLogForm } from "@/components/calendar/DayLogForm";
import { RepoImportForm } from "@/components/github/RepoImportForm";
import { ProjectDescription } from "@/components/project/ProjectDescription";
import { ProjectBar } from "@/components/project/ProjectBar";
import { HabitCard } from "@/components/calendar/HabitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useLogStore } from "@/hooks/use-log-store";
import { useProfile } from "@/hooks/use-profile";
import { useProjectsContext } from "@/components/project/ProjectsProvider";
import type { GithubCommit } from "@/lib/types";

export default function RecordPage() {
  const {
    loaded: projectsLoaded,
    projects,
    activeProjectId,
    updateProjectDescription,
  } = useProjectsContext();
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const store = useLogStore(activeProjectId);
  const { profile } = useProfile();
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  async function handleImportCommit(
    repo: string,
    commit: GithubCommit,
    category: string
  ) {
    const { alreadyImported } = await store.importCommitAsLog({
      repo,
      commit,
      category,
    });
    if (alreadyImported) {
      toast.info("이미 기록에 추가된 커밋이에요.");
    } else {
      toast.success("커밋을 기록에 추가했어요.");
    }
  }

  async function handleApplyRepoInfo(text: string) {
    if (!activeProject) return;
    const current = activeProject.description?.trim();
    const next = current ? `${current}
${text}` : text;
    const ok = await updateProjectDescription(activeProject.id, next);
    if (ok) toast.success("프로젝트 소개에 사용 기술을 추가했어요.");
    else toast.error("소개 저장에 실패했습니다.");
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
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">
          기억이 아니라, 매일 3줄 기록으로 쓰는 포트폴리오·이력서·자소서
        </h1>
        <p className="text-sm text-muted-foreground">
          {store.logs.length}개의 기록이 쌓였어요. AI는 여기 쌓인 기록에 있는 것만
          근거로 씁니다.
        </p>
      </section>

      <ProjectBar />

      {activeProject && (
        <section>
          <ProjectDescription
            project={activeProject}
            onSave={updateProjectDescription}
          />
        </section>
      )}

      <OnboardingChecklist
        items={[
          { label: "오늘 기록 3줄 남기기", done: store.logs.length > 0 },
          { label: "희망 직무 입력하기", done: !!profile.job, href: "/studio" },
          {
            label: "첫 포트폴리오 만들어보기",
            done: store.portfolios.some((p) => p.kind === "portfolio"),
            href: "/studio",
          },
        ]}
      />

      <HabitCard logs={store.logs} />

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
          onUpdate={store.updateLog}
        />
      </section>

      <section>
        <RepoImportForm
          importedShas={store.importedShas}
          onImport={handleImportCommit}
          onApplyRepoInfo={handleApplyRepoInfo}
        />
      </section>
    </main>
  );
}
