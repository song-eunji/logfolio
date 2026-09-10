import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProjectsProvider } from "@/components/project/ProjectsProvider";
import { ProjectBar } from "@/components/project/ProjectBar";
import { NavTabs } from "@/components/layout/NavTabs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProjectsProvider>
      <div className="min-h-full bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-5 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Logfolio
              </span>
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                BETA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
        <ProjectBar />
        <NavTabs />
        {children}
      </div>
    </ProjectsProvider>
  );
}
