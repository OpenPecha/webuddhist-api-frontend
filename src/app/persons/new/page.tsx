"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PersonForm } from "@/components/forms/PersonForm";
import { useCreatePerson } from "@/lib/api/hooks/persons";
import { ApiError } from "@/lib/api/client";

export default function NewPersonPage() {
  const router = useRouter();
  const create = useCreatePerson();
  return (
    <div>
      <PageHeader title="New person" />
      <PersonForm
        submitLabel="Create person"
        onSubmit={async (body) => {
          try {
            const created = await create.mutateAsync(body);
            toast.success("Person created");
            router.push(`/persons/${created.id}`);
          } catch (err) {
            toast.error(
              err instanceof ApiError ? err.message : "Failed to create",
            );
            throw err;
          }
        }}
      />
    </div>
  );
}
