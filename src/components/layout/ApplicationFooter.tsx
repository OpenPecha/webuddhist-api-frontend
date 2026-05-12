"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DEFAULT_APPLICATION_ID,
  getApplicationId,
  setApplicationId,
} from "@/lib/api/client";

export function ApplicationFooter() {
  const [appId, setAppId] = useState<string>(DEFAULT_APPLICATION_ID);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setAppId(getApplicationId());
    const handler = () => setAppId(getApplicationId());
    window.addEventListener("openpecha:app-changed", handler);
    return () =>
      window.removeEventListener("openpecha:app-changed", handler);
  }, []);

  return (
    <div className="border-t px-3 py-3">
      <p className="text-xs text-muted-foreground mb-1">Active application</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs truncate">{appId}</span>
        <Dialog open={open} onOpenChange={(v) => {
          if (v) setDraft(appId);
          setOpen(v);
        }}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change active application</DialogTitle>
              <DialogDescription>
                Sent as the <code>X-Application</code> header on every request.
                The API uses this to scope categories, tags, and segments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Application ID</Label>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={DEFAULT_APPLICATION_ID}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Defaults to <code>{DEFAULT_APPLICATION_ID}</code>. There is no
                list-applications endpoint, so paste an ID you've created.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApplicationId(null);
                  toast.success(`Reset to ${DEFAULT_APPLICATION_ID}`);
                  setOpen(false);
                }}
              >
                Reset to default
              </Button>
              <Button
                onClick={() => {
                  const v = draft.trim();
                  if (!v) {
                    setApplicationId(null);
                  } else {
                    setApplicationId(v);
                  }
                  toast.success(
                    `Active: ${v || DEFAULT_APPLICATION_ID}`,
                  );
                  setOpen(false);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
