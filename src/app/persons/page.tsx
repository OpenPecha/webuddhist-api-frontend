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
import { usePersons } from "@/lib/api/hooks/persons";
import { localizedSummary } from "@/lib/utils/localized-string";

const LIMIT = 25;

export default function PersonsPage() {
  const [filters, setFilters] = useState({ name: "", bdrc: "", wiki: "" });
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, error } = usePersons({
    name: filters.name || undefined,
    bdrc: filters.bdrc || undefined,
    wiki: filters.wiki || undefined,
    limit: LIMIT,
    offset,
  });

  return (
    <div>
      <PageHeader
        title="Persons"
        description="Browse and manage contributors."
        actions={
          <Button asChild>
            <Link href="/persons/new">
              <Plus className="h-4 w-4" /> New person
            </Link>
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border bg-card p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Name contains…"
              value={filters.name}
              onChange={(e) => {
                setFilters({ ...filters, name: e.target.value });
                setOffset(0);
              }}
            />
          </div>
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
                Name
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                BDRC
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Wikidata
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
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              (data?.items ?? []).map((p) => (
                <TableRow
                  key={p.id}
                  className="border-b border-border/50 hover:bg-accent/30"
                >
                  <TableCell>
                    <Link
                      href={`/persons/${p.id}`}
                      className="font-medium decoration-primary/40 underline-offset-4 hover:underline"
                    >
                      {localizedSummary(p.name)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.bdrc ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.wiki ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {p.id}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <EmptyState
          className="mt-4"
          title="No persons found."
          action={
            <Button asChild>
              <Link href="/persons/new">Create person</Link>
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
    </div>
  );
}
