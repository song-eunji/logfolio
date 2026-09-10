"use client";

import { useCallback, useEffect, useState } from "react";
import type { GithubCommit, LogEntry, Portfolio } from "@/lib/types";

/**
 * Supabase 연결 전까지 브라우저 로컬 저장소로 동작하는 임시 스토어.
 * Supabase가 붙으면 이 훅의 내부 구현만 DB 호출로 교체하고,
 * 반환하는 인터페이스(logs/addLog/importCommit/portfolios/savePortfolio)는 그대로 유지한다.
 */

const PROJECT_ID = "local-default-project";
const STORAGE_KEY = "logfolio:v1";

interface StoredState {
  projectName: string;
  logs: LogEntry[];
  portfolios: Portfolio[];
}

const initialState: StoredState = {
  projectName: "내 캠프 프로젝트",
  logs: [],
  portfolios: [],
};

function loadState(): StoredState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as StoredState;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export function useLogStore() {
  const [state, setState] = useState<StoredState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage는 클라이언트에만 존재하므로, SSR과의 하이드레이션 불일치를 피하려면
    // 초기 렌더는 initialState로 맞추고 마운트 후 여기서 실제 값을 읽어와야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setProjectName = useCallback((name: string) => {
    setState((s) => ({ ...s, projectName: name }));
  }, []);

  const addLog = useCallback(
    (input: { logDate: string; category: string; content: string }) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        projectId: PROJECT_ID,
        logDate: input.logDate,
        category: input.category,
        content: input.content,
        source: "manual",
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, logs: [...s.logs, entry] }));
      return entry;
    },
    []
  );

  const removeLog = useCallback((id: string) => {
    setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));
  }, []);

  const importCommitAsLog = useCallback(
    (input: { repo: string; commit: GithubCommit; category: string }) => {
      const { repo, commit, category } = input;
      let alreadyImported = false;
      setState((s) => {
        const exists = s.logs.some(
          (l) => l.source === "github" && l.sourceMeta?.sha === commit.sha
        );
        if (exists) {
          alreadyImported = true;
          return s;
        }
        const logDate = (commit.authorDate ?? new Date().toISOString()).slice(
          0,
          10
        );
        const entry: LogEntry = {
          id: crypto.randomUUID(),
          projectId: PROJECT_ID,
          logDate,
          category,
          content: commit.message.split("\n")[0],
          source: "github",
          sourceMeta: { repo, sha: commit.sha, url: commit.url },
          createdAt: new Date().toISOString(),
        };
        return { ...s, logs: [...s.logs, entry] };
      });
      return { alreadyImported };
    },
    []
  );

  const savePortfolio = useCallback(
    (input: { content: string; generationSource: Portfolio["generationSource"] }) => {
      const portfolio: Portfolio = {
        id: crypto.randomUUID(),
        projectId: PROJECT_ID,
        projectName: state.projectName,
        content: input.content,
        generationSource: input.generationSource,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, portfolios: [portfolio, ...s.portfolios] }));
      return portfolio;
    },
    [state.projectName]
  );

  return {
    hydrated,
    projectId: PROJECT_ID,
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
