import { FileText, Target, Trophy, Sparkles, type LucideIcon } from "lucide-react";
import type { SlideKind } from "@/lib/slides";

export const KIND_STYLE: Record<
  SlideKind,
  { icon: LucideIcon; label: string; text: string; bg: string; soft: string }
> = {
  hero: { icon: Sparkles, label: "", text: "text-primary", bg: "bg-primary", soft: "bg-primary/10" },
  overview: { icon: FileText, label: "개요", text: "text-blue-600", bg: "bg-blue-500", soft: "bg-blue-50" },
  activity: { icon: Target, label: "활동", text: "text-purple-600", bg: "bg-purple-500", soft: "bg-purple-50" },
  summary: { icon: Trophy, label: "핵심 성과", text: "text-amber-600", bg: "bg-amber-500", soft: "bg-amber-50" },
  generic: { icon: FileText, label: "", text: "text-muted-foreground", bg: "bg-muted-foreground", soft: "bg-muted" },
};
