"use client";

import { use } from "react";
import { PortfolioEditor } from "@/components/portfolio/editor/PortfolioEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioEditor } from "@/hooks/use-portfolio-editor";

export default function PortfolioEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { portfolio, loaded, notFound, saveLayout } = usePortfolioEditor(id);

  if (!loaded) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[520px] w-full max-w-[800px] self-center rounded-lg" />
      </main>
    );
  }

  if (notFound || !portfolio || portfolio.kind !== "portfolio") {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          편집할 수 없는 항목이에요. 보관함에서 다시 시도해주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <PortfolioEditor portfolio={portfolio} onSaveLayout={saveLayout} />
    </main>
  );
}
