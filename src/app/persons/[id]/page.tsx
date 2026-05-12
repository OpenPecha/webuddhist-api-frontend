"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { LocalizedStringField } from "@/components/forms/LocalizedStringField";
import { LocalizedStringList } from "@/components/forms/LocalizedStringList";
import {
  useDeletePerson,
  usePatchPerson,
  usePerson,
} from "@/lib/api/hooks/persons";
import { ApiError, type LocalizedString } from "@/lib/api/client";
import { pickLocalized } from "@/lib/utils/localized-string";

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PersonInner id={id} />;
}

function PersonInner({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = usePerson(id);
  const patch = usePatchPerson(id);
  const del = useDeletePerson();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState<LocalizedString | null>(null);
  const [altNames, setAltNames] = useState<LocalizedString[] | null>(null);
  const [bdrc, setBdrc] = useState("");
  const [wiki, setWiki] = useState("");
  const [hydrated, setHydrated] = useState(false);

  if (data && !hydrated) {
    setName(data.name);
    setAltNames(data.alt_names ?? null);
    setBdrc(data.bdrc ?? "");
    setWiki(data.wiki ?? "");
    setHydrated(true);
  }

  if (isLoading || !hydrated) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  const save = async () => {
    try {
      await patch.mutateAsync({
        name: name ?? undefined,
        alt_names: altNames ?? undefined,
        bdrc: bdrc || undefined,
        wiki: wiki || undefined,
      });
      toast.success("Saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pickLocalized(data.name)}
        description={`ID: ${data.id}`}
        actions={
          <>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            <ConfirmDialog
              trigger={
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              }
              title="Delete this person?"
              description="Removes the person record."
              variant="destructive"
              confirmLabel="Delete"
              onConfirm={async () => {
                try {
                  await del.mutateAsync(id);
                  toast.success("Deleted");
                  router.push("/persons");
                } catch (err) {
                  toast.error(
                    err instanceof ApiError ? err.message : "Failed",
                  );
                  throw err;
                }
              }}
            />
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit person" : "Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <LocalizedStringField label="Name" value={name} onChange={setName} />
              <div>
                <Label>Alternative names</Label>
                <div className="mt-2">
                  <LocalizedStringList
                    value={altNames}
                    onChange={setAltNames}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>BDRC</Label>
                  <Input
                    className="mt-2"
                    value={bdrc}
                    onChange={(e) => setBdrc(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Wikidata</Label>
                  <Input
                    className="mt-2"
                    value={wiki}
                    onChange={(e) => setWiki(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 border-t pt-4">
                <ConfirmDialog
                  trigger={
                    <Button disabled={patch.isPending}>
                      {patch.isPending ? "Saving…" : "Save"}
                    </Button>
                  }
                  variant="warning"
                  title="Save changes to this person?"
                  description="You're about to update a record in the database. Other texts and contributions may reference this person — please double-check the changes before continuing."
                  confirmLabel="Yes, save changes"
                  cancelLabel="Keep editing"
                  onConfirm={save}
                >
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>
                      <span className="text-foreground">BDRC:</span>{" "}
                      {bdrc || "—"}
                    </li>
                    <li>
                      <span className="text-foreground">Wikidata:</span>{" "}
                      {wiki || "—"}
                    </li>
                    <li>
                      <span className="text-foreground">Alt names:</span>{" "}
                      {altNames?.length ?? 0}
                    </li>
                  </ul>
                </ConfirmDialog>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                {Object.entries(data.name).map(([code, val]) => (
                  <p key={code}>
                    <span className="text-xs font-mono text-muted-foreground mr-2">
                      {code}
                    </span>
                    {val}
                  </p>
                ))}
              </div>
              {data.alt_names && data.alt_names.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Alternative names
                  </p>
                  {data.alt_names.map((alt, i) => (
                    <p key={i}>{pickLocalized(alt)}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">BDRC</span>
                <span>{data.bdrc ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wikidata</span>
                <span>{data.wiki ?? "—"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
