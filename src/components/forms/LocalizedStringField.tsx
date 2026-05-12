"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguages } from "@/lib/api/hooks/languages";
import type { LocalizedString } from "@/lib/api/client";

type Props = {
  label?: string;
  value: LocalizedString | null | undefined;
  onChange: (v: LocalizedString | null) => void;
  required?: boolean;
  multiline?: boolean;
  helperText?: string;
};

export function LocalizedStringField({
  label,
  value,
  onChange,
  required,
  multiline,
  helperText,
}: Props) {
  const { data: languages } = useLanguages();
  const entries = Object.entries((value ?? {}) as Record<string, string>);

  const usedCodes = new Set(entries.map(([k]) => k));
  const availableLangs = (languages ?? []).filter(
    (l) => !usedCodes.has(l.code),
  );

  const update = (next: Array<[string, string]>) => {
    if (next.length === 0) {
      onChange(required ? null : null);
      return;
    }
    const obj = Object.fromEntries(next) as LocalizedString;
    onChange(obj);
  };

  const addRow = () => {
    const code =
      availableLangs[0]?.code ??
      ["en", "bo", "sa", "zh"].find((c) => !usedCodes.has(c)) ??
      "xx";
    update([...entries, [code, ""]]);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">No values.</p>
        )}
        {entries.map(([code, text], idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Input
              className="w-24"
              value={code}
              onChange={(e) => {
                const newCode = e.target.value.trim();
                const next = [...entries];
                next[idx] = [newCode, text];
                update(next);
              }}
              placeholder="lang"
              list="lang-codes-list"
            />
            {multiline ? (
              <Textarea
                className="flex-1 min-h-[60px]"
                value={text}
                onChange={(e) => {
                  const next = [...entries];
                  next[idx] = [code, e.target.value];
                  update(next);
                }}
              />
            ) : (
              <Input
                className="flex-1"
                value={text}
                onChange={(e) => {
                  const next = [...entries];
                  next[idx] = [code, e.target.value];
                  update(next);
                }}
              />
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => update(entries.filter((_, i) => i !== idx))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={addRow}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add language
      </Button>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      <datalist id="lang-codes-list">
        {(languages ?? []).map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </datalist>
    </div>
  );
}
