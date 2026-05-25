"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ApiError } from "@/lib/api/client";
import type { AnnotationKind } from "./AnnotationListPanel";

type Props = {
  kind: AnnotationKind;
  title: string;
  items: Array<{ id: string }>;
  isLoading: boolean;
  onDelete: (id: string) => Promise<unknown>;
  addButton?: React.ReactNode;
  emptyHint?: string;
};

export function AnnotationItemsList({
  kind,
  title,
  items,
  isLoading,
  onDelete,
  addButton,
  emptyHint,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {title} ({items.length})
        </h3>
        {addButton}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet.`}
          description={emptyHint ?? `Add the first one for this edition.`}
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
    </div>
  );
}
