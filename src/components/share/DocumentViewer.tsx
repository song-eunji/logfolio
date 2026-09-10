"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentViewer({
  heading,
  subheading,
  content,
}: {
  heading: string;
  subheading?: string;
  content: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <p className="text-sm font-medium text-foreground">{heading}</p>
          {subheading && (
            <p className="text-xs text-muted-foreground">{subheading}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => window.print()}
        >
          <Printer className="size-3.5" />
          PDF로 내보내기
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 sm:p-12">
        <article className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground whitespace-pre-wrap">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
