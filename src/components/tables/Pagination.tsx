"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  offset: number;
  limit: number;
  hasMore: boolean;
  onChange: (offset: number) => void;
  total?: number;
};

export function Pagination({ offset, limit, hasMore, onChange, total }: Props) {
  const page = Math.floor(offset / limit) + 1;
  const start = offset + 1;
  const end = offset + limit;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground">
        {total != null ? (
          <>
            Showing {start}–{Math.min(end, total)} of {total}
          </>
        ) : (
          <>
            Page {page} (offset {offset})
          </>
        )}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => onChange(offset + limit)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
