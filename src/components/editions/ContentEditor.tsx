"use client";

import { useMemo, useRef, useState } from "react";
import {
  Eraser,
  Eye,
  EyeOff,
  Loader2,
  PlayCircle,
  Plus,
  Replace,
  Scissors,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEditionContent,
  usePatchEditionContent,
} from "@/lib/api/hooks/editions";
import { ApiError, type ContentOperation } from "@/lib/api/client";

type Op =
  | { type: "insert"; position: number; text: string }
  | { type: "delete"; start: number; end: number }
  | { type: "replace"; start: number; end: number; text: string };

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function applyOps(content: string, ops: Op[]): string {
  let result = content;
  for (const op of ops) {
    if (op.type === "insert") {
      const pos = clampInt(op.position, 0, result.length);
      result = result.slice(0, pos) + op.text + result.slice(pos);
    } else if (op.type === "delete") {
      const s = clampInt(op.start, 0, result.length);
      const e = clampInt(op.end, s, result.length);
      result = result.slice(0, s) + result.slice(e);
    } else {
      const s = clampInt(op.start, 0, result.length);
      const e = clampInt(op.end, s, result.length);
      result = result.slice(0, s) + op.text + result.slice(e);
    }
  }
  return result;
}

export function ContentEditor({ editionId }: { editionId: string }) {
  const { data, isLoading, isError, error, isFetching } = useEditionContent(
    editionId,
    {},
  );
  const patch = usePatchEditionContent(editionId);
  const content = typeof data === "string" ? data : "";

  const preRef = useRef<HTMLPreElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [ops, setOps] = useState<Op[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const previewText = useMemo(() => applyOps(content, ops), [content, ops]);

  function captureSelection(): { start: number; end: number } | null {
    const pre = preRef.current;
    if (!pre || !content) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (
      !pre.contains(range.startContainer) ||
      !pre.contains(range.endContainer)
    )
      return null;
    const before = range.cloneRange();
    before.selectNodeContents(pre);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const within = range.cloneRange();
    within.selectNodeContents(pre);
    within.setEnd(range.endContainer, range.endOffset);
    const end = within.toString().length;
    if (end < start) return { start: end, end: start };
    return { start, end };
  }

  function handleMouseUp() {
    const s = captureSelection();
    if (!s || s.end === s.start) {
      setSelection(null);
      return;
    }
    setSelection(s);
  }

  function addOp(op: Op) {
    setOps((prev) => [...prev, op]);
  }

  const hasSelection = selection !== null && selection.end > selection.start;
  const selectedText = hasSelection
    ? content.slice(selection!.start, selection!.end)
    : "";
  const caretPos = selection?.end ?? 0;

  async function submitOps() {
    if (ops.length === 0) return;
    setAppliedCount(0);
    let applied = 0;
    try {
      for (const op of ops) {
        await patch.mutateAsync(op as ContentOperation);
        applied++;
        setAppliedCount(applied);
      }
      toast.success(`${applied} operation${applied === 1 ? "" : "s"} applied`);
      setOps([]);
      setShowPreview(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "request failed";
      if (applied === 0) {
        toast.error(`Operation 1 failed: ${message}`);
      } else {
        toast.error(
          `Stopped after ${applied}/${ops.length}. Op ${applied + 1} failed: ${message}. The first ${applied} were applied; remaining are still queued.`,
        );
      }
      setOps((prev) => prev.slice(applied));
    } finally {
      setAppliedCount(null);
    }
  }

  if (isError) return <ErrorBlock error={error} />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{content.length.toLocaleString()} characters</span>
            {isFetching && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> refreshing
              </span>
            )}
            {hasSelection && (
              <span className="font-mono text-foreground">
                selection: [{selection!.start}, {selection!.end}) ·{" "}
                {selection!.end - selection!.start} chars
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={() => {
                if (!selection) return;
                addOp({ type: "insert", position: selection.start, text: "" });
                toast.success(`Queued: insert at ${selection.start}`);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Insert before
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={() => {
                if (!selection) return;
                addOp({ type: "insert", position: selection.end, text: "" });
                toast.success(`Queued: insert at ${selection.end}`);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Insert after
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={() => {
                if (!selection) return;
                addOp({
                  type: "replace",
                  start: selection.start,
                  end: selection.end,
                  text: "",
                });
                toast.success(
                  `Queued: replace [${selection.start},${selection.end})`,
                );
              }}
            >
              <Replace className="h-3.5 w-3.5" /> Replace selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={() => {
                if (!selection) return;
                addOp({
                  type: "delete",
                  start: selection.start,
                  end: selection.end,
                });
                toast.success(
                  `Queued: delete [${selection.start},${selection.end})`,
                );
              }}
            >
              <Scissors className="h-3.5 w-3.5" /> Delete selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                addOp({ type: "insert", position: caretPos, text: "" });
                toast.success(`Queued: blank insert at ${caretPos}`);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Blank op
            </Button>
          </div>
        </div>
        <pre
          ref={preRef}
          onMouseUp={handleMouseUp}
          onKeyUp={handleMouseUp}
          tabIndex={0}
          className="whitespace-pre-wrap font-mono text-xs leading-relaxed p-4 max-h-[420px] overflow-y-auto select-text focus-visible:outline-2 focus-visible:outline-ring/40"
        >
          {content || <em className="text-muted-foreground">empty</em>}
        </pre>
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">
              Pending operations ({ops.length})
            </h4>
            {appliedCount !== null && (
              <Badge variant="outline" className="text-xs">
                {appliedCount}/{ops.length} applied…
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={ops.length === 0}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Hide preview
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Preview result
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={ops.length === 0 || patch.isPending}
              onClick={() => setOps([])}
            >
              <Eraser className="h-3.5 w-3.5" /> Discard
            </Button>
          </div>
        </div>

        {ops.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Select text in the content viewer above, then queue operations.
            They're sent to the API one at a time when you apply them — order
            matters and offsets compose across ops.
          </p>
        ) : (
          <ul className="space-y-2">
            {ops.map((op, idx) => (
              <OpRow
                key={idx}
                idx={idx}
                op={op}
                content={content}
                onChange={(next) =>
                  setOps((prev) => prev.map((p, i) => (i === idx ? next : p)))
                }
                onRemove={() =>
                  setOps((prev) => prev.filter((_, i) => i !== idx))
                }
              />
            ))}
          </ul>
        )}

        {showPreview && ops.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Result after applying {ops.length} op(s)</Label>
            <pre className="rounded-md border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {previewText || (
                <em className="text-muted-foreground">empty</em>
              )}
            </pre>
            <p className="text-[11px] text-muted-foreground">
              {content.length.toLocaleString()} → {previewText.length.toLocaleString()} chars
              {previewText.length === content.length
                ? ""
                : ` (${previewText.length > content.length ? "+" : ""}${previewText.length - content.length})`}
            </p>
          </div>
        )}

        {ops.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={submitOps} disabled={patch.isPending}>
              <PlayCircle className="h-4 w-4" />
              {patch.isPending
                ? `Applying ${appliedCount ?? 0}/${ops.length}…`
                : `Apply ${ops.length} operation${ops.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="rounded-md border bg-muted/20 p-2 text-xs">
          <span className="text-muted-foreground mr-1">Selected:</span>
          <span className="font-mono">
            {selectedText.slice(0, 120)}
            {selectedText.length > 120 ? "…" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function OpRow({
  idx,
  op,
  content,
  onChange,
  onRemove,
}: {
  idx: number;
  op: Op;
  content: string;
  onChange: (next: Op) => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded border bg-muted/30 p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            #{idx + 1}
          </span>
          <Select
            value={op.type}
            onValueChange={(v) => {
              if (v === "insert")
                onChange({ type: "insert", position: 0, text: "" });
              else if (v === "delete")
                onChange({ type: "delete", start: 0, end: 1 });
              else
                onChange({ type: "replace", start: 0, end: 1, text: "" });
            }}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="insert">insert</SelectItem>
              <SelectItem value="delete">delete</SelectItem>
              <SelectItem value="replace">replace</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {op.type === "insert" ? (
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
          <Label className="text-xs">Position</Label>
          <Input
            type="number"
            min={0}
            value={op.position}
            onChange={(e) =>
              onChange({
                ...op,
                position: clampInt(
                  e.target.valueAsNumber,
                  0,
                  Number.MAX_SAFE_INTEGER,
                ),
              })
            }
          />
          <Label className="text-xs">Text</Label>
          <Textarea
            value={op.text}
            onChange={(e) => onChange({ ...op, text: e.target.value })}
          />
        </div>
      ) : op.type === "delete" ? (
        <>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <Label className="text-xs">Start</Label>
            <Input
              type="number"
              min={0}
              value={op.start}
              onChange={(e) =>
                onChange({
                  ...op,
                  start: clampInt(
                    e.target.valueAsNumber,
                    0,
                    Number.MAX_SAFE_INTEGER,
                  ),
                })
              }
            />
            <Label className="text-xs">End</Label>
            <Input
              type="number"
              min={0}
              value={op.end}
              onChange={(e) =>
                onChange({
                  ...op,
                  end: clampInt(
                    e.target.valueAsNumber,
                    0,
                    Number.MAX_SAFE_INTEGER,
                  ),
                })
              }
            />
          </div>
          <p className="text-[11px] text-muted-foreground line-through font-mono">
            {content.slice(op.start, op.end).slice(0, 80)}
            {content.slice(op.start, op.end).length > 80 ? "…" : ""}
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <Label className="text-xs">Start</Label>
            <Input
              type="number"
              min={0}
              value={op.start}
              onChange={(e) =>
                onChange({
                  ...op,
                  start: clampInt(
                    e.target.valueAsNumber,
                    0,
                    Number.MAX_SAFE_INTEGER,
                  ),
                })
              }
            />
            <Label className="text-xs">End</Label>
            <Input
              type="number"
              min={0}
              value={op.end}
              onChange={(e) =>
                onChange({
                  ...op,
                  end: clampInt(
                    e.target.valueAsNumber,
                    0,
                    Number.MAX_SAFE_INTEGER,
                  ),
                })
              }
            />
            <Label className="text-xs">Replacement</Label>
            <Textarea
              value={op.text}
              onChange={(e) => onChange({ ...op, text: e.target.value })}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            <span className="line-through">
              {content.slice(op.start, op.end).slice(0, 60)}
              {content.slice(op.start, op.end).length > 60 ? "…" : ""}
            </span>
          </p>
        </>
      )}
    </li>
  );
}
