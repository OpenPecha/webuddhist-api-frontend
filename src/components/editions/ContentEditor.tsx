"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  useEditionContent,
  usePatchEditionContent,
} from "@/lib/api/hooks/editions";
import { ApiError, type ContentOperation } from "@/lib/api/client";

type Op =
  | { type: "insert"; position: number; text: string }
  | { type: "delete"; start: number; end: number }
  | { type: "replace"; start: number; end: number; text: string };

export function ContentEditor({ editionId }: { editionId: string }) {
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(500);
  const [activeSpan, setActiveSpan] = useState<{
    start?: number;
    end?: number;
  }>({ start: 0, end: 500 });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useEditionContent(editionId, activeSpan);
  const patch = usePatchEditionContent(editionId);

  const [ops, setOps] = useState<Op[]>([]);

  const addOp = (type: Op["type"]) => {
    if (type === "insert")
      setOps([...ops, { type: "insert", position: 0, text: "" }]);
    else if (type === "delete")
      setOps([...ops, { type: "delete", start: 0, end: 1 }]);
    else setOps([...ops, { type: "replace", start: 0, end: 1, text: "" }]);
  };

  const submitOps = async () => {
    if (ops.length === 0) return;
    try {
      await patch.mutateAsync(ops as ContentOperation[]);
      toast.success(`${ops.length} operation(s) applied`);
      setOps([]);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to apply operations",
      );
    }
  };

  const contentStr =
    typeof data === "string"
      ? data
      : data == null
        ? ""
        : JSON.stringify(data, null, 2);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <p className="text-sm font-medium">Span navigator</p>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-xs">Start</Label>
            <Input
              type="number"
              min={0}
              value={start}
              onChange={(e) => setStart(parseInt(e.target.value) || 0)}
              className="w-32 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">End</Label>
            <Input
              type="number"
              min={1}
              value={end}
              onChange={(e) => setEnd(parseInt(e.target.value) || 1)}
              className="w-32 mt-1"
            />
          </div>
          <Button
            onClick={() => setActiveSpan({ start, end })}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Load span
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card p-3">
        <p className="text-xs text-muted-foreground mb-2">
          Content {activeSpan.start}–{activeSpan.end}
        </p>
        {isError ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs max-h-[400px] overflow-y-auto">
            {contentStr || <em className="text-muted-foreground">empty</em>}
          </pre>
        )}
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Pending operations ({ops.length})
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addOp("insert")}
            >
              <Plus className="h-3.5 w-3.5" /> Insert
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addOp("replace")}
            >
              <Plus className="h-3.5 w-3.5" /> Replace
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addOp("delete")}
            >
              <Plus className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>

        {ops.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending operations. Operations are applied in order when you
            submit.
          </p>
        ) : (
          <ul className="space-y-2">
            {ops.map((op, idx) => (
              <li
                key={idx}
                className="rounded border p-2 bg-muted/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <Select
                      value={op.type}
                      onValueChange={(v) => {
                        const next = [...ops];
                        if (v === "insert")
                          next[idx] = { type: "insert", position: 0, text: "" };
                        else if (v === "delete")
                          next[idx] = { type: "delete", start: 0, end: 1 };
                        else
                          next[idx] = {
                            type: "replace",
                            start: 0,
                            end: 1,
                            text: "",
                          };
                        setOps(next);
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setOps(ops.filter((_, i) => i !== idx))}
                  >
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
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = {
                          ...op,
                          position: parseInt(e.target.value) || 0,
                        };
                        setOps(next);
                      }}
                    />
                    <Label className="text-xs">Text</Label>
                    <Textarea
                      value={op.text}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = { ...op, text: e.target.value };
                        setOps(next);
                      }}
                    />
                  </div>
                ) : op.type === "delete" ? (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <Label className="text-xs">Start</Label>
                    <Input
                      type="number"
                      min={0}
                      value={op.start}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = {
                          ...op,
                          start: parseInt(e.target.value) || 0,
                        };
                        setOps(next);
                      }}
                    />
                    <Label className="text-xs">End</Label>
                    <Input
                      type="number"
                      min={1}
                      value={op.end}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = {
                          ...op,
                          end: parseInt(e.target.value) || 1,
                        };
                        setOps(next);
                      }}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <Label className="text-xs">Start</Label>
                    <Input
                      type="number"
                      min={0}
                      value={op.start}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = {
                          ...op,
                          start: parseInt(e.target.value) || 0,
                        };
                        setOps(next);
                      }}
                    />
                    <Label className="text-xs">End</Label>
                    <Input
                      type="number"
                      min={1}
                      value={op.end}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = {
                          ...op,
                          end: parseInt(e.target.value) || 1,
                        };
                        setOps(next);
                      }}
                    />
                    <Label className="text-xs">Text</Label>
                    <Textarea
                      value={op.text}
                      onChange={(e) => {
                        const next = [...ops];
                        next[idx] = { ...op, text: e.target.value };
                        setOps(next);
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {ops.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={submitOps} disabled={patch.isPending}>
              {patch.isPending ? "Applying…" : `Apply ${ops.length} operation(s)`}
            </Button>
            <Button variant="ghost" onClick={() => setOps([])}>
              Discard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
