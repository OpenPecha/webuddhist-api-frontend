"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { AnnotationListPanel } from "./AnnotationListPanel";
import { ContentEditor } from "./ContentEditor";
import { RelatedSegmentsPanel } from "./RelatedSegmentsPanel";
import { PlainContentView } from "./views/PlainContentView";
import { SegmentationView } from "./views/SegmentationView";
import { PaginationView } from "./views/PaginationView";
import { BibliographicView } from "./views/BibliographicView";
import { DurchenView } from "./views/DurchenView";
import { AlignmentView } from "./views/AlignmentView";
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
  useEditionContent,
  useEditionDurchens,
  useEditionPagination,
  useEditionRelated,
  useEditionSegmentations,
} from "@/lib/api/hooks/editions";
import { useDeleteAnnotation } from "@/lib/api/hooks/annotations";
import { ApiError } from "@/lib/api/client";
import { localizedSummary } from "@/lib/utils/localized-string";

const SEGMENTATION_EXAMPLE = JSON.stringify(
  { segments: [{ lines: [{ start: 0, end: 100 }] }] },
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
        pages: [{ reference: "1a", lines: [{ start: 0, end: 50 }] }],
      },
    ],
  },
  null,
  2,
);
const BIBLIOGRAPHIC_EXAMPLE = JSON.stringify(
  { span: { start: 0, end: 50 }, type: "title" },
  null,
  2,
);
const DURCHEN_EXAMPLE = JSON.stringify(
  { span: { start: 0, end: 50 }, text: "Variant reading" },
  null,
  2,
);

export function EditionWorkspace({
  editionId,
  onDeleted,
}: {
  editionId: string;
  onDeleted?: () => void;
}) {
  const meta = useEdition(editionId);
  const content = useEditionContent(editionId, {});
  const segmentations = useEditionSegmentations(editionId);
  const alignments = useEditionAlignments(editionId);
  const paginations = useEditionPagination(editionId);
  const bibliographic = useEditionBibliographic(editionId);
  const durchens = useEditionDurchens(editionId);
  const related = useEditionRelated(editionId);
  const del = useDeleteEdition();

  const addSeg = useAddSegmentation(editionId);
  const addAlign = useAddAlignment(editionId);
  const addPag = useAddPagination(editionId);
  const addBib = useAddBibliographic(editionId);
  const addDur = useAddDurchen(editionId);

  const delSeg = useDeleteAnnotation("segmentations");
  const delAlign = useDeleteAnnotation("alignments");
  const delPag = useDeleteAnnotation("paginations");
  const delBib = useDeleteAnnotation("bibliographic");
  const delDur = useDeleteAnnotation("durchens");

  const [tab, setTab] = useState("content");

  if (meta.isLoading) return <Skeleton className="h-32 w-full" />;
  if (meta.isError) return <ErrorBlock error={meta.error} />;
  if (!meta.data) return null;

  const data = meta.data;
  const contentStr =
    typeof content.data === "string"
      ? content.data
      : content.data == null
        ? ""
        : "";

  const paginationsArr = paginations.data ? [paginations.data] : [];

  return (
    <div className="space-y-4">
      {/* edition metadata header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-card p-3">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{data.type}</Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {data.id}
            </span>
            <Link
              href={`/editions/${data.id}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              open as page →
            </Link>
          </div>
          {data.incipit_title && (
            <p className="font-medium">{localizedSummary(data.incipit_title)}</p>
          )}
          {data.source && (
            <p className="text-xs text-muted-foreground">
              Source: {data.source}
            </p>
          )}
          {data.colophon && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              Colophon: {data.colophon}
            </p>
          )}
        </div>
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="destructive">
              <Trash2 className="h-3.5 w-3.5" /> Delete edition
            </Button>
          }
          title="Delete this edition?"
          description="Removes the edition and its content."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              await del.mutateAsync(editionId);
              toast.success("Edition deleted");
              onDeleted?.();
            } catch (err) {
              toast.error(
                err instanceof ApiError ? err.message : "Failed to delete",
              );
              throw err;
            }
          }}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="segmentation">
            Segmentation ({segmentations.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="pagination">
            Pagination ({paginationsArr.length})
          </TabsTrigger>
          <TabsTrigger value="bibliographic">
            Bibliographic ({bibliographic.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="durchen">
            Durchen ({durchens.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="alignment">
            Alignment ({alignments.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="related">
            Related ({related.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="manage">Manage / edit</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          {content.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : content.isError ? (
            <ErrorBlock error={content.error} />
          ) : (
            <PlainContentView content={contentStr} />
          )}
        </TabsContent>

        <TabsContent value="segmentation">
          {content.isLoading || segmentations.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <SegmentationView
              content={contentStr}
              segmentations={segmentations.data ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="pagination">
          {content.isLoading || paginations.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <PaginationView
              content={contentStr}
              paginations={paginationsArr}
            />
          )}
        </TabsContent>

        <TabsContent value="bibliographic">
          {content.isLoading || bibliographic.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <BibliographicView
              content={contentStr}
              items={bibliographic.data ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="durchen">
          {content.isLoading || durchens.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DurchenView
              content={contentStr}
              notes={durchens.data ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="alignment">
          {content.isLoading || alignments.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AlignmentView
              sourceContent={contentStr}
              alignments={alignments.data ?? []}
            />
          )}
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
                        className="text-primary hover:underline font-mono text-sm"
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
          <div className="mt-4">
            <RelatedSegmentsPanel editionId={editionId} />
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit content</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentEditor editionId={editionId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Segmentations</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotationListPanel
                  kind="segmentations"
                  items={segmentations.data ?? []}
                  isLoading={segmentations.isLoading}
                  onAdd={(b) => addSeg.mutateAsync(b as never)}
                  onDelete={(aid) => delSeg.mutateAsync(aid)}
                  inputExample={SEGMENTATION_EXAMPLE}
                  inputDescription="Segments is an array; each has a 'lines' array of {start,end} spans."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alignments</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotationListPanel
                  kind="alignments"
                  items={alignments.data ?? []}
                  isLoading={alignments.isLoading}
                  onAdd={(b) => addAlign.mutateAsync(b as never)}
                  onDelete={(aid) => delAlign.mutateAsync(aid)}
                  inputExample={ALIGNMENT_EXAMPLE}
                  inputDescription="target_edition_id, target_segments, aligned_segments (each with target_indices)."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagination</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotationListPanel
                  kind="pagination"
                  items={paginationsArr}
                  isLoading={paginations.isLoading}
                  onAdd={(b) => addPag.mutateAsync(b as never)}
                  onDelete={(aid) => delPag.mutateAsync(aid)}
                  inputExample={PAGINATION_EXAMPLE}
                  inputDescription="volumes → pages → lines (Spans). Each page needs a 'reference'."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bibliographic</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotationListPanel
                  kind="bibliographic"
                  items={bibliographic.data ?? []}
                  isLoading={bibliographic.isLoading}
                  onAdd={(b) => addBib.mutateAsync(b as never)}
                  onDelete={(aid) => delBib.mutateAsync(aid)}
                  inputExample={BIBLIOGRAPHIC_EXAMPLE}
                  inputDescription="A span and a type (colophon|incipit|alt_incipit|alt_title|person|title|author)."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Durchen notes</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotationListPanel
                  kind="durchens"
                  items={durchens.data ?? []}
                  isLoading={durchens.isLoading}
                  onAdd={(b) => addDur.mutateAsync(b as never)}
                  onDelete={(aid) => delDur.mutateAsync(aid)}
                  inputExample={DURCHEN_EXAMPLE}
                  inputDescription="A span and the note text."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
