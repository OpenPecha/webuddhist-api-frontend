"use client";

import Link from "next/link";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import {
  useSegmentContent,
  useSegmentRelated,
} from "@/lib/api/hooks/segments";
import { SegmentTagsCard } from "@/components/segments/SegmentTagsCard";

export default function SegmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const content = useSegmentContent(id);
  const related = useSegmentRelated(id, { limit: 20, offset: 0 });

  const contentStr =
    typeof content.data === "string"
      ? content.data
      : content.data == null
        ? ""
        : JSON.stringify(content.data, null, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Segment ${id.slice(0, 12)}…`}
        description={<span className="font-mono text-xs">{id}</span>}
      />

      <SegmentTagsCard segmentId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          {content.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : content.isError ? (
            <ErrorBlock error={content.error} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs max-h-[400px] overflow-y-auto">
              {contentStr || (
                <em className="text-muted-foreground">empty</em>
              )}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Related segments ({related.data?.items.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {related.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : related.isError ? (
            <ErrorBlock error={related.error} />
          ) : (related.data?.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No related.</p>
          ) : (
            <ul className="divide-y">
              {(related.data?.items ?? []).map((s) => (
                <li
                  key={s.id}
                  className="py-2 flex items-center justify-between"
                >
                  <Link
                    href={`/segments/${s.id}`}
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    {s.id}
                  </Link>
                  <Link
                    href={`/editions/${s.edition_id}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    edition
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
