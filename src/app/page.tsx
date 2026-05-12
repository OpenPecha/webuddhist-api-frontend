"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  FolderTree,
  Languages,
  Search,
  Tag,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTexts } from "@/lib/api/hooks/texts";
import { usePersons } from "@/lib/api/hooks/persons";
import { useTags } from "@/lib/api/hooks/tags";
import { useLanguages } from "@/lib/api/hooks/languages";
import { useCategories } from "@/lib/api/hooks/categories";

const TILES = [
  {
    href: "/texts",
    label: "Texts",
    description: "Works, with editions and annotations under each.",
    icon: BookOpen,
  },
  {
    href: "/persons",
    label: "Persons",
    description: "Authors, translators, contributors.",
    icon: Users,
  },
  {
    href: "/categories",
    label: "Categories",
    description: "Hierarchical taxonomy.",
    icon: FolderTree,
  },
  {
    href: "/tags",
    label: "Tags",
    description: "Reusable tags for texts and segments.",
    icon: Tag,
  },
  {
    href: "/languages",
    label: "Languages",
    description: "Language codes used in the database.",
    icon: Languages,
  },
  {
    href: "/segments/search",
    label: "Segment search",
    description: "Semantic search across segments.",
    icon: Search,
  },
  {
    href: "/applications",
    label: "Applications",
    description: "Create application IDs used as X-Application.",
    icon: Boxes,
  },
];

export default function Dashboard() {
  const texts = useTexts({ limit: 1 });
  const persons = usePersons({ limit: 1 });
  const tags = useTags();
  const languages = useLanguages();
  const categories = useCategories(null);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="OpenPecha admin — manage every WEMI-style entity in the database."
      />

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          At a glance
        </h2>
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Stat
            label="Texts"
            value={
              texts.data
                ? texts.data.has_more
                  ? `${texts.data.items.length}+`
                  : `${texts.data.items.length}`
                : "…"
            }
            href="/texts"
            loading={texts.isLoading}
          />
          <Stat
            label="Persons"
            value={
              persons.data
                ? persons.data.has_more
                  ? `${persons.data.items.length}+`
                  : `${persons.data.items.length}`
                : "…"
            }
            href="/persons"
            loading={persons.isLoading}
          />
          <Stat
            label="Categories (root)"
            value={categories.data?.length ?? "…"}
            href="/categories"
            loading={categories.isLoading}
          />
          <Stat
            label="Tags"
            value={tags.data?.length ?? "…"}
            href="/tags"
            loading={tags.isLoading}
          />
          <Stat
            label="Languages"
            value={languages.data?.length ?? "…"}
            href="/languages"
            loading={languages.isLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Browse
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex h-full flex-col gap-2 rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(140,80,40,0.18)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <t.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-base font-medium tracking-tight">
                  {t.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  href: string;
  loading?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-1 bg-card px-4 py-5 transition-colors hover:bg-accent/40"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-3xl font-medium tabular-nums tracking-tight">
        {loading ? "…" : value}
      </p>
    </Link>
  );
}
