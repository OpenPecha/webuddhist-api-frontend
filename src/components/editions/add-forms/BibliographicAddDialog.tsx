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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpanField, type SpanValue } from "./SpanField";
import { ApiError, type BibliographicMetadataInput } from "@/lib/api/client";

const TYPES = [
  "title",
  "alt_title",
  "author",
  "person",
  "colophon",
  "incipit",
  "alt_incipit",
] as const;
type BibType = (typeof TYPES)[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onAdd: (body: BibliographicMetadataInput) => Promise<unknown>;
};

export function BibliographicAddDialog({
  open,
  onOpenChange,
  content,
  onAdd,
}: Props) {
  const [span, setSpan] = useState<SpanValue>({ start: 0, end: 0 });
  const [type, setType] = useState<BibType>("title");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setSpan({ start: 0, end: 0 });
    setType("title");
  };

  const valid = span.end > span.start;
  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onAdd({ span, type } as BibliographicMetadataInput);
      toast.success("Bibliographic annotation added");
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add bibliographic annotation</DialogTitle>
          <DialogDescription>
            Mark a span of the edition content as a title, author, colophon, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Type</Label>
            <div className="mt-1">
              <Select
                value={type}
                onValueChange={(v) => setType(v as BibType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SpanField value={span} onChange={setSpan} content={content} />
          {valid ? (
            <div className="rounded-md border bg-muted/20 p-2 text-xs">
              <span className="text-muted-foreground mr-1">Preview:</span>
              <span className="font-mono">
                {content.slice(span.start, span.end).slice(0, 200)}
                {content.slice(span.start, span.end).length > 200 ? "…" : ""}
              </span>
            </div>
          ) : (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" /> Set a span (end &gt; start) to
              enable Add.
            </p>
          )}
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
