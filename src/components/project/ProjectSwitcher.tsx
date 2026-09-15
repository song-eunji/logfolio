"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

export function ProjectSwitcher({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
}: {
  projects: Project[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<Project | null>;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    const project = await onCreate(newName.trim());
    if (project) {
      setNewName("");
      setCreating(false);
    }
  }

  if (creating) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 프로젝트 이름"
          className="h-8 w-40"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") setCreating(false);
          }}
        />
        <Button size="icon" className="size-8" onClick={handleCreate}>
          <Check className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => setCreating(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={activeProjectId ?? ""} onValueChange={(v) => v && onSelect(v)}>
        <SelectTrigger className="h-9 w-52 font-medium">
          <SelectValue placeholder="프로젝트 선택">
            {(value: string | null) =>
              projects.find((p) => p.id === value)?.name ?? "프로젝트 선택"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="outline"
        className="size-8"
        onClick={() => setCreating(true)}
        aria-label="새 프로젝트"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
