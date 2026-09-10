"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LogCalendar } from "@/components/calendar/LogCalendar";
import { DayLogForm } from "@/components/calendar/DayLogForm";
import { RepoImportForm } from "@/components/github/RepoImportForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogStore } from "@/hooks/use-log-store";
import { useProjectsContext } from "@/components/project/ProjectsProvider";
import type { GithubCommit } from "@/lib/types";

export default function RecordPage() {
  const { loaded: projectsLoaded, activeProjectId } = useProjectsContext();
  const store = useLogStore(activeProjectId);
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
    </main>
  );
}
