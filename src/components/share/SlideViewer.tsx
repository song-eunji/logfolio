"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Slide } from "@/lib/slides";

export function SlideViewer({
  slides,
  heading,
}: {
  slides: Slide[];
  heading: string;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slides.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">{heading}</p>
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

      <div className="min-h-[420px] rounded-lg border border-border bg-card p-8 sm:p-12">
        <article className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
          {slide.title && <h2 className="mt-0">{slide.title}</h2>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body}</ReactMarkdown>
        </article>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        >
          <ChevronLeft className="size-4" />
          이전
        </Button>

        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}번 슬라이드로 이동`}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === index ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={index === slides.length - 1}
          onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
        >
          다음
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
