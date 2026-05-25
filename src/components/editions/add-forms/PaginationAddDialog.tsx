"use client";

import { useRef, useState } from "react";
import { MousePointerClick, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, type PaginationInput } from "@/lib/api/client";

type PageDraft = { reference: string; start: number; end: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onAdd: (body: PaginationInput) => Promise<unknown>;
};

const JSON_EXAMPLE = JSON.stringify(
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

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function PaginationAddDialog({
  open,
  onOpenChange,
  content,
  onAdd,
}: Props) {
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [volumeIndex, setVolumeIndex] = useState<string>("1");
  const [pages, setPages] = useState<PageDraft[]>([
    { reference: "1a", start: 0, end: 50 },
  ]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [json, setJson] = useState(JSON_EXAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  const reset = () => {
    setMode("builder");
    setVolumeIndex("1");
    setPages([{ reference: "1a", start: 0, end: 50 }]);
    setActivePageIdx(0);
    setJson(JSON_EXAMPLE);
    setError(null);
  };

  const captureSelection = () => {
    const pre = preRef.current;
    if (!pre || !content) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (
      !pre.contains(range.startContainer) ||
      !pre.contains(range.endContainer)
    )
      return;
    const before = range.cloneRange();
    before.selectNodeContents(pre);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const within = range.cloneRange();
    within.selectNodeContents(pre);
    within.setEnd(range.endContainer, range.endOffset);
    const end = within.toString().length;
    if (end > start) {
      setPages((prev) =>
        prev.map((p, i) => (i === activePageIdx ? { ...p, start, end } : p)),
      );
    }
  };

  const builderValid =
    pages.length > 0 &&
    pages.every((p) => p.reference.trim().length > 0 && p.end > p.start);
  const canSubmit = mode === "json" ? json.trim().length > 0 : builderValid;

  const buildBody = (): PaginationInput | null => {
    if (mode === "json") {
      try {
        return JSON.parse(json) as PaginationInput;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid JSON");
        return null;
      }
    }
    if (pages.length === 0) {
      setError("At least one page is required");
      return null;
    }
    for (const p of pages) {
      if (!p.reference.trim()) {
        setError("Every page needs a reference");
        return null;
      }
      if (p.end <= p.start) {
        setError(`Page "${p.reference}": end must be greater than start`);
        return null;
      }
    }
    const idx = parseInt(volumeIndex, 10);
    return {
      volumes: [
        {
          ...(Number.isFinite(idx) && idx >= 1 ? { index: idx } : {}),
          pages: pages.map((p) => ({
            reference: p.reference,
            lines: [{ start: p.start, end: p.end }],
          })),
        },
      ],
    } as PaginationInput;
  };

  const submit = async () => {
    setError(null);
    const body = buildBody();
    if (!body) return;
    setBusy(true);
    try {
      await onAdd(body);
      toast.success("Pagination added");
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add pagination</DialogTitle>
          <DialogDescription>
            Split the edition into pages (and optionally volumes). The builder
            creates one volume — switch to JSON for multi-volume layouts or
            multi-line pages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-xs">
          <Button
            size="sm"
            variant={mode === "builder" ? "default" : "outline"}
            onClick={() => setMode("builder")}
          >
            Builder
          </Button>
          <Button
            size="sm"
            variant={mode === "json" ? "default" : "outline"}
            onClick={() => {
              if (mode !== "json") {
                const idx = parseInt(volumeIndex, 10);
                const snapshot = {
                  volumes: [
                    {
                      ...(Number.isFinite(idx) && idx >= 1
                        ? { index: idx }
                        : {}),
                      pages: pages.map((p) => ({
                        reference: p.reference,
                        lines: [{ start: p.start, end: p.end }],
                      })),
                    },
                  ],
                };
                setJson(JSON.stringify(snapshot, null, 2));
              }
              setMode("json");
            }}
          >
            JSON
          </Button>
        </div>

        {mode === "builder" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
              <Label className="text-xs">Volume index (optional)</Label>
              <Input
                type="number"
                min={1}
                value={volumeIndex}
                onChange={(e) => setVolumeIndex(e.target.value)}
                className="w-24"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Edition content — click a page row below, then select text
                  here and click "Use selection"
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={captureSelection}
                >
                  <MousePointerClick className="h-3.5 w-3.5" /> Use selection for
                  page #{activePageIdx + 1}
                </Button>
              </div>
              <pre
                ref={preRef}
                className="rounded-md border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed overflow-y-auto max-h-[200px]"
              >
                {content || "(empty content)"}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                Total: {content.length.toLocaleString()} characters.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pages ({pages.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPages((prev) => {
                      const last = prev[prev.length - 1];
                      const nextStart = last ? last.end : 0;
                      const next = [
                        ...prev,
                        {
                          reference: `${prev.length + 1}a`,
                          start: nextStart,
                          end: Math.min(nextStart + 50, content.length || nextStart + 50),
                        },
                      ];
                      setActivePageIdx(next.length - 1);
                      return next;
                    });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add page
                </Button>
              </div>
              <ul className="space-y-2">
                {pages.map((p, i) => (
                  <li
                    key={i}
                    className={`rounded border p-2 grid grid-cols-[24px_120px_1fr_1fr_32px] gap-2 items-center cursor-pointer ${
                      i === activePageIdx
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/20"
                    }`}
                    onClick={() => setActivePageIdx(i)}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground">
                      #{i + 1}
                    </span>
                    <Input
                      placeholder="ref (e.g. 1a)"
                      value={p.reference}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((pp, idx) =>
                            idx === i ? { ...pp, reference: e.target.value } : pp,
                          ),
                        )
                      }
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={p.start}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((pp, idx) =>
                            idx === i
                              ? {
                                  ...pp,
                                  start: clampInt(
                                    e.target.valueAsNumber,
                                    0,
                                    content.length || Number.MAX_SAFE_INTEGER,
                                  ),
                                }
                              : pp,
                          ),
                        )
                      }
                      className="h-8 text-sm"
                      placeholder="start"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={p.end}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((pp, idx) =>
                            idx === i
                              ? {
                                  ...pp,
                                  end: clampInt(
                                    e.target.valueAsNumber,
                                    0,
                                    content.length || Number.MAX_SAFE_INTEGER,
                                  ),
                                }
                              : pp,
                          ),
                        )
                      }
                      className="h-8 text-sm"
                      placeholder="end"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPages((prev) => prev.filter((_, idx) => idx !== i));
                        setActivePageIdx((cur) =>
                          Math.max(0, Math.min(cur, pages.length - 2)),
                        );
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>JSON payload</Label>
            <Textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              className="font-mono text-xs min-h-[260px]"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Shape: {"{ volumes: [{ index?, pages: [{ reference, lines: [{ start, end }] }] }] }"}
            </p>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !canSubmit}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
