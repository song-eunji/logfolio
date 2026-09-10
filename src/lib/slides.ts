export interface Slide {
  title: string;
  body: string;
}

/**
 * STAR/XYZ 마크다운을 헤딩(#, ##, ###) 단위로 잘라 슬라이드 배열로 만든다.
 * 발표 자료처럼 한 장씩 넘겨보는 뷰에 쓰인다.
 */
export function splitIntoSlides(markdown: string): Slide[] {
  const lines = markdown.split("\n");
  const slides: Slide[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  function flush() {
    if (currentTitle || currentBody.some((l) => l.trim())) {
      slides.push({ title: currentTitle, body: currentBody.join("\n").trim() });
    }
  }

  for (const line of lines) {
    const heading = /^#{1,3}\s+(.*)/.exec(line);
    if (heading) {
      flush();
      currentTitle = heading[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  return slides.length > 0 ? slides : [{ title: "", body: markdown }];
}
