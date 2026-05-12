"use client";

import Link from "next/link";
import { useText } from "@/lib/api/hooks/texts";
import { pickLocalized } from "@/lib/utils/localized-string";

export function RelatedTextLink({ id }: { id: string }) {
  const { data, isLoading } = useText(id);
  return (
    <Link
      href={`/texts/${id}`}
      className="flex items-center justify-between py-1 hover:underline"
    >
      <span className="truncate">
        {isLoading
          ? "Loading…"
          : data
            ? pickLocalized(data.title)
            : id}
      </span>
      <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">
        {data?.language ?? ""}
      </span>
    </Link>
  );
}
