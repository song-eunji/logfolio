import type { GithubCommit } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const author = searchParams.get("author")?.trim();

  if (!owner || !repo) {
    return Response.json(
      { error: "invalid_request", message: "owner와 repo가 필요합니다." },
      { status: 400 }
    );
  }

  const authorQuery = author ? `&author=${encodeURIComponent(author)}` : "";
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30${authorQuery}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    return Response.json(
      {
        error: "not_found",
        message: "저장소를 찾을 수 없거나 비공개 저장소입니다.",
      },
      { status: 404 }
    );
  }
  if (res.status === 403) {
    const resetHeader = res.headers.get("x-ratelimit-reset");
    return Response.json(
      {
        error: "rate_limited",
        message: "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        resetAt: resetHeader ? Number(resetHeader) * 1000 : null,
      },
      { status: 403 }
    );
  }
  if (!res.ok) {
    return Response.json(
      { error: "github_error", message: `GitHub API 오류 (${res.status})` },
      { status: 502 }
    );
  }

  const commits = (await res.json()) as Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author?: { date?: string; name?: string } };
  }>;

  const shaped: GithubCommit[] = commits.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    authorDate: c.commit.author?.date ?? null,
    authorName: c.commit.author?.name ?? null,
    url: c.html_url,
  }));

  return Response.json({ commits: shaped });
}
