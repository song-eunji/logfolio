"use client";

import { FolderKanban } from "lucide-react";
import { ProjectSwitcher } from "@/components/project/ProjectSwitcher";
import { useProjectsContext } from "@/components/project/ProjectsProvider";

export function ProjectBar() {
  const { loaded, projects, activeProjectId, setActiveProjectId, createProject, renameProject } =
    useProjectsContext();

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  if (!loaded) return null;

  return (
    <div className="border-b border-border bg-accent/40">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <FolderKanban className="size-4" />
          프로젝트
        </span>
        <ProjectSwitcher
          projects={projects}
          activeProjectId={activeProjectId}
          onSelect={setActiveProjectId}
          onCreate={createProject}
        />
        {activeProject && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            이름:
            <input
              value={activeProject.name}
              onChange={(e) => renameProject(activeProject.id, e.target.value)}
              className="rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-foreground hover:border-input focus:border-input focus:outline-none"
            />
          </label>
        )}
      </div>
    </div>
  );
}
