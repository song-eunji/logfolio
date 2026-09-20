"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { KIND_STYLE } from "@/lib/slideKindStyle";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  getBlockGeometry,
  getBlockText,
  themeFontFamily,
  type BlockKey,
  type EditableSlide,
  type PortfolioLayout,
  type SlideBlockOverride,
  type SlideTheme,
} from "@/lib/slideLayout";

interface BlockViewProps {
  slide: EditableSlide;
  blockKey: BlockKey;
  layout: PortfolioLayout;
  theme: SlideTheme;
  editable: boolean;
  selected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onCommit: (patch: Partial<SlideBlockOverride>) => void;
  onTextCommit: (text: string) => void;
}

function BlockView({
  slide,
  blockKey,
  layout,
  theme,
  editable,
  selected,
  onSelect,
  onDragStart,
  onCommit,
  onTextCommit,
}: BlockViewProps) {
  const geometry = getBlockGeometry(layout, slide.id, blockKey);
  const fallback = blockKey === "title" ? slide.title : slide.body;
  const text = getBlockText(layout, slide.id, blockKey, fallback);

  const [pos, setPos] = useState({
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  });
  useEffect(() => {
    // 슬라이드 전환/외부 레이아웃 변경 시 드래그 중이던 로컬 위치를 최신 값으로 재동기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height });
  }, [slide.id, geometry.x, geometry.y, geometry.width, geometry.height]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(text);
  }, [text, slide.id]);

  function handleDragPointerDown(e: React.PointerEvent) {
    if (!editable) return;
    e.stopPropagation();
    onSelect();
    onDragStart();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = pos.x;
    const baseY = pos.y;
    let latest = { x: baseX, y: baseY };
    const move = (ev: PointerEvent) => {
      const nx = Math.max(0, Math.min(CANVAS_WIDTH - pos.width, baseX + ev.clientX - startX));
      const ny = Math.max(0, Math.min(CANVAS_HEIGHT - 24, baseY + ev.clientY - startY));
      latest = { x: nx, y: ny };
      setPos((p) => ({ ...p, x: nx, y: ny }));
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      onCommit({ x: latest.x, y: latest.y });
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up, { once: true });
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    if (!editable) return;
    e.stopPropagation();
    onDragStart();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = pos.width;
    const startH = pos.height;
    let latest = { width: startW, height: startH };
    const move = (ev: PointerEvent) => {
      const nw = Math.max(120, Math.min(CANVAS_WIDTH - pos.x, startW + ev.clientX - startX));
      const nh = Math.max(40, Math.min(CANVAS_HEIGHT - pos.y, startH + ev.clientY - startY));
      latest = { width: nw, height: nh };
      setPos((p) => ({ ...p, width: nw, height: nh }));
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      onCommit({ width: latest.width, height: latest.height });
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up, { once: true });
  }

  const style: React.CSSProperties = {
    position: "absolute",
    left: pos.x,
    top: pos.y,
    width: pos.width,
    minHeight: pos.height,
    fontSize: geometry.fontSize ?? (blockKey === "title" ? 22 : 15),
    color: geometry.color ?? theme.text,
    textAlign: geometry.align,
  };

  return (
    <div
      data-block={blockKey}
      style={style}
      className={cn(
        "rounded-md p-1.5 transition-shadow",
        editable && "cursor-move",
        editable && selected && "outline outline-2 outline-offset-2 outline-primary"
      )}
      onPointerDown={handleDragPointerDown}
      onClick={(e) => {
        if (!editable) return;
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        if (!editable) return;
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {editing ? (
        blockKey === "title" ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              onTextCommit(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full bg-transparent font-bold outline-none"
            style={{ fontSize: "inherit", color: "inherit", textAlign: "inherit" }}
          />
        ) : (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              onTextCommit(draft);
            }}
            className="h-full w-full resize-none bg-transparent outline-none"
            style={{ fontSize: "inherit", color: "inherit", textAlign: "inherit" }}
          />
        )
      ) : blockKey === "title" ? (
        text || editable ? (
          <h2 className="font-bold" style={{ fontSize: "inherit" }}>
            {text || "제목 없음"}
          </h2>
        ) : null
      ) : text || editable ? (
        <div
          className="[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:font-bold"
          style={{ fontSize: "inherit" }}
        >
          {text ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <p className="opacity-50">내용을 입력하세요</p>
          )}
        </div>
      ) : null}

      {editable && selected && !editing && (
        <span
          onPointerDown={handleResizePointerDown}
          className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-se-resize rounded-full border-2 border-white bg-primary shadow"
        />
      )}
    </div>
  );
}

export function SlideCanvas({
  slide,
  layout,
  theme,
  editable,
  selectedBlock,
  onSelectBlock,
  onDragStart,
  onBlockCommit,
  onTextCommit,
}: {
  slide: EditableSlide;
  layout: PortfolioLayout;
  theme: SlideTheme;
  editable: boolean;
  selectedBlock: BlockKey | null;
  onSelectBlock: (key: BlockKey | null) => void;
  onDragStart: () => void;
  onBlockCommit: (key: BlockKey, patch: Partial<SlideBlockOverride>) => void;
  onTextCommit: (key: BlockKey, text: string) => void;
}) {
  const kindStyle = KIND_STYLE[slide.kind];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);

  // 본문이 길어도 잘리지 않도록, 블록의 실제 하단에 맞춰 캔버스 높이를 늘린다.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const blocks = Array.from(el.querySelectorAll<HTMLElement>("[data-block]"));
      const bottom = blocks.reduce((m, b) => Math.max(m, b.offsetTop + b.offsetHeight), 0);
      const next = Math.max(CANVAS_HEIGHT, Math.ceil(bottom + 28));
      setCanvasHeight((h) => (h === next ? h : next));
    };
    const ro = new ResizeObserver(measure);
    Array.from(el.querySelectorAll("[data-block]")).forEach((b) => ro.observe(b));
    measure();
    return () => ro.disconnect();
  }, [slide.id, layout]);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto overflow-hidden rounded-lg border border-border shadow-sm"
      style={{
        width: CANVAS_WIDTH,
        height: canvasHeight,
        background: theme.background,
        fontFamily: themeFontFamily(theme.font),
      }}
      onClick={() => editable && onSelectBlock(null)}
    >
      <div className="h-1.5 w-full" style={{ background: theme.accent }} />
      {slide.kind === "hero" ? (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-[11px] font-medium" style={{ color: theme.accent }}>
          ✦ Logfolio
        </div>
      ) : (
        kindStyle.label && (
          <div
            className="pointer-events-none absolute left-10 top-8 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: theme.accent }}
          >
            {kindStyle.label}
          </div>
        )
      )}
      <BlockView
        slide={slide}
        blockKey="title"
        layout={layout}
        theme={theme}
        editable={editable}
        selected={selectedBlock === "title"}
        onSelect={() => onSelectBlock("title")}
        onDragStart={onDragStart}
        onCommit={(patch) => onBlockCommit("title", patch)}
        onTextCommit={(text) => onTextCommit("title", text)}
      />
      <BlockView
        slide={slide}
        blockKey="body"
        layout={layout}
        theme={theme}
        editable={editable}
        selected={selectedBlock === "body"}
        onSelect={() => onSelectBlock("body")}
        onDragStart={onDragStart}
        onCommit={(patch) => onBlockCommit("body", patch)}
        onTextCommit={(text) => onTextCommit("body", text)}
      />
    </div>
  );
}
