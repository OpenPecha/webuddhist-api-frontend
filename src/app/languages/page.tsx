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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  useCreateLanguage,
  useDeleteLanguage,
  useLanguages,
} from "@/lib/api/hooks/languages";
import { ApiError } from "@/lib/api/client";

export default function LanguagesPage() {
  const { data, isLoading, isError, error } = useLanguages();
  const del = useDeleteLanguage();

  return (
    <div>
      <PageHeader
        title="Languages"
        description="Language codes used throughout the database."
        actions={<NewLanguage />}
      />
      {isError && <ErrorBlock error={error} />}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              (data ?? []).map((l) => (
                <TableRow key={l.code}>
                  <TableCell className="font-mono text-sm">{l.code}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title={`Delete language "${l.code}"?`}
                      variant="destructive"
                      confirmLabel="Delete"
                      onConfirm={async () => {
                        try {
                          await del.mutateAsync(l.code);
                          toast.success("Deleted");
                        } catch (err) {
                          toast.error(
                            err instanceof ApiError ? err.message : "Failed",
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

function NewLanguage() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const create = useCreateLanguage();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New language
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New language</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Code</Label>
            <Input
              className="mt-2 font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. bo"
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              className="mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tibetan"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!code || !name) return;
              try {
                await create.mutateAsync({ code, name });
                toast.success("Language created");
                setOpen(false);
                setCode("");
                setName("");
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
