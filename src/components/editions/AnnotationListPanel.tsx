"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ClipboardCopy, CornerDownLeft, MousePointerClick, Plus, Trash2 } from "lucide-react";
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
  | "paginations"
  | "bibliographic"
  | "durchens";

type Props = {
  kind: AnnotationKind;
  items: Array<{ id: string }>;
  isLoading: boolean;
  onAdd: (body: unknown) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  inputExample: string;
  inputDescription: string;
  /** Edition content; enables a span-capture helper above the JSON textarea. */
  content?: string;
};

export function AnnotationListPanel({
  kind,
  items,
  isLoading,
  onAdd,
  onDelete,
  inputExample,
  inputDescription,
  content,
}: Props) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(inputExample);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ start: number; end: number } | null>(
    null,
  );
  const preRef = useRef<HTMLPreElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      setCaptured(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : `Failed to add ${kind}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const captureSelection = () => {
    const pre = preRef.current;
    if (!pre || !content) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      toast.error("Select some text in the content preview first");
      return;
    }
    const range = sel.getRangeAt(0);
    if (
      !pre.contains(range.startContainer) ||
      !pre.contains(range.endContainer)
    ) {
      toast.error("Selection must be inside the content preview");
      return;
    }
    const before = range.cloneRange();
    before.selectNodeContents(pre);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const within = range.cloneRange();
    within.selectNodeContents(pre);
    within.setEnd(range.endContainer, range.endOffset);
    const end = within.toString().length;
    if (end > start) setCaptured({ start, end });
  };

  const insertAtCursor = () => {
    if (!captured) return;
    const ta = textareaRef.current;
    const snippet = `{ "start": ${captured.start}, "end": ${captured.end} }`;
    if (!ta) {
      void navigator.clipboard?.writeText(snippet);
      toast.success("Copied to clipboard");
      return;
    }
    const start = ta.selectionStart ?? json.length;
    const end = ta.selectionEnd ?? json.length;
    const next = json.slice(0, start) + snippet + json.slice(end);
    setJson(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
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
                href={`/annotations/${kind}/${item.id}`}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add {labelFor(kind).toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {content !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">
                    Edition content — select text and capture a span
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={captureSelection}
                  >
                    <MousePointerClick className="h-3.5 w-3.5" /> Capture
                  </Button>
                </div>
                <pre
                  ref={preRef}
                  className="rounded-md border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed overflow-y-auto max-h-[200px]"
                >
                  {content || "(empty content)"}
                </pre>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground">
                    {content.length.toLocaleString()} chars total.
                  </span>
                  {captured && (
                    <>
                      <span className="font-mono text-foreground">
                        Last span: [{captured.start}, {captured.end})
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => {
                          void navigator.clipboard?.writeText(
                            `{ "start": ${captured.start}, "end": ${captured.end} }`,
                          );
                          toast.success("Copied");
                        }}
                      >
                        <ClipboardCopy className="h-3 w-3" /> Copy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={insertAtCursor}
                      >
                        <CornerDownLeft className="h-3 w-3" /> Insert at cursor
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>JSON payload</Label>
              <p className="text-xs text-muted-foreground">{inputDescription}</p>
              <Textarea
                ref={textareaRef}
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="font-mono text-xs min-h-[260px]"
                spellCheck={false}
              />
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
            </div>
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
    case "paginations":
      return "Pagination";
    case "bibliographic":
      return "Bibliographic";
    case "durchens":
      return "Durchen notes";
  }
}
