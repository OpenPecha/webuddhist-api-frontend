"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SpanField, type SpanValue } from "./SpanField";
import { ApiError, type NoteInput } from "@/lib/api/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onAdd: (body: NoteInput) => Promise<unknown>;
};

export function DurchenAddDialog({
  open,
  onOpenChange,
  content,
  onAdd,
}: Props) {
  const [span, setSpan] = useState<SpanValue>({ start: 0, end: 0 });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setSpan({ start: 0, end: 0 });
    setText("");
  };

  const valid = span.end > span.start && text.trim().length > 0;
  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onAdd({ span, text } as NoteInput);
      toast.success("Durchen note added");
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add durchen note</DialogTitle>
          <DialogDescription>
            Record a variant reading for a span of the edition's content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <SpanField value={span} onChange={setSpan} content={content} />
          {span.end > span.start ? (
            <div className="rounded-md border bg-muted/20 p-2 text-xs">
              <span className="text-muted-foreground mr-1">Main reading:</span>
              <span className="font-mono">
                {content.slice(span.start, span.end).slice(0, 200)}
                {content.slice(span.start, span.end).length > 200 ? "…" : ""}
              </span>
            </div>
          ) : (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" /> Set a span (end &gt; start).
            </p>
          )}
          <div>
            <Label className="text-xs">Variant text</Label>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Variant reading…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
