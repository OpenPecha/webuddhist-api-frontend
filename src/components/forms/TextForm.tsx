"use client";

import { useState } from "react";
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
import { LocalizedStringField } from "./LocalizedStringField";
import { LocalizedStringList } from "./LocalizedStringList";
import { CategoryCombobox } from "./CategoryCombobox";
import { LanguageSelect } from "./LanguageSelect";
import { TagMultiSelect } from "./TagMultiSelect";
import { ContributionsField } from "./ContributionsField";
import type {
  AIContribution,
  ContributionInput,
  LicenseType,
  LocalizedString,
  TextInput,
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

type Props = {
  initial?: Partial<TextInput>;
  onSubmit: (body: TextInput) => Promise<unknown>;
  submitLabel?: string;
};

export function TextForm({ initial, onSubmit, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState<LocalizedString | null>(
    initial?.title ?? { en: "" },
  );
  const [altTitles, setAltTitles] = useState<LocalizedString[] | null>(
    initial?.alt_titles ?? null,
  );
  const [language, setLanguage] = useState<string>(initial?.language ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.category_id ?? null,
  );
  const [license, setLicense] = useState<LicenseType>(
    (initial?.license as LicenseType) ?? "public",
  );
  const [contributions, setContributions] = useState<
    Array<ContributionInput | AIContribution>
  >((initial?.contributions ?? []) as Array<ContributionInput | AIContribution>);
  const [tagIds, setTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [bdrc, setBdrc] = useState<string>(initial?.bdrc ?? "");
  const [wiki, setWiki] = useState<string>(initial?.wiki ?? "");
  const [date, setDate] = useState<string>(initial?.date ?? "");
  const [commentaryOf, setCommentaryOf] = useState<string>(
    initial?.commentary_of ?? "",
  );
  const [translationOf, setTranslationOf] = useState<string>(
    initial?.translation_of ?? "",
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !language || !categoryId) return;
    setBusy(true);
    try {
      const body: TextInput = {
        title,
        alt_titles: altTitles ?? undefined,
        language,
        category_id: categoryId,
        license,
        contributions,
        tag_ids: tagIds,
        bdrc: bdrc || undefined,
        wiki: wiki || undefined,
        date: date || undefined,
        commentary_of: commentaryOf || undefined,
        translation_of: translationOf || undefined,
      };
      await onSubmit(body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <LocalizedStringField
        label="Title"
        required
        value={title}
        onChange={setTitle}
      />

      <div>
        <Label>Alternative titles</Label>
        <div className="mt-2">
          <LocalizedStringList value={altTitles} onChange={setAltTitles} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Language *</Label>
          <div className="mt-2">
            <LanguageSelect value={language} onChange={setLanguage} />
          </div>
        </div>
        <div>
          <Label>Category *</Label>
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

      <ContributionsField value={contributions} onChange={setContributions} />

      <div>
        <Label>Tags</Label>
        <div className="mt-2">
          <TagMultiSelect value={tagIds} onChange={setTagIds} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>BDRC ID</Label>
          <Input
            className="mt-2"
            value={bdrc}
            onChange={(e) => setBdrc(e.target.value)}
            placeholder="e.g. WA12345"
          />
        </div>
        <div>
          <Label>Wikidata ID</Label>
          <Input
            className="mt-2"
            value={wiki}
            onChange={(e) => setWiki(e.target.value)}
            placeholder="e.g. Q12345"
          />
        </div>
        <div>
          <Label>Date</Label>
          <Input
            className="mt-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. 1234"
          />
        </div>
        <div />
        <div>
          <Label>Commentary of (text ID)</Label>
          <Input
            className="mt-2"
            value={commentaryOf}
            onChange={(e) => setCommentaryOf(e.target.value)}
          />
        </div>
        <div>
          <Label>Translation of (text ID)</Label>
          <Input
            className="mt-2"
            value={translationOf}
            onChange={(e) => setTranslationOf(e.target.value)}
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
