"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import {
  useCategories,
  useCategory,
  useDeleteCategory,
} from "@/lib/api/hooks/categories";
import { ApiError } from "@/lib/api/client";
import { pickLocalized } from "@/lib/utils/localized-string";

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, error } = useCategory(id);
  const children = useCategories(id);
  const del = useDeleteCategory();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pickLocalized(data.title)}
        description={`Category ${data.id}`}
        actions={
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
            title="Delete category?"
            variant="destructive"
            confirmLabel="Delete"
            onConfirm={async () => {
              try {
                await del.mutateAsync(id);
                toast.success("Deleted");
                router.push("/categories");
              } catch (err) {
                toast.error(
                  err instanceof ApiError ? err.message : "Failed",
                );
                throw err;
              }
            }}
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Title</p>
            {Object.entries(data.title).map(([code, v]) => (
              <p key={code}>
                <span className="text-xs font-mono text-muted-foreground mr-2">
                  {code}
                </span>
                {v}
              </p>
            ))}
          </div>
          {data.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              {Object.entries(data.description).map(([code, v]) => (
                <p key={code}>
                  <span className="text-xs font-mono text-muted-foreground mr-2">
                    {code}
                  </span>
                  {v}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Parent</span>
            {data.parent_id ? (
              <Link
                className="text-primary hover:underline"
                href={`/categories/${data.parent_id}`}
              >
                {data.parent_id}
              </Link>
            ) : (
              <span>—</span>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Children ({children.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {(children.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No children.</p>
          ) : (
            <ul className="divide-y">
              {(children.data ?? []).map((c) => (
                <li key={c.id} className="py-2">
                  <Link
                    href={`/categories/${c.id}`}
                    className="hover:underline"
                  >
                    {pickLocalized(c.title)}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {c.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
