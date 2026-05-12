"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { SegmentationOutput } from "@/lib/api/client";

const COLORS = [
  "bg-amber-50 dark:bg-amber-950/30 border-amber-200",
  "bg-sky-50 dark:bg-sky-950/30 border-sky-200",
  "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
  "bg-fuchsia-50 dark:bg-fuchsia-950/30 border-fuchsia-200",
  "bg-rose-50 dark:bg-rose-950/30 border-rose-200",
  "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200",
];

export function SegmentationView({
  content,
  segmentations,
}: {
  content: string;
  segmentations: SegmentationOutput[];
}) {
  const [selected, setSelected] = useState<string | null>(
    segmentations[0]?.id ?? null,
  );

  if (segmentations.length === 0) {
    return (
      <EmptyState
        title="No segmentations yet."
        description="Add one in the Manage annotations tab."
      />
    );
  }

  const seg = segmentations.find((s) => s.id === selected) ?? segmentations[0];
  // Sort segments by the start of their first line
  const segments = [...seg.segments].sort(
    (a, b) => (a.lines[0]?.start ?? 0) - (b.lines[0]?.start ?? 0),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Segmentation:</span>
        <Select
          value={seg.id}
          onValueChange={(v) => setSelected(v)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {segmentations.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.id} ({s.segments.length} segments)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {segments.length} segments shown
        </span>
      </div>

      <div className="rounded-md border bg-card p-2 max-h-[600px] overflow-y-auto space-y-2">
        {segments.map((s, idx) => {
          const color = COLORS[idx % COLORS.length];
          const text = s.lines
            .map((line) => content.slice(line.start, line.end))
            .join("\n");
          return (
            <div
              key={s.id}
              className={`rounded border ${color} p-3 flex gap-3`}
            >
              <div className="text-xs text-muted-foreground font-mono shrink-0 w-20">
                #{idx + 1}
                <Link
                  href={`/segments/${s.id}`}
                  className="block mt-1 text-[10px] truncate hover:underline"
                >
                  {s.id.slice(0, 8)}…
                </Link>
                <p className="mt-1 text-[10px]">
                  {s.lines.map((l) => `${l.start}–${l.end}`).join(", ")}
                </p>
              </div>
              <p className="whitespace-pre-wrap leading-loose flex-1 text-base">
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
