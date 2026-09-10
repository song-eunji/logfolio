"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Profile } from "@/hooks/use-profile";

const YEAR_OPTIONS = [
  "대학생 1학년",
  "대학생 2학년",
  "대학생 3학년",
  "대학생 4학년",
  "졸업예정",
  "졸업생",
  "재직중",
];

export function ProfileSettings({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (input: { job: string; year: string }) => Promise<boolean>;
}) {
  const [job, setJob] = useState(profile.job ?? "");
  const [year, setYear] = useState(profile.year ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // profile은 마운트 후 비동기로 로드되므로, 로드가 끝나면 편집 폼 값을 그 값으로 맞춘다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJob(profile.job ?? "");
    setYear(profile.year ?? "");
  }, [profile.job, profile.year]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave({ job: job.trim(), year });
    setSaving(false);
    if (ok) {
      toast.success("내 정보가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  const isComplete = !!profile.job && !!profile.year;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <UserRound className="size-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">내 정보</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        희망 직무와 현재 상태를 입력하면, 이력서를 만들 때 그 직무에 맞는 포인트를 더 강조해서 정리해드려요.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job">희망 직무</Label>
          <Input
            id="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="예: 백엔드 개발자"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="year">학년 / 상태</Label>
          <Select value={year} onValueChange={(v) => setYear(v ?? "")}>
            <SelectTrigger id="year" className="w-full">
              <SelectValue placeholder="선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !job.trim() || !year}
        size="sm"
        className="self-end gap-1.5"
      >
        {saving ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Save className="size-3.5" />
        )}
        저장
      </Button>

      {!isComplete && (
        <p className="text-xs text-muted-foreground">
          아직 입력 전이에요. 입력 없이도 이력서 생성은 되지만, 직무 맞춤 강조는 적용되지 않습니다.
        </p>
      )}
    </div>
  );
}
