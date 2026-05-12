"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/tables/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { useTexts } from "@/lib/api/hooks/texts";
import { localizedSummary } from "@/lib/utils/localized-string";

const LIMIT = 25;

export default function TextsPage() {
  const [filters, setFilters] = useState({
    title: "",
    language: "",
    bdrc: "",
    wiki: "",
  });
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError, error, isFetching } = useTexts({
    title: filters.title || undefined,
    language: filters.language || undefined,
    bdrc: filters.bdrc || undefined,
    wiki: filters.wiki || undefined,
    limit: LIMIT,
    offset,
  });

  return (
    <div>
      <PageHeader
        title="Texts"
        description="Browse and manage all texts (Works) in the database."
        actions={
          <Button asChild>
            <Link href="/texts/new">
              <Plus className="h-4 w-4" /> New text
            </Link>
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border bg-card p-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Title contains…"
              value={filters.title}
              onChange={(e) => {
                setFilters({ ...filters, title: e.target.value });
                setOffset(0);
              }}
            />
          </div>
          <Input
            placeholder="Language code"
            value={filters.language}
            onChange={(e) => {
              setFilters({ ...filters, language: e.target.value });
              setOffset(0);
            }}
          />
          <Input
            placeholder="BDRC ID"
            value={filters.bdrc}
            onChange={(e) => {
              setFilters({ ...filters, bdrc: e.target.value });
              setOffset(0);
            }}
          />
          <Input
            placeholder="Wikidata ID"
            value={filters.wiki}
            onChange={(e) => {
              setFilters({ ...filters, wiki: e.target.value });
              setOffset(0);
            }}
          />
        </div>
      </div>

      {isError && <ErrorBlock error={error} />}

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Title
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Language
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Editions
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                BDRC
              </TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                ID
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              (data?.items ?? []).map((t) => (
                <TableRow
                  key={t.id}
                  className="border-b border-border/50 hover:bg-accent/30"
                >
                  <TableCell>
                    <Link
                      href={`/texts/${t.id}`}
                      className="font-medium decoration-primary/40 underline-offset-4 hover:underline"
                    >
                      {localizedSummary(t.title)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {t.language}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {t.editions?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.bdrc ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {t.id}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <EmptyState
          className="mt-4"
          title="No texts found."
          description="Adjust your filters or create one."
          action={
            <Button asChild>
              <Link href="/texts/new">Create text</Link>
            </Button>
          }
        />
      )}

      {data && (data.items.length > 0 || offset > 0) && (
        <Pagination
          offset={data.offset}
          limit={data.limit}
          hasMore={data.has_more}
          onChange={setOffset}
        />
      )}

      {isFetching && !isLoading && (
        <p className="mt-2 text-xs text-muted-foreground">Refreshing…</p>
      )}
    </div>
  );
}
