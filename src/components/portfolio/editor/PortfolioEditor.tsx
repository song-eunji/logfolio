"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { splitIntoSlides } from "@/lib/slides";
import {
  DEFAULT_THEME,
  blockId,
  emptyLayout,
  getBlockGeometry,
  inferTheme,
  resolveEditableSlides,
  type BlockKey,
  type PortfolioLayout,
  type SlideBlockOverride,
} from "@/lib/slideLayout";
import { SlideCanvas } from "@/components/portfolio/editor/SlideCanvas";
import { DesignPanel } from "@/components/portfolio/editor/DesignPanel";
import type { Portfolio } from "@/lib/types";

const HISTORY_LIMIT = 20;

export function PortfolioEditor({
  portfolio,
  onSaveLayout,
}: {
  portfolio: Portfolio;
  onSaveLayout: (layout: PortfolioLayout) => void;
}) {
  const router = useRouter();
  const markdownSlides = useMemo(() => splitIntoSlides(portfolio.content), [portfolio.content]);

  const [layout, setLayout] = useState<PortfolioLayout>(portfolio.layout ?? emptyLayout());
  const [history, setHistory] = useState<PortfolioLayout[]>([]);
  const [future, setFuture] = useState<PortfolioLayout[]>([]);

  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<BlockKey | null>(null);
  const [saveStatus, setSaveStatus] = useState("저장됨");

  const slides = useMemo(() => resolveEditableSlides(markdownSlides, layout), [markdownSlides, layout]);
  const clampedIndex = Math.min(slideIndex, Math.max(slides.length - 1, 0));
  const activeSlide = slides[clampedIndex];
  const theme = layout.theme ?? DEFAULT_THEME;

  function checkpoint() {
    setHistory((h) => [...h, layout].slice(-HISTORY_LIMIT));
    setFuture([]);
  }

  function commit(next: PortfolioLayout) {
    setLayout(next);
    setSaveStatus("저장 중...");
    onSaveLayout(next);
    setTimeout(() => setSaveStatus("저장됨"), 800);
  }

  function undo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [...f, layout].slice(-HISTORY_LIMIT));
    commit(prev);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setHistory((h) => [...h, layout].slice(-HISTORY_LIMIT));
    commit(next);
  }

  function handleBlockCommit(key: BlockKey, patch: Partial<SlideBlockOverride>) {
    const id = blockId(activeSlide.id, key);
    const next: PortfolioLayout = {
      ...layout,
      blocks: { ...layout.blocks, [id]: { ...layout.blocks?.[id], ...patch } },
    };
    commit(next);
  }

  function handleTextCommit(key: BlockKey, text: string) {
    checkpoint();
    handleBlockCommit(key, { text });
  }

  function handleStyleChange(patch: Partial<SlideBlockOverride>) {
    if (!selectedBlock) return;
    checkpoint();
    handleBlockCommit(selectedBlock, patch);
  }

  function applyThemePrompt(prompt: string) {
    checkpoint();
    commit({ ...layout, theme: prompt.trim() ? inferTheme(prompt) : DEFAULT_THEME });
  }

  function materializedOrder(): string[] {
    return layout.slideOrder?.length === slides.length
      ? layout.slideOrder
      : slides.map((s) => s.id);
  }

  function moveSlide(direction: "up" | "down") {
    const order = materializedOrder();
    const from = order.indexOf(activeSlide.id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= order.length) return;
    checkpoint();
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    commit({ ...layout, slideOrder: next });
    setSlideIndex(to);
  }

  function deleteActiveSlide() {
    if (slides.length <= 1) return;
    checkpoint();
    const order = materializedOrder().filter((id) => id !== activeSlide.id);
    if (activeSlide.isCustom) {
      const customSlides = { ...layout.customSlides };
      delete customSlides[activeSlide.id];
      commit({ ...layout, slideOrder: order, customSlides });
    } else {
      commit({
        ...layout,
        slideOrder: order,
        deletedSlideIds: [...(layout.deletedSlideIds ?? []), activeSlide.id],
      });
    }
    setSlideIndex((i) => Math.max(0, Math.min(i, order.length - 2)));
    setSelectedBlock(null);
  }

  async function addSlide(title: string, brief: string) {
    try {
      const res = await fetch("/api/portfolio/add-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, brief, existingMarkdown: portfolio.content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "슬라이드 생성에 실패했습니다.");
        return;
      }
      checkpoint();
      const id = `custom-${crypto.randomUUID()}`;
      const order = [...materializedOrder()];
      order.splice(clampedIndex + 1, 0, id);
      commit({
        ...layout,
        slideOrder: order,
        customSlides: { ...layout.customSlides, [id]: { title, body: data.body } },
      });
      setSlideIndex(clampedIndex + 1);
      toast.success("AI 슬라이드를 추가했어요.");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  }

  const geometry = selectedBlock ? getBlockGeometry(layout, activeSlide.id, selectedBlock) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/library")}>
          <ArrowLeft className="size-4" />
          보관함으로
        </Button>
        <p className="text-sm font-medium text-foreground">{portfolio.projectName}</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col items-center gap-3">
          <div className="overflow-x-auto">
            <SlideCanvas
              slide={activeSlide}
              layout={layout}
              theme={theme}
              editable
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              onDragStart={checkpoint}
              onBlockCommit={handleBlockCommit}
              onTextCommit={handleTextCommit}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={clampedIndex === 0}
              onClick={() => {
                setSlideIndex((i) => Math.max(0, i - 1));
                setSelectedBlock(null);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSlideIndex(i);
                    setSelectedBlock(null);
                  }}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    i === clampedIndex ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  aria-label={`${i + 1}번 슬라이드`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={clampedIndex === slides.length - 1}
              onClick={() => {
                setSlideIndex((i) => Math.min(slides.length - 1, i + 1));
                setSelectedBlock(null);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            요소를 클릭해 선택 · 드래그로 이동 · 더블클릭으로 텍스트 편집 · 모서리 핸들로 크기 조절
          </p>
        </div>

        <DesignPanel
          blockSelected={!!selectedBlock}
          fontSize={geometry?.fontSize ?? (selectedBlock === "title" ? 22 : 15)}
          color={geometry?.color ?? theme.text}
          align={geometry?.align ?? "left"}
          onStyleChange={handleStyleChange}
          theme={theme}
          onApplyThemePrompt={applyThemePrompt}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onAddSlide={addSlide}
          onDeleteSlide={deleteActiveSlide}
          onMoveSlide={moveSlide}
          canDeleteSlide={slides.length > 1}
          canMoveUp={clampedIndex > 0}
          canMoveDown={clampedIndex < slides.length - 1}
          saveStatus={saveStatus}
        />
      </div>
    </div>
  );
}
