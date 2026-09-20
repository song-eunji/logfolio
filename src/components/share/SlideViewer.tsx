"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { classifySlideKind, splitIntoSlides } from "@/lib/slides";
import { KIND_STYLE } from "@/lib/slideKindStyle";
import { resolveEditableSlides, DEFAULT_THEME, CANVAS_WIDTH, type PortfolioLayout } from "@/lib/slideLayout";
import { SlideCanvas } from "@/components/portfolio/editor/SlideCanvas";

export function SlideViewer({
  content,
  layout,
  heading,
}: {
  content: string;
  layout?: PortfolioLayout | null;
  heading: string;
}) {
  const [index, setIndex] = useState(0);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const markdownSlides = useMemo(() => splitIntoSlides(content), [content]);
  const slides = useMemo(
    () => resolveEditableSlides(markdownSlides, layout),
    [markdownSlides, layout]
  );
  const canvasMode = !!layout;
  const slide = slides[Math.min(index, slides.length - 1)];
  const kind = canvasMode ? slide.kind : classifySlideKind({ title: slide.title, body: slide.body, level: 2 });
  const style = KIND_STYLE[kind];
  const Icon = style.icon;

  // 편집한 슬라이드(고정 폭 캔버스)를 화면 폭에 맞춰 줄여서 보여준다 (모바일 대응)
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / CANVAS_WIDTH)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasMode]);

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

      {canvasMode ? (
        <div ref={canvasWrapRef} className="w-full overflow-hidden rounded-lg">
          <div style={{ zoom: scale }}>
          <SlideCanvas
            slide={slide}
            layout={layout!}
            theme={layout!.theme ?? DEFAULT_THEME}
            editable={false}
            selectedBlock={null}
            onSelectBlock={() => {}}
            onDragStart={() => {}}
            onBlockCommit={() => {}}
            onTextCommit={() => {}}
          />
          </div>
        </div>
      ) : (
        <div className="min-h-[420px] overflow-hidden rounded-lg border border-border bg-card">
          <div className={cn("h-1.5 w-full", style.bg)} />

          {kind === "hero" ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 px-8 py-16 text-center">
              <div className={cn("flex size-12 items-center justify-center rounded-full", style.soft)}>
                <Sparkles className={cn("size-6", style.text)} />
              </div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {slide.title}
              </h2>
              <p className="text-sm text-muted-foreground">AI가 기록을 바탕으로 재구성한 포트폴리오</p>
            </div>
          ) : (
            <div className="p-8 sm:p-12">
              {slide.title && (
                <div className="mb-5 flex items-center gap-2">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", style.soft)}>
                    <Icon className={cn("size-4", style.text)} />
                  </span>
                  <div>
                    {style.label && (
                      <p className={cn("text-[11px] font-semibold uppercase tracking-wide", style.text)}>
                        {style.label}
                      </p>
                    )}
                    <h2 className="text-lg font-bold text-foreground sm:text-xl">{slide.title}</h2>
                  </div>
                </div>
              )}
              <article className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-h3:text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body}</ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      )}

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
