import type { LocalizedString } from "@/lib/api/client";

const PREFERRED_ORDER = ["en", "bo", "sa", "zh"];

export function pickLocalized(
  value: LocalizedString | null | undefined,
  preferred?: string,
): string {
  if (!value) return "";
  const entries = Object.entries(value as Record<string, string>);
  if (entries.length === 0) return "";
  if (preferred && value[preferred]) return value[preferred];
  for (const code of PREFERRED_ORDER) {
    if (value[code]) return value[code];
  }
  return entries[0][1];
}

export function localizedSummary(
  value: LocalizedString | null | undefined,
  preferred?: string,
): string {
  if (!value) return "—";
  const primary = pickLocalized(value, preferred);
  const codes = Object.keys(value);
  if (codes.length <= 1) return primary;
  return `${primary} (+${codes.length - 1})`;
}
