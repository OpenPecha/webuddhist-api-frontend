"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { EditionWorkspace } from "@/components/editions/EditionWorkspace";
import { useEdition } from "@/lib/api/hooks/editions";
import { localizedSummary } from "@/lib/utils/localized-string";

export default function EditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, error } = useEdition(id);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          data.incipit_title
            ? localizedSummary(data.incipit_title)
            : `Edition ${data.id.slice(0, 8)}…`
        }
        description={
          <span>
            <Link
              href={`/texts/${data.text_id}`}
              className="text-primary hover:underline"
            >
              ← back to text
            </Link>
            <span className="ml-3">{data.id}</span>
          </span>
        }
      />

      <EditionWorkspace
        editionId={id}
        showOpenLink={false}
        onDeleted={() => router.push(`/texts/${data.text_id}`)}
      />
    </div>
  );
}
