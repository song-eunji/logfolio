import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { splitIntoSlides } from "@/lib/slides";
import { SlideViewer } from "@/components/share/SlideViewer";
import { Sparkles } from "lucide-react";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("project_name, content, kind, is_public, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .eq("kind", "portfolio")
    .maybeSingle();

  if (!portfolio) {
    notFound();
  }

  const slides = splitIntoSlides(portfolio.content);

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Logfolio</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <SlideViewer slides={slides} heading={portfolio.project_name} />
      </main>
    </div>
  );
}
