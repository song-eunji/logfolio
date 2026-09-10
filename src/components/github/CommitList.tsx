"use client";

import { format } from "date-fns";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GithubCommit } from "@/lib/types";

export function CommitList({
  commits,
  importedShas,
  onImport,
}: {
  commits: GithubCommit[];
  importedShas: Set<string>;
  onImport: (commit: GithubCommit) => void;
}) {
  if (commits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        불러온 커밋이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {commits.map((commit) => {
        const isImported = importedShas.has(commit.sha);
        return (
          <li
            key={commit.sha}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-muted-foreground">
                {commit.authorName ?? "unknown"} ·{" "}
                {commit.authorDate
                  ? format(new Date(commit.authorDate), "yyyy-MM-dd HH:mm")
                  : "날짜 없음"}{" "}
                · <span className="font-mono">{commit.sha.slice(0, 7)}</span>
              </p>
            </div>
            <Button
              size="sm"
              variant={isImported ? "secondary" : "outline"}
              disabled={isImported}
              onClick={() => onImport(commit)}
              className="shrink-0 gap-1"
            >
              {isImported ? (
                <>
                  <Check className="size-3.5" />
                  추가됨
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  기록에 추가
                </>
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
