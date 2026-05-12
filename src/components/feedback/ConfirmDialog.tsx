"use client";

import { useState } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "destructive" | "warning" | "default";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  /**
   * Extra body content rendered inside the warning area, e.g. a summary
   * of the changes that are about to be submitted.
   */
  children?: React.ReactNode;
  onConfirm: () => void | Promise<unknown>;
};

const TONE: Record<
  Variant,
  {
    ring: string;
    bg: string;
    text: string;
    icon: typeof AlertTriangle;
    iconClass: string;
  }
> = {
  destructive: {
    ring: "ring-destructive/20",
    bg: "bg-destructive/8",
    text: "text-destructive",
    icon: AlertTriangle,
    iconClass: "text-destructive",
  },
  warning: {
    ring: "ring-primary/20",
    bg: "bg-primary/8",
    text: "text-primary",
    icon: Pencil,
    iconClass: "text-primary",
  },
  default: {
    ring: "ring-border",
    bg: "bg-muted",
    text: "text-foreground",
    icon: AlertTriangle,
    iconClass: "text-muted-foreground",
  },
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  children,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tone = TONE[variant];
  const Icon = tone.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="space-y-3">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 ring-1",
              tone.bg,
              tone.ring,
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card",
                tone.text,
              )}
            >
              <Icon className={cn("h-4 w-4", tone.iconClass)} />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="font-heading text-base font-medium tracking-tight">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        {children && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {children}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={async () => {
              try {
                setBusy(true);
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
