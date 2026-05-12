"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import {
  type AnnotationKind,
  useAnnotation,
  useDeleteAnnotation,
} from "@/lib/api/hooks/annotations";
import { ApiError } from "@/lib/api/client";

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

function Inner({
  kind,
  id,
  onBack,
}: {
  kind: AnnotationKind;
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useAnnotation(kind, id);
  const del = useDeleteAnnotation(kind);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  const editionId = (data as { edition_id?: string }).edition_id;

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
      <Card>
        <CardHeader>
          <CardTitle>Raw payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono text-xs max-h-[600px] overflow-y-auto bg-muted/30 p-3 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
