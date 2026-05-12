"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { useEditionContent } from "@/lib/api/hooks/editions";
import type { AlignmentOutput, Span } from "@/lib/api/client";

function unionGaps(spans: Span[], total: number): Span[] {
  if (spans.length === 0) return total > 0 ? [{ start: 0, end: total }] : [];
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) {
      last.end = Math.max(last.end, s.end);
    } else {
      merged.push({ start: s.start, end: s.end });
    }
  }
  const gaps: Span[] = [];
  let cursor = 0;
  for (const m of merged) {
    if (m.start > cursor) gaps.push({ start: cursor, end: m.start });
    cursor = Math.max(cursor, m.end);
  }
  if (cursor < total) gaps.push({ start: cursor, end: total });
  return gaps;
}

export function AlignmentView({
  sourceContent,
  alignments,
}: {
  sourceContent: string;
  alignments: AlignmentOutput[];
}) {
  const [selected, setSelected] = useState<string | null>(
    alignments[0]?.id ?? null,
  );

  if (alignments.length === 0) {
    return (
      <EmptyState
        title="No alignments."
        description="Alignments map segments in this edition to segments in another edition."
      />
    );
  }

  const align = alignments.find((a) => a.id === selected) ?? alignments[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Alignment:</span>
        <Select value={align.id} onValueChange={setSelected}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {alignments.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.id} → {a.target_edition_id.slice(0, 10)}…
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          Target:{" "}
          <Link
            href={`/editions/${align.target_edition_id}`}
            className="text-primary hover:underline font-mono"
          >
            {align.target_edition_id}
          </Link>
        </span>
      </div>

      <AlignmentPanes
        sourceContent={sourceContent}
        align={align}
      />
    </div>
  );
}

function AlignmentPanes({
  sourceContent,
  align,
}: {
  sourceContent: string;
  align: AlignmentOutput;
}) {
  const target = useEditionContent(align.target_edition_id, {});
  const targetContent =
    typeof target.data === "string"
      ? target.data
      : target.data == null
        ? ""
        : "";

  if (target.isLoading) {
    return (
      <div className="rounded-md border p-4">
        <Skeleton className="h-32 w-full" />
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading target edition
          content…
        </p>
      </div>
    );
  }
  if (target.isError) return <ErrorBlock error={target.error} />;

  const sourceCovered: Span[] = align.aligned_segments.flatMap((a) => a.lines);
  const targetCovered: Span[] = align.aligned_segments
    .flatMap((a) => a.target_indices)
    .flatMap((i) => align.target_segments[i]?.lines ?? []);

  const sourceGaps = unionGaps(sourceCovered, sourceContent.length);
  const targetGaps = unionGaps(targetCovered, targetContent.length);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>
          <Badge variant="outline">Source</Badge> this edition
        </div>
        <div>
          <Badge variant="outline">Target</Badge>{" "}
          {align.target_edition_id.slice(0, 12)}…
        </div>
      </div>

      <div className="rounded-md border bg-card divide-y">
        {align.aligned_segments.map((seg, idx) => {
          const sourceText = seg.lines
            .map((l) => sourceContent.slice(l.start, l.end))
            .join("\n");
          const targetSegments = seg.target_indices
            .map((i) => align.target_segments[i])
            .filter(Boolean);
          const targetText = targetSegments
            .flatMap((ts) =>
              ts.lines.map((l) => targetContent.slice(l.start, l.end)),
            )
            .join("\n");
          return (
            <div key={idx} className="grid grid-cols-2 gap-3 p-3">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground font-mono">
                  #{idx + 1} ·{" "}
                  {seg.lines.map((l) => `${l.start}–${l.end}`).join(", ")}
                </div>
                <p className="whitespace-pre-wrap leading-loose text-sm">
                  {sourceText || (
                    <span className="italic text-muted-foreground">(empty)</span>
                  )}
                </p>
              </div>
              <div className="space-y-1 border-l pl-3">
                <div className="text-[10px] text-muted-foreground font-mono">
                  → indices [{seg.target_indices.join(", ")}]
                </div>
                <p className="whitespace-pre-wrap leading-loose text-sm">
                  {targetText || (
                    <span className="italic text-muted-foreground">(empty)</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        {align.aligned_segments.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No aligned segments in this alignment.
          </p>
        )}
      </div>

      {(sourceGaps.length > 0 || targetGaps.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium mb-2">
              Unaligned source ({sourceGaps.length} blob
              {sourceGaps.length === 1 ? "" : "s"})
            </p>
            {sourceGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                All source content is aligned.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sourceGaps.map((g, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {g.start}–{g.end}
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                      {sourceContent.slice(g.start, g.end)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium mb-2">
              Unaligned target ({targetGaps.length} blob
              {targetGaps.length === 1 ? "" : "s"})
            </p>
            {targetGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                All target content is aligned.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {targetGaps.map((g, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {g.start}–{g.end}
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                      {targetContent.slice(g.start, g.end)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
