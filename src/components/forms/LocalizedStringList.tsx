"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalizedStringField } from "./LocalizedStringField";
import type { LocalizedString } from "@/lib/api/client";

type Props = {
  label?: string;
  value: LocalizedString[] | null | undefined;
  onChange: (v: LocalizedString[] | null) => void;
};

export function LocalizedStringList({ label, value, onChange }: Props) {
  const items = value ?? [];

  const update = (next: LocalizedString[]) =>
    onChange(next.length ? next : null);

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium">{label}</p>
      )}
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">None.</p>
      )}
      {items.map((entry, idx) => (
        <div
          key={idx}
          className="rounded-md border p-3 space-y-2 bg-muted/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">#{idx + 1}</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => update(items.filter((_, i) => i !== idx))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <LocalizedStringField
            value={entry}
            onChange={(v) => {
              const next = [...items];
              if (v === null) {
                next.splice(idx, 1);
              } else {
                next[idx] = v;
              }
              update(next);
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => update([...items, { en: "" }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Add entry
      </Button>
    </div>
  );
}
