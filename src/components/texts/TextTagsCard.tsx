"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useAddTagToText,
  useRemoveTagFromText,
} from "@/lib/api/hooks/texts";
import { useTags } from "@/lib/api/hooks/tags";
import { ApiError } from "@/lib/api/client";
import { pickLocalized } from "@/lib/utils/localized-string";

export function TextTagsCard({
  textId,
  tagIds,
}: {
  textId: string;
  tagIds: string[];
}) {
  const { data: allTags } = useTags();
  const add = useAddTagToText(textId);
  const remove = useRemoveTagFromText(textId);
  const [open, setOpen] = useState(false);

  const available = (allTags ?? []).filter((t) => !tagIds.includes(t.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tags</span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" disabled={available.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Add tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search tags…" />
                <CommandList>
                  <CommandEmpty>No more tags.</CommandEmpty>
                  <CommandGroup>
                    {available.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={pickLocalized(t.title)}
                        onSelect={async () => {
                          try {
                            await add.mutateAsync(t.id);
                            toast.success("Tag added");
                          } catch (err) {
                            toast.error(
                              err instanceof ApiError ? err.message : "Failed",
                            );
                          }
                          setOpen(false);
                        }}
                      >
                        {pickLocalized(t.title)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tagIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tagIds.map((id) => {
              const tag = (allTags ?? []).find((t) => t.id === id);
              return (
                <Badge key={id} variant="secondary" className="gap-1">
                  {tag ? pickLocalized(tag.title) : id}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await remove.mutateAsync(id);
                        toast.success("Tag removed");
                      } catch (err) {
                        toast.error(
                          err instanceof ApiError ? err.message : "Failed",
                        );
                      }
                    }}
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
      </CardContent>
    </Card>
  );
}
