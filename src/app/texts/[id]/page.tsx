"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  useDeleteText,
  useText,
  useTextEditions,
} from "@/lib/api/hooks/texts";
import { localizedSummary, pickLocalized } from "@/lib/utils/localized-string";
import { ApiError } from "@/lib/api/client";
import { RelatedTextLink } from "@/components/texts/RelatedTextLink";
import { TextTagsCard } from "@/components/texts/TextTagsCard";
import { EditionWorkspace } from "@/components/editions/EditionWorkspace";

export default function TextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, error } = useText(id);
  const { data: editions, refetch: refetchEditions } = useTextEditions(id);
  const del = useDeleteText();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={pickLocalized(data.title)}
        description={`ID: ${data.id} · ${data.language}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/texts/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              }
              title="Delete this text?"
              description="This will permanently remove the text. Editions and incoming relationships must be removed first."
              variant="destructive"
              confirmLabel="Delete"
              onConfirm={async () => {
                try {
                  await del.mutateAsync(id);
                  toast.success("Text deleted");
                  router.push("/texts");
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
          </>
        }
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Metadata</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Field label="License" value={data.license} />
              <Field label="BDRC" value={data.bdrc ?? "—"} />
              <Field label="Wikidata" value={data.wiki ?? "—"} />
              <Field label="Date" value={data.date ?? "—"} />
              <Field
                label="Category"
                value={
                  data.category_id ? (
                    <Link
                      className="text-primary hover:underline"
                      href={`/categories/${data.category_id}`}
                    >
                      {data.category_id}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Commentary of"
                value={
                  data.commentary_of ? (
                    <Link
                      className="text-primary hover:underline"
                      href={`/texts/${data.commentary_of}`}
                    >
                      {data.commentary_of}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Translation of"
                value={
                  data.translation_of ? (
                    <Link
                      className="text-primary hover:underline"
                      href={`/texts/${data.translation_of}`}
                    >
                      {data.translation_of}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Titles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                {Object.entries(data.title).map(([code, val]) => (
                  <p key={code}>
                    <span className="text-xs font-mono text-muted-foreground mr-2">
                      {code}
                    </span>
                    {val}
                  </p>
                ))}
              </div>
              {data.alt_titles && data.alt_titles.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Alternative titles
                  </p>
                  {data.alt_titles.map((alt, i) => (
                    <p key={i}>{localizedSummary(alt)}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.contributions.map((c, i) => {
                    const isAi = "ai_id" in c;
                    return (
                      <li key={i} className="flex items-center justify-between">
                        <span>
                          <Badge variant="secondary" className="mr-2">
                            {c.role}
                          </Badge>
                          {isAi
                            ? `AI: ${c.ai_id}`
                            : c.person_name
                              ? pickLocalized(c.person_name)
                              : (c.person_id ?? c.person_bdrc_id ?? "—")}
                        </span>
                        {!isAi && c.person_id && (
                          <Link
                            className="text-xs text-primary hover:underline"
                            href={`/persons/${c.person_id}`}
                          >
                            view →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <TextTagsCard textId={id} tagIds={data.tag_ids ?? []} />
        </div>
      </section>

      {((data.commentaries ?? []).length > 0 ||
        (data.translations ?? []).length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Related texts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Commentaries ({(data.commentaries ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {(data.commentaries ?? []).map((cid) => (
                    <li key={cid}>
                      <RelatedTextLink id={cid} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Translations ({(data.translations ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {(data.translations ?? []).map((tid) => (
                    <li key={tid}>
                      <RelatedTextLink id={tid} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Editions ({(editions ?? []).length})
          </h2>
          <Button asChild size="sm">
            <Link href={`/texts/${id}/editions/new`}>
              <Plus className="h-4 w-4" /> New edition
            </Link>
          </Button>
        </div>

        {(editions ?? []).length === 0 ? (
          <EmptyState
            title="No editions yet."
            description="Create the first edition for this text."
          />
        ) : (
          <div className="space-y-8">
            {(editions ?? []).map((e, idx) => (
              <section key={e.id} className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Edition {idx + 1}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Badge variant="outline">{e.type}</Badge>
                    <span className="font-medium text-sm">
                      {e.incipit_title
                        ? localizedSummary(e.incipit_title)
                        : `Edition ${e.id.slice(0, 8)}...`}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {e.id}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <EditionWorkspace
                    editionId={e.id}
                    onDeleted={() => {
                      void refetchEditions();
                    }}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
