import { classifySlideKind, type Slide, type SlideKind } from "@/lib/slides";

export type BlockKey = "title" | "body";

export interface SlideBlockOverride {
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
}

export interface SlideTheme {
  background: string;
  section: string;
  accent: string;
  text: string;
  font: "sans" | "serif" | "mono";
}

export interface CustomSlideData {
  title: string;
  body: string;
}

export interface PortfolioLayout {
  version: 1;
  theme?: SlideTheme;
  slideOrder?: string[];
  deletedSlideIds?: string[];
  customSlides?: Record<string, CustomSlideData>;
  blocks?: Record<string, SlideBlockOverride>;
}

export interface EditableSlide {
  id: string;
  title: string;
  body: string;
  isCustom: boolean;
  kind: SlideKind;
}

export const DEFAULT_THEME: SlideTheme = {
  background: "#FFFFFF",
  section: "#F5F7FB",
  accent: "#0066FF",
  text: "#171719",
  font: "sans",
};

const THEME_PRESETS: { pattern: RegExp; theme: SlideTheme }[] = [
  {
    pattern: /베이지|따뜻|잡지|종이|브라운/,
    theme: { background: "#F2EFE9", section: "#E8E0D5", accent: "#A65E3B", text: "#302A26", font: "serif" },
  },
  {
    pattern: /네온|사이버|개발자|터미널|다크|어두운|검정|블랙/,
    theme: { background: "#0D0E16", section: "#151323", accent: "#00FFC4", text: "#F7F5FF", font: "mono" },
  },
  {
    pattern: /카드|대시보드|그리드|보라|퍼플/,
    theme: { background: "#E8EAF0", section: "#FFFFFF", accent: "#5B55E8", text: "#20222B", font: "sans" },
  },
  {
    pattern: /밝|깔끔|미니멀|화이트|하얀/,
    theme: { background: "#FFFFFF", section: "#F5F7FB", accent: "#0066FF", text: "#171719", font: "sans" },
  },
];

export function inferTheme(prompt: string): SlideTheme {
  const found = THEME_PRESETS.find((p) => p.pattern.test(prompt));
  return found ? found.theme : DEFAULT_THEME;
}

export function themeFontFamily(font: SlideTheme["font"]) {
  if (font === "serif") return "Georgia, 'Noto Serif KR', serif";
  if (font === "mono") return "'Courier New', monospace";
  return "'Pretendard', -apple-system, sans-serif";
}

export function emptyLayout(): PortfolioLayout {
  return { version: 1 };
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 520;

export const DEFAULT_BLOCK_GEOMETRY: Record<
  BlockKey,
  { x: number; y: number; width: number; height: number }
> = {
  title: { x: 40, y: 56, width: 720, height: 72 },
  body: { x: 40, y: 150, width: 720, height: 330 },
};

export function blockId(slideId: string, key: BlockKey) {
  return `${slideId}__${key}`;
}

/**
 * 원본 마크다운에서 잘라낸 슬라이드(splitIntoSlides)와 저장된 레이아웃(순서/삭제/커스텀 슬라이드)을
 * 합쳐 편집기·뷰어가 함께 쓰는 "현재 보여줄 슬라이드 목록"을 만든다.
 */
export function resolveEditableSlides(
  markdownSlides: Slide[],
  layout: PortfolioLayout | null | undefined
): EditableSlide[] {
  const deleted = new Set(layout?.deletedSlideIds ?? []);

  const originals: EditableSlide[] = markdownSlides
    .map((s, i) => ({
      id: `orig-${i}`,
      title: s.title,
      body: s.body,
      isCustom: false,
      kind: classifySlideKind(s),
    }))
    .filter((s) => !deleted.has(s.id));

  const customEntries: EditableSlide[] = Object.entries(layout?.customSlides ?? {}).map(
    ([id, data]) => ({
      id,
      title: data.title,
      body: data.body,
      isCustom: true,
      kind: "generic" as SlideKind,
    })
  );

  const all = [...originals, ...customEntries];
  const byId = new Map(all.map((s) => [s.id, s]));

  const order = (layout?.slideOrder ?? []).filter((id) => byId.has(id));
  const remaining = all.filter((s) => !order.includes(s.id)).map((s) => s.id);
  const orderedIds = [...order, ...remaining];

  return orderedIds.map((id) => byId.get(id)!);
}

export function getBlockGeometry(
  layout: PortfolioLayout | null | undefined,
  slideId: string,
  key: BlockKey
) {
  const override = layout?.blocks?.[blockId(slideId, key)];
  const base = DEFAULT_BLOCK_GEOMETRY[key];
  return {
    x: override?.x ?? base.x,
    y: override?.y ?? base.y,
    width: override?.width ?? base.width,
    height: override?.height ?? base.height,
    fontSize: override?.fontSize,
    color: override?.color,
    align: override?.align ?? "left",
  };
}

export function getBlockText(
  layout: PortfolioLayout | null | undefined,
  slideId: string,
  key: BlockKey,
  fallback: string
) {
  return layout?.blocks?.[blockId(slideId, key)]?.text ?? fallback;
}
