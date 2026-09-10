"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapLogRow, mapPortfolioRow, type LogRow, type PortfolioRow } from "@/lib/supabase/mappers";
import type { LogEntry, Portfolio } from "@/lib/types";

/**
 * 이력서 변환·자소서 매칭처럼 "프로젝트 전체를 넘나들며" 참고해야 하는
 * 기능을 위해, 현재 선택된 프로젝트에 국한하지 않고 사용자의 모든 로그와
 * 저장된 포트폴리오(kind=portfolio)를 가져온다.
 * refreshKey가 바뀌면 다시 불러온다 (새 기록/포트폴리오 저장 후 최신화 용도).
 */
export function useAllUserOutputs(refreshKey: number) {
  const [supabase] = useState(() => createClient());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: logRows }, { data: portfolioRows }] = await Promise.all([
        supabase
          .from("logs")
          .select("id, project_id, log_date, category, content, source, source_meta, created_at")
          .eq("user_id", user.id)
          .order("log_date", { ascending: true }),
        supabase
          .from("portfolios")
          .select("id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at")
          .eq("user_id", user.id)
          .eq("kind", "portfolio")
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setLogs(((logRows ?? []) as LogRow[]).map(mapLogRow));
      setPortfolios(((portfolioRows ?? []) as PortfolioRow[]).map(mapPortfolioRow));
      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  return { logs, portfolios, loaded };
}
