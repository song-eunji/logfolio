import { CalendarDays, Sparkles, Share2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: CalendarDays,
    title: "매일 3줄 기록",
    desc: "오늘 한 일을 짧게 남기기만 하면 끝",
  },
  {
    icon: Sparkles,
    title: "AI가 기록을 근거로 재구성",
    desc: "STAR 형식으로 정리, 기록에 없는 내용은 쓰지 않아요",
  },
  {
    icon: Share2,
    title: "이력서·자소서·공유까지",
    desc: "직무에 맞춰 바로 활용",
  },
];

export function ServiceIntro() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-foreground">
          기억이 아니라, 매일 3줄 기록으로 쓰는 포트폴리오·이력서·자소서
        </h2>
        <p className="text-sm text-muted-foreground">
          지원할 때 기억을 쥐어짜지 마세요. AI는 내가 쌓은 기록에 있는 것만 씁니다.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {i + 1}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <step.icon className="size-3.5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          이렇게 바뀌어요
        </p>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-foreground">
          기록: &quot;API 응답 속도 개선을 위해 캐싱 로직 추가&quot;
        </p>
        <div className="my-1.5 flex justify-center">
          <ArrowRight className="size-3.5 text-muted-foreground" />
        </div>
        <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-foreground">
          AI 생성: &quot;캐싱 전략을 도입함으로써 API 응답 속도를 개선했습니다&quot;
        </p>
      </div>
    </div>
  );
}
