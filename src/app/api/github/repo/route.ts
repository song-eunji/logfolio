export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  if (!owner || !repo) {
    return Response.json({ error: "invalid_request", message: "owner와 repo가 필요합니다." }, { status: 400 });
  }

  const headers = {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const [repoRes, langRes] = await Promise.all([
    fetch(base, { headers, cache: "no-store" }),
    fetch(`${base}/languages`, { headers, cache: "no-store" }),
  ]);
  if (!repoRes.ok) {
    return Response.json({ error: "github_error", message: "저장소 정보를 불러오지 못했습니다." }, { status: repoRes.status === 404 ? 404 : 502 });
  }

  const info = (await repoRes.json()) as { description: string | null; topics?: string[] };
  const langs = langRes.ok ? ((await langRes.json()) as Record<string, number>) : {};
  const languages = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return Response.json({ description: info.description ?? null, topics: info.topics ?? [], languages });
}
