"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { ContentEditor } from "@/components/editions/ContentEditor";
import { AnnotationListPanel } from "@/components/editions/AnnotationListPanel";
import { RelatedSegmentsPanel } from "@/components/editions/RelatedSegmentsPanel";
import {
  useAddAlignment,
  useAddBibliographic,
  useAddDurchen,
  useAddPagination,
  useAddSegmentation,
  useDeleteEdition,
  useEdition,
  useEditionAlignments,
  useEditionBibliographic,
  useEditionDurchens,
  useEditionPagination,
  useEditionRelated,
  useEditionSegmentations,
} from "@/lib/api/hooks/editions";
import { useDeleteAnnotation } from "@/lib/api/hooks/annotations";
import { ApiError } from "@/lib/api/client";
import { localizedSummary } from "@/lib/utils/localized-string";

const SEGMENTATION_EXAMPLE = JSON.stringify(
  {
    segments: [{ lines: [{ start: 0, end: 100 }] }],
  },
  null,
  2,
);

const ALIGNMENT_EXAMPLE = JSON.stringify(
  {
    target_edition_id: "TARGET_EDITION_ID",
    target_segments: [{ lines: [{ start: 0, end: 100 }] }],
    aligned_segments: [
      { lines: [{ start: 0, end: 80 }], target_indices: [0] },
    ],
  },
  null,
  2,
);

const PAGINATION_EXAMPLE = JSON.stringify(
  {
    volumes: [
      {
        index: 1,
        pages: [
          {
            reference: "1a",
            lines: [{ start: 0, end: 50 }],
          },
        ],
      },
    ],
  },
  null,
  2,
);

const BIBLIOGRAPHIC_EXAMPLE = JSON.stringify(
  {
    span: { start: 0, end: 50 },
    type: "title",
  },
  null,
  2,
);

const DURCHEN_EXAMPLE = JSON.stringify(
  {
    span: { start: 0, end: 50 },
    text: "Note text",
  },
  null,
  2,
);

