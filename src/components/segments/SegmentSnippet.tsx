"use client";

import { useSegmentContent } from "@/lib/api/hooks/segments";

export function SegmentSnippet({ id, max = 240 }: { id: string; max?: number }) {
  const { data, isLoading } = useSegmentContent(id);
  if (isLoading)
    return (
      <p className="text-xs text-muted-foreground italic">Loading content…</p>
    );
  const str =
    typeof data === "string"
      ? data
      : data == null
        ? ""
        : JSON.stringify(data);
  if (!str) return <p className="text-xs text-muted-foreground italic">No content.</p>;
  const truncated = str.length > max ? str.slice(0, max) + "…" : str;
  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">{truncated}</p>
  );
}
