"use client";

import { useState } from "react";
import { GitCommit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommitList } from "./CommitList";
import type { GithubCommit } from "@/lib/types";

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; commits: GithubCommit[] };

export function RepoImportForm({
  importedShas,
  onImport,
}: {
  importedShas: Set<string>;
  onImport: (repo: string, commit: GithubCommit) => void;
}) {
  const [repoInput, setRepoInput] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });

  async function handleFetch() {
    const trimmed = repoInput.trim();
    const [owner, repo] = trimmed.split("/");
    if (!owner || !repo) {
      setState({
        status: "error",
        message: "owner/repo 형식으로 입력해주세요. 예) vercel/next.js",
      });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch(
        `/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.message ?? "요청에 실패했습니다." });
        return;
      }
      setState({ status: "success", commits: data.commits });
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다." });
    }
  }

  const repoKey = repoInput.trim();

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <GitCommit className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">
          GitHub 커밋 불러오기
        </p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        공개 저장소의 owner/repo를 입력하면 최근 커밋을 불러옵니다. 원하는 커밋만 골라 기록에 추가하세요.
      </p>

      <div className="flex gap-2">
        <Input
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="owner/repo (예: vercel/next.js)"
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
        <Button
          onClick={handleFetch}
          disabled={state.status === "loading"}
          className="shrink-0"
        >
          {state.status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "불러오기"
          )}
        </Button>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {state.status === "success" && (
        <CommitList
          commits={state.commits}
          importedShas={importedShas}
          onImport={(commit) => onImport(repoKey, commit)}
        />
      )}
    </div>
  );
}
