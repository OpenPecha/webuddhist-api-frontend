"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { PaginationOutput } from "@/lib/api/client";

export function PaginationView({
  content,
  paginations,
}: {
  content: string;
  paginations: PaginationOutput[];
}) {
  const [selected, setSelected] = useState<string | null>(
    paginations[0]?.id ?? null,
  );

  if (paginations.length === 0) {
    return (
      <EmptyState
        title="No pagination yet."
        description="Pagination annotations split the content into pages (and volumes)."
      />
    );
  }

  const pag = paginations.find((p) => p.id === selected) ?? paginations[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Pagination:</span>
        <Select value={pag.id} onValueChange={setSelected}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paginations.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.id} ({p.volumes.length} volume(s))
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card p-3 max-h-[600px] overflow-y-auto space-y-4">
        {pag.volumes.map((vol, vi) => (
          <div key={vi} className="space-y-3">
            {pag.volumes.length > 1 && (
              <div className="sticky top-0 bg-muted/80 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                Volume {vol.index ?? vi + 1}
              </div>
            )}
            {vol.pages.map((page, pi) => {
              const text = page.lines
                .map((l) => content.slice(l.start, l.end))
                .join("\n");
              return (
                <div key={pi} className="rounded border p-3">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Page {page.reference}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {page.lines
                        .map((l) => `${l.start}–${l.end}`)
                        .join(", ")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-loose text-base">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
