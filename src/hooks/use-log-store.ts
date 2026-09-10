"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapLogRow, mapPortfolioRow, type LogRow, type PortfolioRow } from "@/lib/supabase/mappers";
import type { GithubCommit, LogEntry, Portfolio } from "@/lib/types";

const DEFAULT_PROJECT_NAME = "내 캠프 프로젝트";

interface State {
  projectId: string | null;
  projectName: string;
  logs: LogEntry[];
  portfolios: Portfolio[];
}

/**
 * Supabase 기반 데이터 계층. 사용자당 "기본 프로젝트" 하나를 자동으로 찾거나 만들어
 * 그 프로젝트의 로그/포트폴리오를 관리한다 (멀티 프로젝트 대시보드는 이후 단계).
 * 이 훅이 반환하는 인터페이스는 이전 localStorage 버전과 동일하게 유지했다.
 */
export function useLogStore() {
  const supabase = useRef(createClient()).current;
  const [state, setState] = useState<State>({
    projectId: null,
    projectName: DEFAULT_PROJECT_NAME,
    logs: [],
    portfolios: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;

      let projectId: string;
      let projectName: string;

      const { data: existing } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing) {
        projectId = existing.id;
        projectName = existing.name;
      } else {
        const { data: created, error } = await supabase
          .from("projects")
          .insert({ user_id: user.id, name: DEFAULT_PROJECT_NAME })
          .select("id, name")
          .single();
        if (error || !created) {
          console.error("[use-log-store] failed to create default project", error);
          return;
        }
        projectId = created.id;
        projectName = created.name;
      }

      const [{ data: logRows }, { data: portfolioRows }] = await Promise.all([
        supabase
          .from("logs")
          .select("id, project_id, log_date, category, content, source, source_meta, created_at")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .order("log_date", { ascending: true }),
        supabase
          .from("portfolios")
          .select("id, project_id, project_name, content, generation_source, created_at")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      setState({
        projectId,
        projectName,
        logs: ((logRows ?? []) as LogRow[]).map(mapLogRow),
        portfolios: ((portfolioRows ?? []) as PortfolioRow[]).map(mapPortfolioRow),
      });
      setHydrated(true);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProjectName = useCallback(
    (name: string) => {
      setState((s) => ({ ...s, projectName: name }));
      if (state.projectId) {
        supabase.from("projects").update({ name }).eq("id", state.projectId).then();
      }
    },
    [state.projectId, supabase]
  );

  const addLog = useCallback(
    async (input: { logDate: string; category: string; content: string }) => {
      if (!state.projectId || !userIdRef.current) return null;
      const { data, error } = await supabase
        .from("logs")
        .insert({
          project_id: state.projectId,
          user_id: userIdRef.current,
          log_date: input.logDate,
          category: input.category,
          content: input.content,
          source: "manual",
        })
        .select("id, project_id, log_date, category, content, source, source_meta, created_at")
        .single();

      if (error || !data) {
        console.error("[use-log-store] addLog failed", error);
        return null;
      }
      const entry = mapLogRow(data as LogRow);
      setState((s) => ({ ...s, logs: [...s.logs, entry] }));
      return entry;
    },
    [state.projectId, supabase]
  );

  const removeLog = useCallback(
    async (id: string) => {
      setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));
      const { error } = await supabase.from("logs").delete().eq("id", id);
      if (error) console.error("[use-log-store] removeLog failed", error);
    },
    [supabase]
  );

  const importCommitAsLog = useCallback(
    async (input: { repo: string; commit: GithubCommit; category: string }) => {
      const { repo, commit, category } = input;
      if (!state.projectId || !userIdRef.current) return { alreadyImported: false };

      const alreadyLocal = state.logs.some(
        (l) => l.source === "github" && l.sourceMeta?.sha === commit.sha
      );
      if (alreadyLocal) return { alreadyImported: true };

      const logDate = (commit.authorDate ?? new Date().toISOString()).slice(0, 10);
      const { data, error } = await supabase
        .from("logs")
        .insert({
          project_id: state.projectId,
          user_id: userIdRef.current,
          log_date: logDate,
          category,
          content: commit.message.split("\n")[0],
          source: "github",
          source_meta: { repo, sha: commit.sha, url: commit.url },
        })
        .select("id, project_id, log_date, category, content, source, source_meta, created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          return { alreadyImported: true };
        }
        console.error("[use-log-store] importCommitAsLog failed", error);
        return { alreadyImported: false };
      }

      const entry = mapLogRow(data as LogRow);
      setState((s) => ({ ...s, logs: [...s.logs, entry] }));
      return { alreadyImported: false };
    },
    [state.projectId, state.logs, supabase]
  );

  const savePortfolio = useCallback(
    async (input: { content: string; generationSource: Portfolio["generationSource"] }) => {
      if (!state.projectId || !userIdRef.current) return null;
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: userIdRef.current,
          project_id: state.projectId,
          project_name: state.projectName,
          content: input.content,
          generation_source: input.generationSource,
        })
        .select("id, project_id, project_name, content, generation_source, created_at")
        .single();

      if (error || !data) {
        console.error("[use-log-store] savePortfolio failed", error);
        return null;
      }
      const portfolio = mapPortfolioRow(data as PortfolioRow);
      setState((s) => ({ ...s, portfolios: [portfolio, ...s.portfolios] }));
      return portfolio;
    },
    [state.projectId, state.projectName, supabase]
  );

  return {
    hydrated,
    projectId: state.projectId ?? "",
    projectName: state.projectName,
    setProjectName,
    logs: state.logs,
    addLog,
    removeLog,
    importCommitAsLog,
    portfolios: state.portfolios,
    savePortfolio,
    importedShas: new Set(
      state.logs
        .filter((l) => l.source === "github" && l.sourceMeta?.sha)
        .map((l) => l.sourceMeta!.sha)
    ),
  };
}
