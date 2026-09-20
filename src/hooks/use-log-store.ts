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

      const [{ data: logRows }, portfolioResult] = await Promise.all([
        supabase
          .from("logs")
          .select("id, project_id, log_date, category, content, source, source_meta, created_at")
          .eq("project_id", currentProjectId)
          .eq("user_id", user.id)
          .order("log_date", { ascending: true }),
        supabase
          .from("portfolios")
          .select(
            "id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at, layout"
          )
          .eq("project_id", currentProjectId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      let portfolioRows = portfolioResult.data;
      if (portfolioResult.error) {
        // layout 컬럼이 아직 없는 DB(마이그레이션 0004 미적용)에서도 앱이
        // 계속 동작하도록, 실패하면 예전 컬럼 구성으로 한 번 더 시도한다.
        console.warn(
          "[use-log-store] layout 컬럼 조회 실패 — 0004 마이그레이션 미적용으로 추정, 예전 컬럼으로 재시도",
          portfolioResult.error
        );
        const fallback = await supabase
          .from("portfolios")
          .select("id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at")
          .eq("project_id", currentProjectId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        portfolioRows = (fallback.data ?? []).map((r) => ({ ...r, layout: null }));
      }

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

  const updateLog = useCallback(
    async (id: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return false;
      const previous = state.logs;
      setState((s) => ({
        ...s,
        logs: s.logs.map((l) => (l.id === id ? { ...l, content: trimmed } : l)),
      }));
      const { error } = await supabase.from("logs").update({ content: trimmed }).eq("id", id);
      if (error) {
        console.error("[use-log-store] updateLog failed", error);
        setState((s) => ({ ...s, logs: previous }));
        return false;
      }
      return true;
    },
    [state.logs, supabase]
  );

  const removePortfolio = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("portfolios").delete().eq("id", id);
      if (error) {
        console.error("[use-log-store] removePortfolio failed", error);
        return false;
      }
      setState((s) => ({ ...s, portfolios: s.portfolios.filter((p) => p.id !== id) }));
      return true;
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
    updateLog,
    removePortfolio,
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
