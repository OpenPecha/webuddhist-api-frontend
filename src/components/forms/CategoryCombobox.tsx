"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useCategories,
  useCategory,
} from "@/lib/api/hooks/categories";
import { pickLocalized } from "@/lib/utils/localized-string";

type Props = {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
};

export function CategoryCombobox({
  value,
  onChange,
  placeholder,
  allowClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data, isFetching } = useCategories(null);
  const { data: selected } = useCategory(value || undefined);

  const filtered = (data ?? []).filter((c) => {
    if (!query) return true;
    return pickLocalized(c.title)
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected
              ? pickLocalized(selected.title)
              : placeholder ?? "Select a category…"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search categories…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isFetching && (
              <p className="p-2 text-xs text-muted-foreground">Loading…</p>
            )}
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {allowClear && value && (
                <CommandItem
                  value="__clear"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  Clear selection
                </CommandItem>
              )}
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      c.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{pickLocalized(c.title)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
