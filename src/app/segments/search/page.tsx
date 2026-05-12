"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { useSegmentSearch } from "@/lib/api/hooks/segments";
import { SegmentSnippet } from "@/components/segments/SegmentSnippet";
import { ApiError } from "@/lib/api/client";

export default function SegmentSearchPage() {
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState(10);
  const [titleFilter, setTitleFilter] = useState("");
  const [active, setActive] = useState<{
    query: string;
    limit: number;
    title: string;
  } | null>(null);

  const { data, isLoading, isError, error, isFetching } = useSegmentSearch(
    active?.query ?? "",
    !!active,
    {
      limit: active?.limit,
      title: active?.title || undefined,
    },
  );

  const upstreamBroken =
    isError &&
    error instanceof ApiError &&
    error.status === 422 &&
    /params/i.test(error.message);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segment search"
        description="Semantic search across all segments via /v2/segments/search."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActive({
            query: input,
            limit,
            title: titleFilter,
          });
        }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a query…"
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isFetching}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Limit</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <Label className="text-xs">Title filter (optional)</Label>
            <Input
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="e.g. a specific text title"
            />
          </div>
        </div>
      </form>

      {upstreamBroken && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Upstream API issue</AlertTitle>
          <AlertDescription>
            The <code>/v2/segments/search</code> endpoint declares its{" "}
            <code>params</code> query field as a Pydantic model but the server
            isn&apos;t configured to parse it from JSON, form fields, or
            deepObject notation — every shape returns the same{" "}
            <em>&quot;model_attributes_type&quot;</em> error. This needs to be
            fixed upstream. Raw error: <code>{error.message}</code>
          </AlertDescription>
        </Alert>
      )}

      {isError && !upstreamBroken && <ErrorBlock error={error} />}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>
              {data.count} results for &quot;{data.query}&quot;
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results.</p>
            ) : (
              <ul className="divide-y">
                {data.results.map((r) => {
                  const entity = r.entity as Record<string, unknown>;
                  const editionId = entity.edition_id as string | undefined;
                  const textId = entity.text_id as string | undefined;
                  return (
                    <li key={r.id} className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/segments/${r.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {r.id}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          distance: {r.distance.toFixed(4)}
                        </span>
                      </div>
                      <SegmentSnippet id={r.id} />
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {editionId && (
                          <Link
                            href={`/editions/${editionId}`}
                            className="hover:underline"
                          >
                            edition: {editionId.slice(0, 10)}…
                          </Link>
                        )}
                        {textId && (
                          <Link
                            href={`/texts/${textId}`}
                            className="hover:underline"
                          >
                            text: {textId.slice(0, 10)}…
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {!data && !isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          Enter a query to search.
        </p>
      )}
    </div>
  );
}
