"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapPortfolioRow, type PortfolioRow } from "@/lib/supabase/mappers";
import type { Portfolio } from "@/lib/types";
import type { PortfolioLayout } from "@/lib/slideLayout";

const SELECT_WITH_LAYOUT =
  "id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at, layout";
const SELECT_WITHOUT_LAYOUT =
  "id, project_id, project_name, content, generation_source, kind, meta, is_public, created_at";

/**
 * 캔바식 편집기 화면(단일 포트폴리오)의 데이터 계층.
 * layout 컬럼(마이그레이션 0004) 미적용 DB에서도 동작하도록 조회 실패 시 예전 컬럼으로 재시도한다.
 */
export function usePortfolioEditor(portfolioId: string) {
  const [supabase] = useState(() => createClient());
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [layoutColumnAvailable, setLayoutColumnAvailable] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let { data, error } = await supabase
        .from("portfolios")
        .select(SELECT_WITH_LAYOUT)
        .eq("id", portfolioId)
        .maybeSingle();

      let layoutOk = true;
      if (error) {
        layoutOk = false;
        const fallback = await supabase
          .from("portfolios")
          .select(SELECT_WITHOUT_LAYOUT)
          .eq("id", portfolioId)
          .maybeSingle();
        data = fallback.data ? { ...fallback.data, layout: null } : null;
        error = fallback.error;
      }

      if (cancelled) return;
      setLayoutColumnAvailable(layoutOk);
      if (error || !data) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setPortfolio(mapPortfolioRow(data as PortfolioRow));
      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [portfolioId, supabase]);

  const saveLayout = useCallback(
    (layout: PortfolioLayout) => {
      setPortfolio((p) => (p ? { ...p, layout } : p));
      if (!layoutColumnAvailable) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const { error } = await supabase
          .from("portfolios")
          .update({ layout })
          .eq("id", portfolioId);
        if (error) console.error("[use-portfolio-editor] saveLayout failed", error);
      }, 700);
    },
    [portfolioId, supabase, layoutColumnAvailable]
  );

  return { portfolio, loaded, notFound, layoutColumnAvailable, saveLayout };
}
