"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { AnnotationItemsList } from "./AnnotationItemsList";
import { AnnotationListPanel } from "./AnnotationListPanel";
import { ContentEditor } from "./ContentEditor";
import { RelatedSegmentsPanel } from "./RelatedSegmentsPanel";
import { BibliographicAddDialog } from "./add-forms/BibliographicAddDialog";
import { DurchenAddDialog } from "./add-forms/DurchenAddDialog";
import { PaginationAddDialog } from "./add-forms/PaginationAddDialog";
import { AlignmentView } from "./views/AlignmentView";
import { BibliographicView } from "./views/BibliographicView";
import { DurchenView } from "./views/DurchenView";
import { PaginationView } from "./views/PaginationView";
import { PlainContentView } from "./views/PlainContentView";
import { SegmentationView } from "./views/SegmentationView";
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
import { ApiError, useHasApiKey } from "@/lib/api/client";
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
type ContentView =
  | "plain"
  | "segmentation"
  | "pagination"
  | "bibliographic"
  | "durchen"
  | "alignment";

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
  const hasApiKey = useHasApiKey();
  const [view, setView] = useState<ContentView>("plain");

  const meta = useEdition(hasApiKey ? editionId : undefined);
  const content = useEditionContent(
    hasApiKey ? editionId : undefined,
    {},
  );
  const segmentations = useEditionSegmentations(
    hasApiKey ? editionId : undefined,
  );
  const alignments = useEditionAlignments(
    hasApiKey ? editionId : undefined,
  );
  const paginations = useEditionPagination(
    hasApiKey ? editionId : undefined,
  );
  const bibliographic = useEditionBibliographic(
    hasApiKey ? editionId : undefined,
  );
  const durchens = useEditionDurchens(
    hasApiKey ? editionId : undefined,
  );
  const related = useEditionRelated(hasApiKey ? editionId : undefined);
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

  if (!hasApiKey) return <ApiKeyMissingNotice />;

  if (meta.isLoading) return <Skeleton className="h-32 w-full" />;
  if (meta.isError) return <ErrorBlock error={meta.error} />;
  if (!meta.data) return null;

  const data = meta.data;
  const contentStr = typeof content.data === "string" ? content.data : "";
  const pagination = paginations.data ?? null;

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
              description="Removes the edition, its content, and all annotations attached to it (segmentations, alignments, pagination, bibliographic, durchens)."
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
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <SectionLabel>Content</SectionLabel>
          <p className="text-[11px] text-muted-foreground">
            {contentStr.length.toLocaleString()} characters
          </p>
        </div>
        {content.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : content.isError ? (
          <ErrorBlock error={content.error} />
        ) : (
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as ContentView)}
          >
            <TabsList>
              <TabsTrigger value="plain">Plain</TabsTrigger>
              <TabsTrigger value="segmentation">
                Segmentation
                <CountBadge n={segmentations.data?.length ?? 0} />
              </TabsTrigger>
              <TabsTrigger value="pagination">
                Pagination
                <CountBadge n={pagination ? 1 : 0} />
              </TabsTrigger>
              <TabsTrigger value="bibliographic">
                Bibliographic
                <CountBadge n={bibliographic.data?.length ?? 0} />
              </TabsTrigger>
              <TabsTrigger value="durchen">
                Durchen
                <CountBadge n={durchens.data?.length ?? 0} />
              </TabsTrigger>
              <TabsTrigger value="alignment">
                Alignment
                <CountBadge n={alignments.data?.length ?? 0} />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plain" className="mt-3">
              <PlainContentView content={contentStr} />
            </TabsContent>
            <TabsContent value="segmentation" className="mt-3">
              <SegmentationView
                content={contentStr}
                segmentations={segmentations.data ?? []}
              />
            </TabsContent>
            <TabsContent value="pagination" className="mt-3">
              <PaginationView
                content={contentStr}
                paginations={pagination ? [pagination] : []}
              />
            </TabsContent>
            <TabsContent value="bibliographic" className="mt-3">
              <BibliographicView
                content={contentStr}
                items={bibliographic.data ?? []}
              />
            </TabsContent>
            <TabsContent value="durchen" className="mt-3">
              <DurchenView content={contentStr} notes={durchens.data ?? []} />
            </TabsContent>
            <TabsContent value="alignment" className="mt-3">
              <AlignmentView
                sourceContent={contentStr}
                alignments={alignments.data ?? []}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <div className="border-t" />

      <div className="space-y-4">
        <SectionLabel>Manage annotations</SectionLabel>
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-5">
              <AnnotationListPanel
                kind="segmentations"
                items={segmentations.data ?? []}
                isLoading={segmentations.isLoading}
                onAdd={(b) => addSeg.mutateAsync(b as never)}
                onDelete={(aid) => delSeg.mutateAsync(aid)}
                inputExample={SEGMENTATION_EXAMPLE}
                inputDescription="Segments is an array; each has a 'lines' array of {start,end} spans."
                content={contentStr}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <SingletonPaginationPanel
                pagination={pagination}
                isLoading={paginations.isLoading}
                onAdd={(b) => addPag.mutateAsync(b as never)}
                onDelete={(id) => delPag.mutateAsync(id)}
                content={contentStr}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <BibliographicCard
                items={bibliographic.data ?? []}
                isLoading={bibliographic.isLoading}
                onAdd={(b) => addBib.mutateAsync(b as never)}
                onDelete={(id) => delBib.mutateAsync(id)}
                content={contentStr}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <DurchenCard
                items={durchens.data ?? []}
                isLoading={durchens.isLoading}
                onAdd={(b) => addDur.mutateAsync(b as never)}
                onDelete={(id) => delDur.mutateAsync(id)}
                content={contentStr}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <AnnotationListPanel
                kind="alignments"
                items={alignments.data ?? []}
                isLoading={alignments.isLoading}
                onAdd={(b) => addAlign.mutateAsync(b as never)}
                onDelete={(aid) => delAlign.mutateAsync(aid)}
                inputExample={ALIGNMENT_EXAMPLE}
                inputDescription="target_edition_id, target_segments, aligned_segments (each with target_indices)."
                content={contentStr}
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

