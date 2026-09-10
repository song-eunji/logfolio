"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

const DEFAULT_PROJECT_NAME = "내 캠프 프로젝트";

/**
 * 사용자의 프로젝트 목록을 관리한다. 프로젝트가 하나도 없으면 기본 프로젝트를
 * 자동으로 만들어준다 (기존 단일 프로젝트 동작과의 하위 호환).
 */
export function useProjects() {
  const [supabase] = useState(() => createClient());
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;

      const { data: rows } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      let list = rows ?? [];
      if (list.length === 0) {
        const { data: created, error } = await supabase
          .from("projects")
          .insert({ user_id: user.id, name: DEFAULT_PROJECT_NAME })
          .select("id, name, created_at")
          .single();
        if (error || !created) {
          console.error("[use-projects] failed to create default project", error);
          return;
        }
        list = [created];
      }

      if (cancelled) return;
      const mapped = list.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
      }));
      setProjects(mapped);
      setActiveProjectId(mapped[0]?.id ?? null);
      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProject = useCallback(
    async (name: string) => {
      if (!userIdRef.current || !name.trim()) return null;
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: userIdRef.current, name: name.trim() })
        .select("id, name, created_at")
        .single();
      if (error || !data) {
        console.error("[use-projects] createProject failed", error);
        return null;
      }
      const project: Project = { id: data.id, name: data.name, createdAt: data.created_at };
      setProjects((p) => [...p, project]);
      setActiveProjectId(project.id);
      return project;
    },
    [supabase]
  );

  const renameProject = useCallback(
    async (id: string, name: string) => {
      if (!name.trim()) return;
      setProjects((p) => p.map((pr) => (pr.id === id ? { ...pr, name } : pr)));
      const { error } = await supabase.from("projects").update({ name }).eq("id", id);
      if (error) console.error("[use-projects] renameProject failed", error);
    },
    [supabase]
  );

  return {
    loaded,
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    renameProject,
  };
}
