"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  job: string | null;
  year: string | null;
}

export function useProfile() {
  const supabase = useRef(createClient()).current;
  const [profile, setProfile] = useState<Profile>({ job: null, year: null });
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;

      const { data } = await supabase
        .from("profiles")
        .select("job, year")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setProfile({ job: data?.job ?? null, year: data?.year ?? null });
      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = useCallback(
    async (input: { job: string; year: string }) => {
      if (!userIdRef.current) return false;
      const { error } = await supabase
        .from("profiles")
        .update({ job: input.job, year: input.year })
        .eq("id", userIdRef.current);
      if (error) {
        console.error("[use-profile] updateProfile failed", error);
        return false;
      }
      setProfile({ job: input.job, year: input.year });
      return true;
    },
    [supabase]
  );

  return { profile, loaded, updateProfile };
}
