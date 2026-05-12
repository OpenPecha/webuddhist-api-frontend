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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBlock } from "@/components/feedback/ErrorBlock";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { LocalizedStringField } from "@/components/forms/LocalizedStringField";
import { LocalizedStringList } from "@/components/forms/LocalizedStringList";
import { CategoryCombobox } from "@/components/forms/CategoryCombobox";
import { LanguageSelect } from "@/components/forms/LanguageSelect";
import { TagMultiSelect } from "@/components/forms/TagMultiSelect";
import {
  usePatchText,
  useText,
} from "@/lib/api/hooks/texts";
import {
  ApiError,
  type LicenseType,
  type LocalizedString,
  type TextPatch,
} from "@/lib/api/client";

const LICENSES: LicenseType[] = [
  "cc0",
  "public",
  "cc-by",
  "cc-by-sa",
  "cc-by-nd",
  "cc-by-nc",
  "cc-by-nc-sa",
  "cc-by-nc-nd",
  "copyrighted",
  "unknown",
];

export default function EditTextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EditTextForm id={id} />;
}

function EditTextForm({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useText(id);
  const patch = usePatchText(id);

  const [title, setTitle] = useState<LocalizedString | null>(null);
  const [altTitles, setAltTitles] = useState<LocalizedString[] | null>(null);
  const [language, setLanguage] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseType>("public");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [bdrc, setBdrc] = useState("");
  const [wiki, setWiki] = useState("");
  const [date, setDate] = useState("");
  const [hydrated, setHydrated] = useState(false);

  if (data && !hydrated) {
    setTitle(data.title);
    setAltTitles(data.alt_titles ?? null);
    setLanguage(data.language);
    setCategoryId(data.category_id);
    setLicense((data.license as LicenseType) ?? "public");
    setTagIds(data.tag_ids ?? []);
    setBdrc(data.bdrc ?? "");
    setWiki(data.wiki ?? "");
    setDate(data.date ?? "");
    setHydrated(true);
  }

  if (isLoading || !hydrated) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorBlock error={error} />;

  const submit = async () => {
    const body: TextPatch = {
      title: title ?? undefined,
      alt_titles: altTitles ?? undefined,
      language: language || undefined,
      category_id: categoryId ?? undefined,
      license,
      tag_ids: tagIds,
      bdrc: bdrc || undefined,
      wiki: wiki || undefined,
      date: date || undefined,
    };
    try {
      await patch.mutateAsync(body);
      toast.success("Text updated");
      router.push(`/texts/${id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
      throw err;
    }
  };

  return (
    <div>
      <PageHeader title="Edit text" description={`Editing ${id}`} />
      <form
        onSubmit={(e) => e.preventDefault()}
        className="max-w-3xl space-y-6"
      >
        <LocalizedStringField label="Title" value={title} onChange={setTitle} />
        <div>
          <Label>Alternative titles</Label>
          <div className="mt-2">
            <LocalizedStringList value={altTitles} onChange={setAltTitles} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Language</Label>
            <div className="mt-2">
              <LanguageSelect value={language} onChange={setLanguage} />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <div className="mt-2">
              <CategoryCombobox value={categoryId} onChange={setCategoryId} />
            </div>
          </div>
        </div>
        <div>
          <Label>License</Label>
          <div className="mt-2">
            <Select
              value={license}
              onValueChange={(v) => setLicense(v as LicenseType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Tags</Label>
          <div className="mt-2">
            <TagMultiSelect value={tagIds} onChange={setTagIds} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <Label>Date</Label>
            <Input
              className="mt-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 border-t pt-4">
          <ConfirmDialog
            trigger={
              <Button type="button" disabled={patch.isPending}>
                {patch.isPending ? "Saving…" : "Save changes"}
              </Button>
            }
            variant="warning"
            title="Save changes to this text?"
            description="You're about to update a record in the database. Edits propagate to anything that references this text. Be sure the values below are correct before continuing."
            confirmLabel="Yes, save changes"
            cancelLabel="Keep editing"
            onConfirm={submit}
          >
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="text-foreground">Language:</span>{" "}
                {language || "—"}
              </li>
              <li>
                <span className="text-foreground">License:</span> {license}
              </li>
              <li>
                <span className="text-foreground">Category:</span>{" "}
                {categoryId ?? "—"}
              </li>
              <li>
                <span className="text-foreground">Tags:</span>{" "}
                {tagIds.length} selected
              </li>
            </ul>
          </ConfirmDialog>
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
