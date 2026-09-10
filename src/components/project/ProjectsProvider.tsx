"use client";

import { createContext, useContext } from "react";
import { useProjects } from "@/hooks/use-projects";

type ProjectsContextValue = ReturnType<typeof useProjects>;

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const value = useProjects();
  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjectsContext() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error("useProjectsContext must be used within ProjectsProvider");
  }
  return ctx;
}
