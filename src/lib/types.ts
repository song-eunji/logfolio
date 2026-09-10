export type LogCategory =
  | "개발"
  | "기획·문서"
  | "협업·회의"
  | "학습"
  | "문제해결"
  | "리더십"
  | (string & {});

export type LogSource = "manual" | "github";

export interface LogEntry {
  id: string;
  projectId: string;
  logDate: string; // yyyy-MM-dd
  category: LogCategory;
  content: string;
  source: LogSource;
  sourceMeta?: { repo: string; sha: string; url: string } | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  authorDate: string | null;
  authorName: string | null;
  url: string;
}

export type GenerationSource = "ai" | "local_fallback";

export interface Portfolio {
  id: string;
  projectId: string;
  projectName: string;
  content: string;
  generationSource: GenerationSource;
  createdAt: string;
}
