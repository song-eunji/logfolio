"use client";

import { useState } from "react";
import { Loader2, Redo2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DEFAULT_THEME, type SlideTheme } from "@/lib/slideLayout";

const THEME_PRESETS: { label: string; prompt: string }[] = [
  { label: "기본", prompt: "" },
  { label: "따뜻한 베이지", prompt: "베이지 톤의 따뜻한 잡지 느낌" },
  { label: "다크 터미널", prompt: "어두운 네온 개발자 터미널 느낌" },
  { label: "퍼플 카드", prompt: "보라색 카드형 대시보드 느낌" },
];

export function DesignPanel({
  blockSelected,
  fontSize,
  color,
  align,
  onStyleChange,
  theme,
  onApplyThemePrompt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddSlide,
  onDeleteSlide,
  onMoveSlide,
  canDeleteSlide,
  canMoveUp,
  canMoveDown,
  saveStatus,
}: {
  blockSelected: boolean;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  onStyleChange: (patch: { fontSize?: number; color?: string; align?: "left" | "center" | "right" }) => void;
  theme: SlideTheme;
  onApplyThemePrompt: (prompt: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddSlide: (title: string, brief: string) => Promise<void>;
  onDeleteSlide: () => void;
  onMoveSlide: (direction: "up" | "down") => void;
  canDeleteSlide: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  saveStatus: string;
}) {
  const [themePrompt, setThemePrompt] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [slideBrief, setSlideBrief] = useState("");
  const [addingSlide, setAddingSlide] = useState(false);

  async function handleAddSlide() {
    if (!slideBrief.trim()) return;
    setAddingSlide(true);
    await onAddSlide(slideTitle.trim() || "새로운 이야기", slideBrief.trim());
    setAddingSlide(false);
    setSlideTitle("");
    setSlideBrief("");
  }

  return (
    <div className="flex w-full flex-col gap-5 rounded-lg border border-border bg-card p-4 lg:w-72">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="size-8" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" disabled={!canRedo} onClick={onRedo}>
            <Redo2 className="size-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{saveStatus}</span>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-foreground">선택한 요소</p>
        {blockSelected ? (
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              글자 크기
              <input
                type="range"
                min={11}
                max={40}
                value={fontSize}
                onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
                className="w-32"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              색상
              <input
                type="color"
                value={color}
                onChange={(e) => onStyleChange({ color: e.target.value })}
                className="h-7 w-12 cursor-pointer rounded border border-input"
              />
            </label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => onStyleChange({ align: a })}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 text-xs",
                    align === a
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            슬라이드에서 제목이나 본문을 클릭하면 스타일을 바꿀 수 있어요.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-semibold text-foreground">테마</p>
        <div className="flex flex-wrap gap-1.5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onApplyThemePrompt(preset.prompt)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
              style={
                preset.prompt === "" && theme.background === DEFAULT_THEME.background
                  ? { borderColor: theme.accent, color: theme.accent }
                  : undefined
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={themePrompt}
            onChange={(e) => setThemePrompt(e.target.value)}
            placeholder="예) 어두운 느낌, 밝고 깔끔하게"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="h-8 shrink-0"
            onClick={() => {
              onApplyThemePrompt(themePrompt);
              setThemePrompt("");
            }}
          >
            적용
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-semibold text-foreground">슬라이드</p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={!canMoveUp}
            onClick={() => onMoveSlide("up")}
          >
            ← 앞으로
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={!canMoveDown}
            onClick={() => onMoveSlide("down")}
          >
            뒤로 →
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-destructive hover:text-destructive"
          disabled={!canDeleteSlide}
          onClick={onDeleteSlide}
        >
          <Trash2 className="size-3.5" />이 슬라이드 삭제
        </Button>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-semibold text-foreground">AI로 슬라이드 추가</p>
        <Input
          value={slideTitle}
          onChange={(e) => setSlideTitle(e.target.value)}
          placeholder="슬라이드 제목 (예: 배운 점)"
          className="h-8 text-xs"
        />
        <Textarea
          value={slideBrief}
          onChange={(e) => setSlideBrief(e.target.value)}
          placeholder="간단한 메모만 적으면 AI가 문단으로 풀어써요."
          rows={3}
          className="text-xs"
        />
        <Button
          size="sm"
          className="gap-1.5 self-end text-xs"
          disabled={addingSlide || !slideBrief.trim()}
          onClick={handleAddSlide}
        >
          {addingSlide ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          슬라이드 추가
        </Button>
      </section>
    </div>
  );
}
