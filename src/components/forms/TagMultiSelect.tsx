"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useTags } from "@/lib/api/hooks/tags";
import { pickLocalized } from "@/lib/utils/localized-string";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
};

export function TagMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { data } = useTags();
  const all = data ?? [];

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            <span className="text-muted-foreground">
              {value.length ? `${value.length} selected` : "Select tags…"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags…" />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {all.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={pickLocalized(t.title)}
                    onSelect={() => toggle(t.id)}
                  >
                    <Check
                      className={
                        "mr-2 h-4 w-4 " +
                        (value.includes(t.id) ? "opacity-100" : "opacity-0")
                      }
                    />
                    <span className="truncate">{pickLocalized(t.title)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => {
            const tag = all.find((t) => t.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1">
                {tag ? pickLocalized(tag.title) : id}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="ml-1"
                  aria-label="Remove tag"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
