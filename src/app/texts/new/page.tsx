"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TextForm } from "@/components/forms/TextForm";
import { useCreateText } from "@/lib/api/hooks/texts";
import { ApiError } from "@/lib/api/client";

export default function NewTextPage() {
  const router = useRouter();
  const create = useCreateText();

  return (
    <div>
      <PageHeader
        title="New text"
        description="Create a new Work-level text record."
      />
      <TextForm
        submitLabel="Create text"
        onSubmit={async (body) => {
          try {
            const created = await create.mutateAsync(body);
            toast.success("Text created");
            router.push(`/texts/${created.id}`);
          } catch (err) {
            const msg =
              err instanceof ApiError ? err.message : "Failed to create text";
            toast.error(msg);
            throw err;
          }
        }}
      />
    </div>
  );
}
