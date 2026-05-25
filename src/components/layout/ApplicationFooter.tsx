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
  API_KEY_CHANGED_EVENT,
  DEFAULT_APPLICATION_ID,
  getApiKey,
  getApplicationId,
  setApiKey,
  setApplicationId,
} from "@/lib/api/client";

export function ApplicationFooter() {
  const [appId, setAppId] = useState<string>(DEFAULT_APPLICATION_ID);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [open, setOpen] = useState(false);
  const [appDraft, setAppDraft] = useState("");
  const [apiKeyDraft, setApiKeyDraft] = useState("");

  useEffect(() => {
    const refresh = () => {
      setAppId(getApplicationId());
      setHasApiKey(Boolean(getApiKey().trim()));
    };
    refresh();
    window.addEventListener("openpecha:app-changed", refresh);
    window.addEventListener(API_KEY_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("openpecha:app-changed", refresh);
      window.removeEventListener(API_KEY_CHANGED_EVENT, refresh);
    };
  }, []);

  return (
    <div className="border-t px-3 py-3">
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Active application
          </p>
          <span className="font-mono text-xs truncate">{appId}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">API key</p>
            <span className="text-xs">
              {hasApiKey ? "Configured" : "Required"}
            </span>
          </div>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              if (v) {
                setAppDraft(appId);
                setApiKeyDraft("");
              }
              setOpen(v);
            }}
          >
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Access settings</DialogTitle>
                <DialogDescription>
                  Enter an API key to read and write data. The application ID is
                  sent as the <code>X-Application</code> header.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="application-id">Application ID</Label>
                  <Input
                    id="application-id"
                    value={appDraft}
                    onChange={(e) => setAppDraft(e.target.value)}
                    placeholder={DEFAULT_APPLICATION_ID}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Defaults to <code>{DEFAULT_APPLICATION_ID}</code>. There is
                    no list-applications endpoint, so paste an ID you've
                    created.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder={
                      hasApiKey ? "Leave blank to keep current key" : "Required"
                    }
                    autoComplete="off"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stored in this browser and sent as the{" "}
                    <code>X-API-Key</code> header for every API request.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setApplicationId(null);
                    toast.success(`Reset to ${DEFAULT_APPLICATION_ID}`);
                  }}
                >
                  Reset app
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setApiKey(null);
                    setApiKeyDraft("");
                    toast.success("API key cleared");
                  }}
                >
                  Clear key
                </Button>
                <Button
                  onClick={() => {
                    const v = appDraft.trim();
                    const apiKey = apiKeyDraft.trim();
                    if (!apiKey && !hasApiKey) {
                      toast.error("Enter an API key to enable access.");
                      return;
                    }
                    if (apiKey) setApiKey(apiKey);
                    if (!v) {
                      setApplicationId(null);
                    } else {
                      setApplicationId(v);
                    }
                    toast.success(`Active: ${v || DEFAULT_APPLICATION_ID}`);
                    setOpen(false);
                  }}
                >
                  Save settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
