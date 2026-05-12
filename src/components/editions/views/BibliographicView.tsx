"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { BibliographicMetadataOutput } from "@/lib/api/client";

const TYPE_COLOR: Record<string, string> = {
  title: "bg-sky-200/60 dark:bg-sky-900/60 ring-sky-400",
  alt_title: "bg-sky-100/60 dark:bg-sky-900/40 ring-sky-300",
  author: "bg-emerald-200/60 dark:bg-emerald-900/60 ring-emerald-400",
  person: "bg-emerald-100/60 dark:bg-emerald-900/40 ring-emerald-300",
  colophon: "bg-amber-200/60 dark:bg-amber-900/60 ring-amber-400",
  incipit: "bg-fuchsia-200/60 dark:bg-fuchsia-900/60 ring-fuchsia-400",
  alt_incipit: "bg-fuchsia-100/60 dark:bg-fuchsia-900/40 ring-fuchsia-300",
};

export function BibliographicView({
  content,
  items,
}: {
  content: string;
  items: BibliographicMetadataOutput[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No bibliographic annotations."
        description="These mark spans of content as titles, authors, colophons, etc."
      />
    );
  }

  // Sort by span start, build segments: parts of content not annotated, parts annotated.
  const sorted = [...items].sort((a, b) => a.span.start - b.span.start);
  type Piece = { start: number; end: number; type?: string; id?: string };
  const pieces: Piece[] = [];
  let cursor = 0;
  for (const item of sorted) {
    const { start, end } = item.span;
    if (start > cursor) pieces.push({ start: cursor, end: start });
    pieces.push({ start, end, type: item.type, id: item.id });
    cursor = Math.max(cursor, end);
  }
  if (cursor < content.length)
    pieces.push({ start: cursor, end: content.length });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-muted-foreground">Legend:</span>
        {Object.keys(TYPE_COLOR).map((t) => (
          <Badge
            key={t}
            variant="outline"
            className={`${TYPE_COLOR[t]} ring-1 border-0`}
          >
            {t}
          </Badge>
        ))}
      </div>
      <div className="rounded-md border bg-card p-4 max-h-[600px] overflow-y-auto">
        <p className="whitespace-pre-wrap leading-loose text-base">
          {pieces.map((p, i) => {
            const slice = content.slice(p.start, p.end);
            if (!p.type) return <span key={i}>{slice}</span>;
            return (
              <span
                key={i}
                className={`${TYPE_COLOR[p.type] ?? "bg-muted ring-muted-foreground"} ring-1 rounded px-0.5`}
                title={`${p.type} · ${p.id}`}
              >
                {slice}
              </span>
            );
          })}
        </p>
      </div>
      <div className="rounded-md border">
        <p className="text-xs px-3 py-2 border-b font-medium">
          Bibliographic entries ({items.length})
        </p>
        <ul className="divide-y text-sm">
          {sorted.map((it) => (
            <li key={it.id} className="px-3 py-2 flex items-center gap-3">
              <Badge
                variant="outline"
                className={`${TYPE_COLOR[it.type] ?? ""} ring-1 border-0 shrink-0`}
              >
                {it.type}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {it.span.start}–{it.span.end}
              </span>
              <span className="truncate flex-1">
                {content.slice(it.span.start, it.span.end)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
