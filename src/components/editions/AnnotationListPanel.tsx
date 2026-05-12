"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ApiError } from "@/lib/api/client";

export type AnnotationKind =
  | "segmentations"
  | "alignments"
  | "pagination"
  | "bibliographic"
  | "durchens";

const ANNOTATION_TO_RESOURCE: Record<AnnotationKind, string> = {
  segmentations: "segmentations",
  alignments: "alignments",
  pagination: "paginations",
  bibliographic: "bibliographic",
  durchens: "durchens",
};

type Props = {
  kind: AnnotationKind;
  items: Array<{ id: string }>;
  isLoading: boolean;
  onAdd: (body: unknown) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  inputExample: string;
  inputDescription: string;
};

export function AnnotationListPanel({
  kind,
  items,
  isLoading,
  onAdd,
  onDelete,
  inputExample,
  inputDescription,
}: Props) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(inputExample);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const submit = async () => {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setBusy(true);
    try {
      await onAdd(parsed);
      toast.success(`${labelFor(kind)} added`);
      setOpen(false);
      setJson(inputExample);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : `Failed to add ${kind}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {labelFor(kind)} ({items.length})
        </h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${kind} yet.`}
          description={`Add the first ${labelFor(kind).toLowerCase()} for this edition.`}
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <Link
                href={`/annotations/${ANNOTATION_TO_RESOURCE[kind]}/${item.id}`}
                className="text-sm font-mono text-primary hover:underline"
              >
                {item.id}
              </Link>
              <ConfirmDialog
                trigger={
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                }
                title="Delete annotation?"
                description="This action cannot be undone."
                variant="destructive"
                confirmLabel="Delete"
                onConfirm={async () => {
                  try {
                    await onDelete(item.id);
                    toast.success("Deleted");
                  } catch (err) {
                    toast.error(
                      err instanceof ApiError
                        ? err.message
                        : "Failed to delete",
                    );
                    throw err;
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add {labelFor(kind).toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>JSON payload</Label>
            <p className="text-xs text-muted-foreground">{inputDescription}</p>
            <Textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              className="font-mono text-xs min-h-[260px]"
              spellCheck={false}
            />
            {parseError && (
              <p className="text-xs text-destructive">{parseError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function labelFor(kind: AnnotationKind): string {
  switch (kind) {
    case "segmentations":
      return "Segmentations";
    case "alignments":
      return "Alignments";
    case "pagination":
      return "Pagination";
    case "bibliographic":
      return "Bibliographic";
    case "durchens":
      return "Durchen notes";
  }
}
