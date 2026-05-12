"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { LocalizedStringField } from "@/components/forms/LocalizedStringField";
import { LocalizedStringList } from "@/components/forms/LocalizedStringList";
import { useCreateTextEdition } from "@/lib/api/hooks/texts";
import {
  ApiError,
  type EditionType,
  type LocalizedString,
} from "@/lib/api/client";

const TYPES: EditionType[] = ["diplomatic", "critical", "collated"];

export default function NewEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const create = useCreateTextEdition(id);

  const [type, setType] = useState<EditionType>("diplomatic");
  const [source, setSource] = useState("");
  const [colophon, setColophon] = useState("");
  const [bdrc, setBdrc] = useState("");
  const [wiki, setWiki] = useState("");
  const [incipit, setIncipit] = useState<LocalizedString | null>(null);
  const [altIncipits, setAltIncipits] = useState<LocalizedString[] | null>(
    null,
  );
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const created = await create.mutateAsync({
        metadata: {
          type,
          source: source || undefined,
          colophon: colophon || undefined,
          bdrc: bdrc || undefined,
          wiki: wiki || undefined,
          incipit_title: incipit ?? undefined,
          alt_incipit_titles: altIncipits ?? undefined,
        },
        content,
      });
      toast.success("Edition created");
      router.push(`/editions/${created.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create edition",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="New edition"
        description={`Adding an edition to text ${id}`}
      />
      <form onSubmit={submit} className="space-y-6 max-w-2xl">
        <div>
          <Label>Type *</Label>
          <div className="mt-2">
            <Select
              value={type}
              onValueChange={(v) => setType(v as EditionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <LocalizedStringField
          label="Incipit title"
          value={incipit}
          onChange={setIncipit}
        />
        <div>
          <Label>Alternative incipit titles</Label>
          <div className="mt-2">
            <LocalizedStringList
              value={altIncipits}
              onChange={setAltIncipits}
            />
          </div>
        </div>
        <div>
          <Label>Source</Label>
          <Input
            className="mt-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <div>
          <Label>Colophon</Label>
          <Textarea
            className="mt-2"
            value={colophon}
            onChange={(e) => setColophon(e.target.value)}
          />
        </div>
        <div>
          <Label>Content *</Label>
          <Textarea
            className="mt-2 font-mono text-sm min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type the edition's base text here…"
            required
          />
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
          <Button type="submit" disabled={busy || !content.trim()}>
            {busy ? "Creating…" : "Create edition"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/texts/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