export default function EditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, error } = useEdition(id);
  const del = useDeleteEdition();
  const related = useEditionRelated(id);

  const segmentations = useEditionSegmentations(id);
  const alignments = useEditionAlignments(id);
  const pagination = useEditionPagination(id);
  const bibliographic = useEditionBibliographic(id);
  const durchens = useEditionDurchens(id);

  const addSeg = useAddSegmentation(id);
  const addAlign = useAddAlignment(id);
  const addPag = useAddPagination(id);
  const addBib = useAddBibliographic(id);
  const addDur = useAddDurchen(id);

  const delSeg = useDeleteAnnotation("segmentations");
  const delAlign = useDeleteAnnotation("alignments");
  const delPag = useDeleteAnnotation("paginations");
  const delBib = useDeleteAnnotation("bibliographic");
  const delDur = useDeleteAnnotation("durchens");

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          data.incipit_title
            ? localizedSummary(data.incipit_title)
            : `Edition ${data.id.slice(0, 8)}…`
        }
        description={
          <span>
            <Link
              href={`/texts/${data.text_id}`}
              className="text-primary hover:underline"
            >
              ← back to text
            </Link>
            <span className="ml-3">{data.id}</span>
          </span>
        }
        actions={
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete edition
              </Button>
            }
            title="Delete this edition?"
            description="Removes the edition and its content."
            variant="destructive"
            confirmLabel="Delete"
            onConfirm={async () => {
              try {
                await del.mutateAsync(id);
                toast.success("Edition deleted");
                router.push(`/texts/${data.text_id}`);
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed to delete",
                );
                throw err;
              }
            }}
          />
        }
      />

      <Tabs defaultValue="metadata">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="segmentations">
            Segmentations ({segmentations.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="alignments">
            Alignments ({alignments.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="pagination">
            Pagination ({pagination.data ? 1 : 0})
          </TabsTrigger>
          <TabsTrigger value="bibliographic">
            Bibliographic ({bibliographic.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="durchens">
            Durchens ({durchens.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="related-segments">Related segments</TabsTrigger>
          <TabsTrigger value="related">Related editions</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Edition metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Type" value={<Badge variant="outline">{data.type}</Badge>} />
              <Row label="Source" value={data.source ?? "—"} />
              <Row label="BDRC" value={data.bdrc ?? "—"} />
              <Row label="Wikidata" value={data.wiki ?? "—"} />
              <Row
                label="Incipit"
                value={data.incipit_title ? localizedSummary(data.incipit_title) : "—"}
              />
              <Row
                label="Colophon"
                value={
                  data.colophon ? (
                    <span className="text-xs whitespace-pre-wrap">
                      {data.colophon}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <ContentEditor editionId={id} />
        </TabsContent>

        <TabsContent value="segmentations">
          <AnnotationListPanel
            kind="segmentations"
            items={segmentations.data ?? []}
            isLoading={segmentations.isLoading}
            onAdd={(b) => addSeg.mutateAsync(b as never)}
            onDelete={(aid) => delSeg.mutateAsync(aid)}
            inputExample={SEGMENTATION_EXAMPLE}
            inputDescription="Segments is an array; each has a 'lines' array of {start,end} spans."
          />
        </TabsContent>

        <TabsContent value="alignments">
          <AnnotationListPanel
            kind="alignments"
            items={alignments.data ?? []}
            isLoading={alignments.isLoading}
            onAdd={(b) => addAlign.mutateAsync(b as never)}
            onDelete={(aid) => delAlign.mutateAsync(aid)}
            inputExample={ALIGNMENT_EXAMPLE}
            inputDescription="target_edition_id, target_segments, and aligned_segments (each with target_indices)."
          />
        </TabsContent>

        <TabsContent value="pagination">
          <AnnotationListPanel
            kind="pagination"
            items={pagination.data ? [pagination.data] : []}
            isLoading={pagination.isLoading}
            onAdd={(b) => addPag.mutateAsync(b as never)}
            onDelete={(aid) => delPag.mutateAsync(aid)}
            inputExample={PAGINATION_EXAMPLE}
            inputDescription="volumes -> pages -> lines (Spans). Each page needs a 'reference'."
          />
        </TabsContent>

        <TabsContent value="bibliographic">
          <AnnotationListPanel
            kind="bibliographic"
            items={bibliographic.data ?? []}
            isLoading={bibliographic.isLoading}
            onAdd={(b) => addBib.mutateAsync(b as never)}
            onDelete={(aid) => delBib.mutateAsync(aid)}
            inputExample={BIBLIOGRAPHIC_EXAMPLE}
            inputDescription="A span and a type (colophon|incipit|alt_incipit|alt_title|person|title|author)."
          />
        </TabsContent>

        <TabsContent value="durchens">
          <AnnotationListPanel
            kind="durchens"
            items={durchens.data ?? []}
            isLoading={durchens.isLoading}
            onAdd={(b) => addDur.mutateAsync(b as never)}
            onDelete={(aid) => delDur.mutateAsync(aid)}
            inputExample={DURCHEN_EXAMPLE}
            inputDescription="A span and the note text."
          />
        </TabsContent>

        <TabsContent value="related-segments">
          <RelatedSegmentsPanel editionId={id} />
        </TabsContent>

        <TabsContent value="related">
          <Card>
            <CardHeader>
              <CardTitle>Related editions</CardTitle>
            </CardHeader>
            <CardContent>
              {(related.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No related editions.
                </p>
              ) : (
                <ul className="divide-y">
                  {(related.data ?? []).map((e) => (
                    <li
                      key={e.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <Link
                        href={`/editions/${e.id}`}
                        className="text-primary hover:underline"
                      >
                        {e.id}
                      </Link>
                      <Badge variant="outline">{e.type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
