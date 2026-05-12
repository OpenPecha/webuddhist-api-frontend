"use client";

import { useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { NoteOutput } from "@/lib/api/client";

export function DurchenView({
  content,
  notes,
}: {
  content: string;
  notes: NoteOutput[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No durchen notes."
        description="Durchen notes record variant readings at specific spans."
      />
    );
  }

  const sorted = [...notes].sort((a, b) => a.span.start - b.span.start);
  // Build inline view: original text with marker buttons at each span start.
  const pieces: Array<
    | { kind: "text"; text: string }
    | { kind: "marker"; note: NoteOutput; index: number }
    | { kind: "highlight"; note: NoteOutput; text: string; index: number }
  > = [];
  let cursor = 0;
  sorted.forEach((note, idx) => {
    const { start, end } = note.span;
    if (start > cursor)
      pieces.push({ kind: "text", text: content.slice(cursor, start) });
    pieces.push({
      kind: "highlight",
      note,
      text: content.slice(start, end),
      index: idx + 1,
    });
    cursor = Math.max(cursor, end);
  });
  if (cursor < content.length)
    pieces.push({ kind: "text", text: content.slice(cursor) });

  const activeNote = sorted.find((n) => n.id === activeId);

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-card p-4 max-h-[400px] overflow-y-auto">
        <p className="whitespace-pre-wrap leading-loose text-base">
          {pieces.map((p, i) =>
            p.kind === "text" ? (
              <span key={i}>{p.text}</span>
            ) : p.kind === "highlight" ? (
              <button
                key={i}
                type="button"
                onClick={() => setActiveId(p.note.id)}
                className={`bg-yellow-200/60 dark:bg-yellow-900/40 rounded px-0.5 hover:bg-yellow-300/70 ${activeId === p.note.id ? "ring-2 ring-yellow-500" : ""}`}
                title={`Note #${p.index} · ${p.note.span.start}–${p.note.span.end}`}
              >
                {p.text}
                <sup className="text-[9px] text-yellow-700 dark:text-yellow-300 ml-0.5">
                  {p.index}
                </sup>
              </button>
            ) : null,
          )}
        </p>
      </div>

      <div className="rounded-md border">
        <p className="text-xs px-3 py-2 border-b font-medium">
          Notes ({notes.length}) — click a highlight above to focus
        </p>
        <ul className="divide-y text-sm max-h-[300px] overflow-y-auto">
          {sorted.map((n, idx) => (
            <li
              key={n.id}
              className={`px-3 py-2 cursor-pointer ${activeId === n.id ? "bg-accent/50" : "hover:bg-muted/50"}`}
              onClick={() => setActiveId(n.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  #{idx + 1} · {n.span.start}–{n.span.end}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {n.id}
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Main:</span>{" "}
                {content.slice(n.span.start, n.span.end)}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium">Variant:</span> {n.text}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {activeNote && (
        <div className="rounded-md border bg-yellow-50 dark:bg-yellow-950/30 p-3 text-sm">
          <p className="font-medium mb-1">
            Note · {activeNote.span.start}–{activeNote.span.end}
          </p>
          <p>
            <span className="font-medium">Main:</span>{" "}
            {content.slice(activeNote.span.start, activeNote.span.end)}
          </p>
          <p>
            <span className="font-medium">Variant:</span> {activeNote.text}
          </p>
        </div>
      )}
    </div>
  );
}
