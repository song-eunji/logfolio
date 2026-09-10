"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapLogRow, mapPortfolioRow, type LogRow, type PortfolioRow } from "@/lib/supabase/mappers";
import type { GithubCommit, LogEntry, OutputKind, Portfolio, PortfolioMeta } from "@/lib/types";

interface State {
  logs: LogEntry[];
  portfolios: Portfolio[];
}

/**
 * Supabase 기반 데이터 계층. 주어진 projectId 하나의 로그/포트폴리오를 관리한다.
 * 프로젝트 목록 자체는 useProjects가 담당한다 (관심사 분리).
 */
export function useLogStore(projectId: string | null) {
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<State>({ logs: [], portfolios: [] });
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      // 활성 프로젝트가 없어졌을 때(예: 전환 중) 이전 프로젝트의 데이터가 잠깐 보이지 않도록 비운다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ logs: [], portfolios: [] });
      setHydrated(false);
      return;
    }

    let cancelled = false;

    async function load(currentProjectId: string) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;

      const [{ data: logRows }, { data: portfolioRows }] = await Promise.all([
        supabase
          .from("logs")
          .select("id, project_id, log_date, category, content, source, source_meta, created_at")
          .eq("project_id", currentProjectId)
          .eq("user_id", user.id)
          .order("log_date", { ascending: true }),
        supabase
          .from("portfolios")
          .select("id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at")
          .eq("project_id", currentProjectId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      setState({
        logs: ((logRows ?? []) as LogRow[]).map(mapLogRow),
        portfolios: ((portfolioRows ?? []) as PortfolioRow[]).map(mapPortfolioRow),
      });
      setHydrated(true);
    }

    setHydrated(false);
    load(projectId);
    return () => {
      cancelled = true;
    };
  }, [projectId, supabase]);

  const addLog = useCallback(
    async (input: { logDate: string; category: string; content: string }) => {
      if (!projectId || !userIdRef.current) return null;
      const { data, error } = await supabase
        .from("logs")
        .insert({
          project_id: projectId,
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
    [projectId, supabase]
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
      if (!projectId || !userIdRef.current) return { alreadyImported: false };

      const alreadyLocal = state.logs.some(
        (l) => l.source === "github" && l.sourceMeta?.sha === commit.sha
      );
      if (alreadyLocal) return { alreadyImported: true };

      const logDate = (commit.authorDate ?? new Date().toISOString()).slice(0, 10);
      const { data, error } = await supabase
        .from("logs")
        .insert({
          project_id: projectId,
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
    [projectId, state.logs, supabase]
  );

  const savePortfolio = useCallback(
    async (input: {
      content: string;
      generationSource: Portfolio["generationSource"];
      projectName: string;
      kind?: OutputKind;
      meta?: PortfolioMeta | null;
    }) => {
      if (!projectId || !userIdRef.current) return null;
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: userIdRef.current,
          project_id: projectId,
          project_name: input.projectName,
          content: input.content,
          generation_source: input.generationSource,
          kind: input.kind ?? "portfolio",
          meta: input.meta ?? null,
        })
        .select("id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at")
        .single();

      if (error || !data) {
        console.error("[use-log-store] savePortfolio failed", error);
        return null;
      }
      const portfolio = mapPortfolioRow(data as PortfolioRow);
      setState((s) => ({ ...s, portfolios: [portfolio, ...s.portfolios] }));
      return portfolio;
    },
    [projectId, supabase]
  );

  const togglePublic = useCallback(
    async (portfolioId: string, isPublic: boolean) => {
      setState((s) => ({
        ...s,
        portfolios: s.portfolios.map((p) =>
          p.id === portfolioId ? { ...p, isPublic } : p
        ),
      }));
      const { error } = await supabase
        .from("portfolios")
        .update({ is_public: isPublic })
        .eq("id", portfolioId);
      if (error) {
        console.error("[use-log-store] togglePublic failed", error);
        setState((s) => ({
          ...s,
          portfolios: s.portfolios.map((p) =>
            p.id === portfolioId ? { ...p, isPublic: !isPublic } : p
          ),
        }));
        return false;
      }
      return true;
    },
    [supabase]
  );

  return {
    hydrated,
    logs: state.logs,
    addLog,
    removeLog,
    importCommitAsLog,
    portfolios: state.portfolios,
    savePortfolio,
    togglePublic,
    importedShas: new Set(
      state.logs
        .filter((l) => l.source === "github" && l.sourceMeta?.sha)
        .map((l) => l.sourceMeta!.sha)
    ),
  };
}
