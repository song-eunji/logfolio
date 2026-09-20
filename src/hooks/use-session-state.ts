"use client";

import { useCallback, useState } from "react";

const PREFIX = "logfolio:draft:";

// 저장 전 AI 생성 결과가 페이지 이동/새로고침으로 사라지지 않도록 탭(sessionStorage)에 임시 보관한다.
export function useSessionState<T>(key: string, initial: T) {
  const storageKey = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        if (next === null || next === undefined) window.sessionStorage.removeItem(storageKey);
        else window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // 저장 실패해도 화면 동작에는 지장 없음
      }
    },
    [storageKey]
  );

  return [value, set] as const;
}

export function clearSessionDrafts() {
  try {
    Object.keys(window.sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // 무시
  }
}
