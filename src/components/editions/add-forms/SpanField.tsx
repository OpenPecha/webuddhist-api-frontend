"use client";

import { useRef } from "react";
import { MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SpanValue = { start: number; end: number };

type Props = {
  value: SpanValue;
  onChange: (v: SpanValue) => void;
  /** Optional content to render above the inputs with selection capture. */
  content?: string;
  /** Max height for the content viewer; default 220px. */
  contentMaxHeight?: number;
};

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function SpanField({
  value,
  onChange,
  content,
  contentMaxHeight = 220,
}: Props) {
  const preRef = useRef<HTMLPreElement | null>(null);

  function captureSelection() {
    const pre = preRef.current;
    if (!pre || !content) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!pre.contains(range.startContainer) || !pre.contains(range.endContainer))
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
      onChange({ start, end });
    }
  }

  return (
    <div className="space-y-2">
      {content !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Edition content (select text to capture)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={captureSelection}
            >
              <MousePointerClick className="h-3.5 w-3.5" /> Use selection
            </Button>
          </div>
          <pre
            ref={preRef}
            className="rounded-md border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed overflow-y-auto"
            style={{ maxHeight: contentMaxHeight }}
          >
            {content || "(empty content)"}
          </pre>
          <p className="text-[11px] text-muted-foreground">
            Total: {content.length.toLocaleString()} characters. Current span:
            [{value.start}, {value.end}) — {Math.max(0, value.end - value.start)}{" "}
            chars.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start</Label>
          <Input
            type="number"
            min={0}
            value={value.start}
            onChange={(e) =>
              onChange({
                ...value,
                start: clampInt(
                  e.target.valueAsNumber,
                  0,
                  content?.length ?? Number.MAX_SAFE_INTEGER,
                ),
              })
            }
          />
        </div>
        <div>
          <Label className="text-xs">End</Label>
          <Input
            type="number"
            min={0}
            value={value.end}
            onChange={(e) =>
              onChange({
                ...value,
                end: clampInt(
                  e.target.valueAsNumber,
                  0,
                  content?.length ?? Number.MAX_SAFE_INTEGER,
                ),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
