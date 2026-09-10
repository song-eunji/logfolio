export type SlideKind = "hero" | "overview" | "activity" | "summary" | "generic";

export interface Slide {
  title: string;
  body: string;
  level: 1 | 2 | 3;
}

/**
 * STAR/XYZ 마크다운을 헤딩(#, ##, ###) 단위로 잘라 슬라이드 배열로 만든다.
 * 발표 자료처럼 한 장씩 넘겨보는 뷰에 쓰인다.
 */
export function splitIntoSlides(markdown: string): Slide[] {
  const lines = markdown.split("\n");
  const slides: Slide[] = [];
  let currentTitle = "";
  let currentLevel: 1 | 2 | 3 = 1;
  let currentBody: string[] = [];

  function flush() {
    if (currentTitle || currentBody.some((l) => l.trim())) {
      slides.push({
        title: currentTitle,
        body: currentBody.join("\n").trim(),
        level: currentLevel,
      });
    }
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.*)/.exec(line);
    if (heading) {
      flush();
      currentTitle = heading[2].trim();
      currentLevel = heading[1].length as 1 | 2 | 3;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  return slides.length > 0 ? slides : [{ title: "", body: markdown, level: 2 }];
}

/**
 * 슬라이드 제목/레벨로부터 종류를 추정해 아이콘·색상을 다르게 입히는 데 쓴다.
 */
export function classifySlideKind(slide: Slide): SlideKind {
  if (slide.level === 1) return "hero";
  if (slide.title.includes("개요")) return "overview";
  if (slide.title.includes("성과") || slide.title.includes("요약")) return "summary";
  if (slide.level === 3 || slide.title.includes("활동")) return "activity";
  return "generic";
}
