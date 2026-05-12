export const qk = {
  texts: {
    all: ["texts"] as const,
    list: (filters: Record<string, unknown>) =>
      ["texts", "list", filters] as const,
    detail: (id: string) => ["texts", "detail", id] as const,
    editions: (id: string, type?: string) =>
      ["texts", id, "editions", type ?? null] as const,
  },
  editions: {
    all: ["editions"] as const,
    detail: (id: string) => ["editions", "detail", id] as const,
    content: (id: string, span: { start?: number; end?: number }) =>
      ["editions", id, "content", span] as const,
    annotations: (id: string, kind: string) =>
      ["editions", id, "annotations", kind] as const,
    related: (id: string) => ["editions", id, "related"] as const,
    relatedSegments: (
      id: string,
      span: { start?: number; end?: number },
      paging: { limit?: number; offset?: number },
    ) => ["editions", id, "segments", "related", span, paging] as const,
  },
  persons: {
    all: ["persons"] as const,
    list: (filters: Record<string, unknown>) =>
      ["persons", "list", filters] as const,
    detail: (id: string) => ["persons", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (parent_id?: string | null) =>
      ["categories", "list", parent_id ?? null] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
  languages: {
    all: ["languages"] as const,
  },
  segments: {
    detail: (id: string) => ["segments", id] as const,
    content: (id: string) => ["segments", id, "content"] as const,
    related: (id: string, paging: { limit?: number; offset?: number }) =>
      ["segments", id, "related", paging] as const,
    search: (query: string) => ["segments", "search", query] as const,
  },
  annotations: {
    detail: (kind: string, id: string) => ["annotations", kind, id] as const,
  },
};
