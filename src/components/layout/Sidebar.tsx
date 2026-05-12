"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  FolderTree,
  Languages,
  LayoutDashboard,
  Search,
  Tag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationFooter } from "./ApplicationFooter";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/texts", label: "Texts", icon: BookOpen },
  { href: "/persons", label: "Persons", icon: Users },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/languages", label: "Languages", icon: Languages },
  { href: "/segments/search", label: "Segment search", icon: Search },
  { href: "/applications", label: "Applications", icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-xl font-medium tracking-tight">
            OpenPecha
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            admin
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Buddhist text database
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-[3px] rounded-r-full bg-primary"
                />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <ApplicationFooter />
    </aside>
  );
}
