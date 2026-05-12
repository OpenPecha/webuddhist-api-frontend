"use client";

import { Plus, X } from "lucide-react";
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
import { PersonCombobox } from "./PersonCombobox";
import type {
  AIContribution,
  ContributionInput,
  ContributorRole,
} from "@/lib/api/client";

type ContributionItem = ContributionInput | AIContribution;

const ROLES: ContributorRole[] = ["translator", "reviser", "author", "scholar"];

type Props = {
  value: ContributionItem[];
  onChange: (next: ContributionItem[]) => void;
};

function isAi(item: ContributionItem): item is AIContribution {
  return "ai_id" in item;
}

export function ContributionsField({ value, onChange }: Props) {
  const items = value ?? [];

  const update = (next: ContributionItem[]) => onChange(next);

  return (
    <div className="space-y-3">
      <Label>Contributions *</Label>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          At least one contribution is required.
        </p>
      )}
      {items.map((item, idx) => {
        const ai = isAi(item);
        return (
          <div
            key={idx}
            className="rounded-md border p-3 space-y-2 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">
                {ai ? "AI contribution" : "Human contribution"} #{idx + 1}
              </p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  update(items.filter((_, i) => i !== idx))
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Role</Label>
                <Select
                  value={item.role}
                  onValueChange={(role) => {
                    const next = [...items];
                    next[idx] = { ...item, role: role as ContributorRole };
                    update(next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {ai ? (
                <div>
                  <Label className="text-xs">AI ID</Label>
                  <Input
                    value={item.ai_id}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, ai_id: e.target.value };
                      update(next);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Person</Label>
                  <PersonCombobox
                    value={item.person_id ?? null}
                    onChange={(id) => {
                      const next = [...items];
                      next[idx] = {
                        ...(item as ContributionInput),
                        person_id: id ?? undefined,
                      };
                      update(next);
                    }}
                  />
                </div>
              )}
            </div>

            {!ai && (
              <div>
                <Label className="text-xs">Person BDRC ID (optional)</Label>
                <Input
                  value={(item as ContributionInput).person_bdrc_id ?? ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = {
                      ...(item as ContributionInput),
                      person_bdrc_id: e.target.value || undefined,
                    };
                    update(next);
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            update([...items, { role: "author" } as ContributionInput])
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add person
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            update([
              ...items,
              { role: "translator", ai_id: "" } as AIContribution,
            ])
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add AI
        </Button>
      </div>
    </div>
  );
}
