"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import {
  useCreateApplication,
  useDeleteApplication,
} from "@/lib/api/hooks/applications";
import {
  ApiError,
  type ApplicationResponse,
  getApplicationId,
  setApplicationId,
} from "@/lib/api/client";

const STORAGE_KEY = "openpecha:applications";

function readSaved(): ApplicationResponse[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeSaved(items: ApplicationResponse[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function ApplicationsPage() {
  const [items, setItems] = useState<ApplicationResponse[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setItems(readSaved());
    setActiveId(getApplicationId());
  }, []);

  const create = useCreateApplication();
  const del = useDeleteApplication();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="The API uses an X-Application header to scope categories, tags, and segments. Create one and select it as active."
        actions={
          <NewApp
            onCreated={(app) => {
              const next = [...items, app];
              setItems(next);
              writeSaved(next);
            }}
            create={create}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Active application</CardTitle>
        </CardHeader>
        <CardContent>
          {activeId ? (
            <p className="text-sm">
              Currently sending{" "}
              <span className="font-mono">X-Application: {activeId}</span> on
              all requests.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No application selected. Server will fall back to the
              OPENPECHA_DEFAULT_APPLICATION env var if set.
            </p>
          )}
          {activeId && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setApplicationId(null);
                setActiveId(null);
                toast.success("Cleared active application");
              }}
            >
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved applications ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No applications saved locally yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((app) => (
                  <TableRow
                    key={app.id}
                    className={
                      app.id === activeId ? "bg-accent/30" : undefined
                    }
                  >
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {app.id}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant={app.id === activeId ? "default" : "outline"}
                        onClick={() => {
                          setApplicationId(app.id);
                          setActiveId(app.id);
                          toast.success(`Active: ${app.name}`);
                        }}
                      >
                        {app.id === activeId ? "Active" : "Use"}
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                        title={`Delete application "${app.name}"?`}
                        description="Removes the application from the server and from this device."
                        variant="destructive"
                        confirmLabel="Delete"
                        onConfirm={async () => {
                          try {
                            await del.mutateAsync(app.id);
                            const next = items.filter((i) => i.id !== app.id);
                            setItems(next);
                            writeSaved(next);
                            if (app.id === activeId) {
                              setApplicationId(null);
                              setActiveId(null);
                            }
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewApp({
  onCreated,
  create,
}: {
  onCreated: (app: ApplicationResponse) => void;
  create: ReturnType<typeof useCreateApplication>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New application
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={create.isPending || !name}
            onClick={async () => {
              try {
                const created = await create.mutateAsync({ name });
                onCreated(created);
                toast.success("Application created");
                setOpen(false);
                setName("");
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed",
                );
              }
            }}
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
