"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { AnnotationListPanel } from "./AnnotationListPanel";
import { ContentEditor } from "./ContentEditor";
import { RelatedSegmentsPanel } from "./RelatedSegmentsPanel";
import { PlainContentView } from "./views/PlainContentView";
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
  showOpenLink = true,
  showDelete = true,
}: {
  editionId: string;
  onDeleted?: () => void;
  showOpenLink?: boolean;
  showDelete?: boolean;
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
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>Edition metadata</SectionLabel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{data.type}</Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {data.id}
              </span>
              {showOpenLink && (
                <Link
                  href={`/editions/${data.id}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  open as page
                </Link>
              )}
            </div>
            {data.incipit_title && (
              <p className="font-medium">
                {localizedSummary(data.incipit_title)}
              </p>
            )}
            <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <MetadataRow label="Text ID" value={data.text_id} />
              <MetadataRow label="BDRC" value={data.bdrc ?? "-"} />
              <MetadataRow label="Wikidata" value={data.wiki ?? "-"} />
            </dl>
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
          {showDelete && (
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
          )}
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Content</SectionLabel>
        {content.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : content.isError ? (
          <ErrorBlock error={content.error} />
        ) : (
          <PlainContentView content={contentStr} />
        )}
      </div>

      <div className="border-t" />

      <div className="space-y-4">
        <SectionLabel>Annotations</SectionLabel>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Segmentations ({segmentations.data?.length ?? 0})
              </CardTitle>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Pagination ({paginationsArr.length})
              </CardTitle>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Bibliographic ({bibliographic.data?.length ?? 0})
              </CardTitle>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Durchen notes ({durchens.data?.length ?? 0})
              </CardTitle>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Alignments ({alignments.data?.length ?? 0})
              </CardTitle>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Related editions ({related.data?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(related.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No related editions.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {(related.data ?? []).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between px-3 py-2"
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
              <RelatedSegmentsPanel editionId={editionId} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t" />

      <div className="space-y-2">
        <SectionLabel>Edit content</SectionLabel>
        <ContentEditor editionId={editionId} />
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt>{label}:</dt>
      <dd className="font-mono text-foreground">{value}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}
