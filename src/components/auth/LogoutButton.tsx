"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={() => signOut()}
    >
      <LogOut className="size-4" />
      로그아웃
    </Button>
  );
}
