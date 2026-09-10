"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

const DEFAULT_PROJECT_NAME = "내 캠프 프로젝트";
const ACTIVE_PROJECT_STORAGE_KEY = "logfolio:activeProjectId";

function readStoredActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredActiveProjectId(id: string) {
  try {
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id);
  } catch {
    // 저장 실패해도 앱 동작에는 지장 없음 (세션 중 선택만 유지됨)
  }
}

/**
 * 사용자의 프로젝트 목록을 관리한다. 프로젝트가 하나도 없으면 기본 프로젝트를
 * 자동으로 만들어준다. 선택된 프로젝트는 localStorage에 남겨서, 여러 페이지를
 * 오가도(기록/AI 스튜디오/보관함) 같은 프로젝트를 계속 보게 한다.
 */
export function useProjects() {
  const [supabase] = useState(() => createClient());
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
    writeStoredActiveProjectId(id);
  }, []);

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

      const stored = readStoredActiveProjectId();
      const initial = mapped.find((p) => p.id === stored)?.id ?? mapped[0]?.id ?? null;
      setActiveProjectIdState(initial);
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
    [supabase, setActiveProjectId]
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