function SingletonPaginationPanel({
  pagination,
  isLoading,
  onAdd,
  onDelete,
  content,
}: {
  pagination: { id: string; volumes: unknown[] } | null;
  isLoading: boolean;
  onAdd: (body: unknown) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  content: string;
}) {
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Pagination</h3>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!pagination) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Pagination (0)</h3>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          An edition has at most one pagination annotation. Add one to split
          content into volumes and pages.
        </p>
        <PaginationAddDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          content={content}
          onAdd={onAdd as never}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Pagination (1)</h3>
        <div className="flex gap-1">
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline">
                <Pencil className="h-3.5 w-3.5" /> Replace
              </Button>
            }
            title="Replace this pagination?"
            description="The current pagination annotation will be deleted, then a new one will be created. There is no PATCH endpoint for pagination, so this is a delete-then-create."
            variant="warning"
            confirmLabel="Continue"
            onConfirm={async () => {
              try {
                await onDelete(pagination.id);
                toast.success("Existing pagination deleted — add the new one");
                setAddOpen(true);
              } catch (err) {
                toast.error(
                  err instanceof ApiError
                    ? err.message
                    : "Failed to delete existing pagination",
                );
                throw err;
              }
            }}
          />
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="ghost">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            }
            title="Delete this pagination?"
            description="This action cannot be undone."
            variant="destructive"
            confirmLabel="Delete"
            onConfirm={async () => {
              try {
                await onDelete(pagination.id);
                toast.success("Pagination deleted");
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed to delete",
                );
                throw err;
              }
            }}
          />
        </div>
      </div>
      <ul className="divide-y rounded-md border">
        <li className="flex items-center justify-between px-3 py-2">
          <Link
            href={`/annotations/paginations/${pagination.id}`}
            className="text-sm font-mono text-primary hover:underline"
          >
            {pagination.id}
          </Link>
          <span className="text-xs text-muted-foreground">
            {pagination.volumes.length} volume
            {pagination.volumes.length === 1 ? "" : "s"}
          </span>
        </li>
      </ul>
      <PaginationAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        content={content}
        onAdd={onAdd as never}
      />
    </div>
  );
}

function BibliographicCard({
  items,
  isLoading,
  onAdd,
  onDelete,
  content,
}: {
  items: Array<{ id: string }>;
  isLoading: boolean;
  onAdd: (body: unknown) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnnotationItemsList
        kind="bibliographic"
        title="Bibliographic"
        items={items}
        isLoading={isLoading}
        onDelete={onDelete}
        emptyHint="Mark spans of the content as titles, authors, colophons, etc."
        addButton={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />
      <BibliographicAddDialog
        open={open}
        onOpenChange={setOpen}
        content={content}
        onAdd={onAdd as never}
      />
    </>
  );
}

function DurchenCard({
  items,
  isLoading,
  onAdd,
  onDelete,
  content,
}: {
  items: Array<{ id: string }>;
  isLoading: boolean;
  onAdd: (body: unknown) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnnotationItemsList
        kind="durchens"
        title="Durchen notes"
        items={items}
        isLoading={isLoading}
        onDelete={onDelete}
        emptyHint="Record variant readings at specific spans of the content."
        addButton={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />
      <DurchenAddDialog
        open={open}
        onOpenChange={setOpen}
        content={content}
        onAdd={onAdd as never}
      />
    </>
  );
}

function ApiKeyMissingNotice() {
  return (
    <Alert>
      <KeyRound className="h-4 w-4" />
      <AlertTitle>API key required</AlertTitle>
      <AlertDescription>
        Open <strong>Access settings</strong> in the sidebar footer and enter
        an API key. Every request needs an <code>X-API-Key</code> header — this
        workspace can't load anything without one.
      </AlertDescription>
    </Alert>
  );
}

function CountBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 py-0 text-[10px] font-mono leading-4">
      {n}
    </span>
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
