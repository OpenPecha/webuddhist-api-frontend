import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type Paginated,
  type SearchResponse,
  type SegmentOutput,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export function useSegmentContent(id: string | undefined) {
  return useQuery({
    queryKey: qk.segments.content(id ?? ""),
    queryFn: () => api.get<unknown>(`v2/segments/${id}/content`),
    enabled: !!id,
  });
}

export function useSegmentRelated(
  id: string | undefined,
  paging: { limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: qk.segments.related(id ?? "", paging),
    queryFn: () =>
      api.get<Paginated<SegmentOutput>>(`v2/segments/${id}/related`, paging),
    enabled: !!id,
  });
}

export function useSegmentSearch(
  query: string,
  enabled: boolean,
  params: {
    search_type?: string;
    limit?: number;
    return_text?: boolean;
    title?: string;
  } = {},
) {
  return useQuery({
    queryKey: qk.segments.search(query),
    queryFn: () =>
      api.get<SearchResponse>("v2/segments/search", {
        query,
        params: JSON.stringify({
          search_type: params.search_type ?? "semantic",
          limit: params.limit ?? 10,
          return_text: params.return_text ?? true,
          ...(params.title ? { title: params.title } : {}),
        }),
      }),
    enabled: enabled && query.trim().length > 0,
    retry: false,
  });
}

export function useAddTagToSegment(segmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.post(`v2/segments/${segmentId}/tags/${tagId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.segments.detail(segmentId) }),
  });
}

export function useRemoveTagFromSegment(segmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.delete(`v2/segments/${segmentId}/tags/${tagId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.segments.detail(segmentId) }),
  });
}
