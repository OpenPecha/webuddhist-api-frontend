"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { Pagination } from "@/components/tables/Pagination";
import { useEditionRelatedSegments } from "@/lib/api/hooks/editions";

const LIMIT = 20;

function parseIntOrUndef(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function RelatedSegmentsPanel({ editionId }: { editionId: string }) {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [active, setActive] = useState<{ start?: number; end?: number }>({});
  const [offset, setOffset] = useState(0);

  const ready = Object.keys(active).length > 0;
  const { data, isLoading, isFetching, isError, error } =
    useEditionRelatedSegments(
      ready ? editionId : undefined,
      active,
      { limit: LIMIT, offset },
    );

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <p className="text-sm font-medium">Find segments related to a span</p>
        <p className="text-xs text-muted-foreground">
          Optional: narrow to a span of the edition. Leave both blank for the
          whole edition.
        </p>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-xs">Start</Label>
            <Input
              type="number"
              min={0}
              placeholder="(any)"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-32 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">End</Label>
            <Input
              type="number"
              min={1}
              placeholder="(any)"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-32 mt-1"
            />
          </div>
          <Button
            onClick={() => {
              const s = parseIntOrUndef(start);
              const e = parseIntOrUndef(end);
              setActive({ start: s, end: e });
              setOffset(0);
            }}
            disabled={isFetching}
          >
            <Search className="h-4 w-4" /> Find
          </Button>
        </div>
      </div>

      {!ready && (
        <EmptyState
          title="Click Find to search."
          description="Returns segments from other editions that align to this edition's content. Leave Start/End blank to search the whole edition, or narrow to a span."
        />
      )}

      {isError && <ErrorBlock error={error} />}

      {ready && (
        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-3">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No related segments found.
            </div>
          ) : (
            <ul className="divide-y">
              {(data?.items ?? []).map((s) => (
                <li
                  key={s.id}
                  className="px-3 py-2 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/segments/${s.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {s.id}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.lines
                        .map((l) => `[${l.start},${l.end})`)
                        .join(" · ")}
                    </p>
                  </div>
                  <Link
                    href={`/editions/${s.edition_id}`}
                    className="text-xs text-muted-foreground hover:underline shrink-0"
                  >
                    in edition →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {ready && data && (data.items.length > 0 || offset > 0) && (
        <Pagination
          offset={data.offset}
          limit={data.limit}
          hasMore={data.has_more}
          onChange={setOffset}
        />
      )}
    </div>
  );
}
