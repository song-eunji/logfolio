import type { CoverLetterMeta, LogEntry, OutputKind, Portfolio } from "@/lib/types";

// DB(snake_case) <-> 앱 타입(camelCase) 변환

export interface LogRow {
  id: string;
  project_id: string;
  log_date: string;
  category: string;
  content: string;
  source: "manual" | "github";
  source_meta: { repo: string; sha: string; url: string } | null;
  created_at: string;
}

export function mapLogRow(row: LogRow): LogEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    logDate: row.log_date,
    category: row.category,
    content: row.content,
    source: row.source,
    sourceMeta: row.source_meta,
    createdAt: row.created_at,
  };
}

export interface PortfolioRow {
  id: string;
  project_id: string;
  project_name: string;
  content: string;
  generation_source: "ai" | "local_fallback";
  kind: OutputKind;
  meta: CoverLetterMeta | null;
  created_at: string;
}

export function mapPortfolioRow(row: PortfolioRow): Portfolio {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    content: row.content,
    generationSource: row.generation_source,
    kind: row.kind,
    meta: row.meta,
    createdAt: row.created_at,
  };
}
