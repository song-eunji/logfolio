"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Sparkles as SparklesIcon, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "기록", icon: CalendarDays },
  { href: "/studio", label: "AI 스튜디오", icon: SparklesIcon },
  { href: "/library", label: "보관함", icon: Archive },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-5xl gap-1 px-4">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
