"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { AlignmentView } from "@/components/editions/views/AlignmentView";
import { BibliographicView } from "@/components/editions/views/BibliographicView";
import { DurchenView } from "@/components/editions/views/DurchenView";
import { PaginationView } from "@/components/editions/views/PaginationView";
import { SegmentationView } from "@/components/editions/views/SegmentationView";
import {
  type AnnotationKind,
  useAnnotation,
  useDeleteAnnotation,
} from "@/lib/api/hooks/annotations";
import { useEditionContent } from "@/lib/api/hooks/editions";
import { ApiError, useHasApiKey } from "@/lib/api/client";
import type {
  AlignmentOutput,
  BibliographicMetadataOutput,
  NoteOutput,
  PaginationOutput,
  SegmentationOutput,
} from "@/lib/api/client";

const VALID_KINDS: AnnotationKind[] = [
  "segmentations",
  "alignments",
  "paginations",
  "bibliographic",
  "durchens",
];

const LABEL: Record<AnnotationKind, string> = {
  segmentations: "Segmentation",
  alignments: "Alignment",
  paginations: "Pagination",
  bibliographic: "Bibliographic",
  durchens: "Durchen note",
};

export default function AnnotationDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  const router = useRouter();

  if (!VALID_KINDS.includes(type as AnnotationKind)) {
    return (
      <ErrorBlock
        error={new Error(`Unknown annotation kind: ${type}`)}
        title="Invalid URL"
      />
    );
  }
  const kind = type as AnnotationKind;
  return <Inner kind={kind} id={id} onBack={() => router.back()} />;
}

function sourceEditionId(
  kind: AnnotationKind,
  data: unknown,
): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  if (kind === "alignments") {
    return typeof obj.aligned_edition_id === "string"
      ? obj.aligned_edition_id
      : undefined;
  }
  return typeof obj.edition_id === "string" ? obj.edition_id : undefined;
}

function Inner({
  kind,
  id,
  onBack,
}: {
  kind: AnnotationKind;
  id: string;
  onBack: () => void;
}) {
  const hasApiKey = useHasApiKey();
  const { data, isLoading, isError, error } = useAnnotation(
    kind,
    hasApiKey ? id : undefined,
  );
  const del = useDeleteAnnotation(kind);

  const editionId = sourceEditionId(kind, data);
  const content = useEditionContent(
    hasApiKey ? editionId : undefined,
    {},
  );

  if (!hasApiKey) {
    return (
      <ErrorBlock
        error={new Error("Enter an API key in Settings to load this annotation.")}
        title="API key required"
      />
    );
  }
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  const contentStr = typeof content.data === "string" ? content.data : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${LABEL[kind]} ${id.slice(0, 12)}…`}
        description={
          editionId ? (
            <>
              Edition:{" "}
              <Link
                href={`/editions/${editionId}`}
                className="text-primary hover:underline"
              >
                {editionId}
              </Link>
            </>
          ) : (
            <span className="font-mono text-xs">{id}</span>
          )
        }
        actions={
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
            title={`Delete this ${LABEL[kind].toLowerCase()}?`}
            variant="destructive"
            confirmLabel="Delete"
            onConfirm={async () => {
              try {
                await del.mutateAsync(id);
                toast.success("Deleted");
                onBack();
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed",
                );
                throw err;
              }
            }}
          />
        }
      />

      {content.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : content.isError ? (
        <ErrorBlock
          error={content.error}
          title="Could not load edition content for preview"
        />
      ) : (
        <AnnotationView kind={kind} data={data} content={contentStr} />
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="raw">
          <AccordionTrigger className="px-3 text-sm text-muted-foreground">
            Raw payload
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono text-muted-foreground">
                  {id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-mono text-xs max-h-[600px] overflow-y-auto bg-muted/30 p-3 rounded">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function AnnotationView({
  kind,
  data,
  content,
}: {
  kind: AnnotationKind;
  data: unknown;
  content: string;
}) {
  switch (kind) {
    case "segmentations":
      return (
        <SegmentationView
          content={content}
          segmentations={[data as SegmentationOutput]}
        />
      );
    case "alignments":
      return (
        <AlignmentView
          sourceContent={content}
          alignments={[data as AlignmentOutput]}
        />
      );
    case "paginations":
      return (
        <PaginationView
          content={content}
          paginations={[data as PaginationOutput]}
        />
      );
    case "bibliographic":
      return (
        <BibliographicView
          content={content}
          items={[data as BibliographicMetadataOutput]}
        />
      );
    case "durchens":
      return (
        <DurchenView content={content} notes={[data as NoteOutput]} />
      );
  }
}
