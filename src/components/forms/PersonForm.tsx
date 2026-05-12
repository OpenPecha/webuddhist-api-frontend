"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedStringField } from "./LocalizedStringField";
import { LocalizedStringList } from "./LocalizedStringList";
import type { LocalizedString, PersonInput } from "@/lib/api/client";

type Props = {
  initial?: Partial<PersonInput>;
  onSubmit: (body: PersonInput) => Promise<unknown>;
  submitLabel?: string;
};

export function PersonForm({
  initial,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  const [name, setName] = useState<LocalizedString | null>(
    initial?.name ?? { en: "" },
  );
  const [altNames, setAltNames] = useState<LocalizedString[] | null>(
    initial?.alt_names ?? null,
  );
  const [bdrc, setBdrc] = useState(initial?.bdrc ?? "");
  const [wiki, setWiki] = useState(initial?.wiki ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    try {
      const body: PersonInput = {
        name,
        alt_names: altNames ?? undefined,
        bdrc: bdrc || undefined,
        wiki: wiki || undefined,
      };
      await onSubmit(body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl">
      <LocalizedStringField label="Name" required value={name} onChange={setName} />
      <div>
        <Label>Alternative names</Label>
        <div className="mt-2">
          <LocalizedStringList value={altNames} onChange={setAltNames} />
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
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
