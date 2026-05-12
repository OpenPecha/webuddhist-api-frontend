"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { LocalizedStringField } from "@/components/forms/LocalizedStringField";
import {
  useCreateTag,
  useDeleteTag,
  useTags,
} from "@/lib/api/hooks/tags";
import { ApiError, type LocalizedString } from "@/lib/api/client";
import { pickLocalized } from "@/lib/utils/localized-string";

export default function TagsPage() {
  const { data, isLoading, isError, error } = useTags();
  const del = useDeleteTag();

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Reusable tags applied to texts and segments."
        actions={<NewTag />}
      />
      {isError && <ErrorBlock error={error} />}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">ID</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              (data ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {pickLocalized(t.title)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.description ? pickLocalized(t.description) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {t.id}
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title="Delete tag?"
                      variant="destructive"
                      confirmLabel="Delete"
                      onConfirm={async () => {
                        try {
                          await del.mutateAsync(t.id);
                          toast.success("Deleted");
                        } catch (err) {
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : "Failed",
                          );
                          throw err;
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewTag() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<LocalizedString | null>({ en: "" });
  const [description, setDescription] = useState<LocalizedString | null>(null);
  const create = useCreateTag();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <LocalizedStringField
            label="Title"
            required
            value={title}
            onChange={setTitle}
          />
          <LocalizedStringField
            label="Description"
            value={description}
            onChange={setDescription}
            multiline
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!title) return;
              try {
                await create.mutateAsync({
                  title,
                  description: description ?? undefined,
                });
                toast.success("Tag created");
                setOpen(false);
                setTitle({ en: "" });
                setDescription(null);
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed",
                );
              }
            }}
            disabled={create.isPending}
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
