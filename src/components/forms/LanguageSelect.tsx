"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguages } from "@/lib/api/hooks/languages";

type Props = {
  value: string | null | undefined;
  onChange: (code: string) => void;
  placeholder?: string;
};

export function LanguageSelect({ value, onChange, placeholder }: Props) {
  const { data } = useLanguages();
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Select a language…"} />
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.name} ({l.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
