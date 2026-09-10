"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) return { error: error.message };
  return { error: null };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  name: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  });
  if (error) return { error: error.message, sessionCreated: false };
  // "Confirm email"이 꺼져 있으면 signUp이 바로 세션을 만든다.
  return { error: null, sessionCreated: !!data.session };
}
