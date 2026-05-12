"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { LocalizedStringField } from "@/components/forms/LocalizedStringField";
import { CategoryCombobox } from "@/components/forms/CategoryCombobox";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/lib/api/hooks/categories";
import {
  ApiError,
  type CategoryOutput,
  type LocalizedString,
} from "@/lib/api/client";
import { pickLocalized } from "@/lib/utils/localized-string";

export default function CategoriesPage() {
  const { data, isLoading, isError, error } = useCategories(null);

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Hierarchical taxonomy used to classify texts."
        actions={<NewCategoryButton />}
      />
      {isError && <ErrorBlock error={error} />}
      <div className="rounded-md border bg-card p-3">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ul className="space-y-1">
            {(data ?? []).map((c) => (
              <CategoryNode key={c.id} category={c} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryNode({
  category,
  depth,
}: {
  category: CategoryOutput;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = (category.children ?? []).length > 0;
  const children = useCategories(open ? category.id : null);
  const del = useDeleteCategory();

  return (
    <li>
      <div
        className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            className="p-0.5 disabled:opacity-30"
            onClick={() => setOpen((v) => !v)}
            disabled={!hasChildren}
            aria-label="Toggle children"
          >
            {hasChildren ? (
              open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="inline-block w-4" />
            )}
          </button>
          <Link
            href={`/categories/${category.id}`}
            className="text-sm hover:underline truncate"
          >
            {pickLocalized(category.title)}
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            {category.id}
          </span>
        </div>
        <ConfirmDialog
          trigger={
            <Button size="icon" variant="ghost">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
          title="Delete category?"
          description="Removes the category. Children will become root-level orphans."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              await del.mutateAsync(category.id);
              toast.success("Deleted");
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "Failed");
              throw err;
            }
          }}
        />
      </div>
      {open && (
        <ul className="space-y-1">
          {(children.data ?? []).map((c) => (
            <CategoryNode key={c.id} category={c} depth={depth + 1} />
          ))}
          {children.isLoading && (
            <li className="pl-8 text-xs text-muted-foreground">Loading…</li>
          )}
        </ul>
      )}
    </li>
  );
}

function NewCategoryButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<LocalizedString | null>({ en: "" });
  const [parentId, setParentId] = useState<string | null>(null);
  const create = useCreateCategory();

  const submit = async () => {
    if (!title) return;
    try {
      await create.mutateAsync({
        title,
        parent_id: parentId ?? undefined,
      });
      toast.success("Category created");
      setOpen(false);
      setTitle({ en: "" });
      setParentId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <LocalizedStringField
            label="Title"
            required
            value={title}
            onChange={setTitle}
          />
          <div>
            <Label>Parent (optional)</Label>
            <div className="mt-2">
              <CategoryCombobox
                value={parentId}
                onChange={setParentId}
                placeholder="No parent (root)"
                allowClear
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
