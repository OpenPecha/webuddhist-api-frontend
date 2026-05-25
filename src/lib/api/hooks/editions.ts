import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type AlignmentInput,
  type AlignmentOutput,
  type BibliographicMetadataInput,
  type BibliographicMetadataOutput,
  type ContentOperation,
  type EditionOutput,
  type IdResponse,
  type NoteInput,
  type NoteOutput,
  type Paginated,
  type PaginationInput,
  type PaginationOutput,
  type SegmentOutput,
  type SegmentationInput,
  type SegmentationOutput,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export function useEdition(id: string | undefined) {
  return useQuery({
    queryKey: qk.editions.detail(id ?? ""),
    queryFn: () => api.get<EditionOutput>(`v2/editions/${id}`),
    enabled: !!id,
  });
}

export function useDeleteEdition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/editions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.editions.all }),
  });
}

export function useEditionContent(
  id: string | undefined,
  span: { start?: number; end?: number },
) {
  return useQuery({
    queryKey: qk.editions.content(id ?? "", span),
    queryFn: () =>
      api.get<unknown>(`v2/editions/${id}/content`, {
        span_start: span.start,
        span_end: span.end,
      }),
    enabled: !!id,
  });
}

export function usePatchEditionContent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (op: ContentOperation) =>
      api.patch<unknown>(`v2/editions/${id}/content`, op),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["editions", id, "content"] }),
  });
}

export function useEditionAnnotations<T>(
  id: string | undefined,
  kind:
    | "segmentations"
    | "alignments"
    | "pagination"
    | "bibliographic"
    | "durchens",
) {
  return useQuery({
    queryKey: qk.editions.annotations(id ?? "", kind),
    queryFn: () => api.get<T[]>(`v2/editions/${id}/${kind}`),
    enabled: !!id,
  });
}

export function useEditionSegmentations(id: string | undefined) {
  return useEditionAnnotations<SegmentationOutput>(id, "segmentations");
}
export function useEditionAlignments(id: string | undefined) {
  return useEditionAnnotations<AlignmentOutput>(id, "alignments");
}
export function useEditionPagination(id: string | undefined) {
  return useQuery({
    queryKey: qk.editions.annotations(id ?? "", "pagination"),
    queryFn: () =>
      api.get<PaginationOutput | null>(`v2/editions/${id}/pagination`),
    enabled: !!id,
  });
}
export function useEditionBibliographic(id: string | undefined) {
  return useEditionAnnotations<BibliographicMetadataOutput>(id, "bibliographic");
}
export function useEditionDurchens(id: string | undefined) {
  return useEditionAnnotations<NoteOutput>(id, "durchens");
}

export function useAddEditionAnnotation<TInput>(
  id: string,
  kind:
    | "segmentations"
    | "alignments"
    | "pagination"
    | "bibliographic"
    | "durchens",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TInput) =>
      api.post<IdResponse>(`v2/editions/${id}/${kind}`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.editions.annotations(id, kind) }),
  });
}

export function useAddSegmentation(id: string) {
  return useAddEditionAnnotation<SegmentationInput>(id, "segmentations");
}
export function useAddAlignment(id: string) {
  return useAddEditionAnnotation<AlignmentInput>(id, "alignments");
}
export function useAddPagination(id: string) {
  return useAddEditionAnnotation<PaginationInput>(id, "pagination");
}
export function useAddBibliographic(id: string) {
  return useAddEditionAnnotation<BibliographicMetadataInput>(id, "bibliographic");
}
export function useAddDurchen(id: string) {
  return useAddEditionAnnotation<NoteInput>(id, "durchens");
}

export function useEditionRelated(id: string | undefined) {
  return useQuery({
    queryKey: qk.editions.related(id ?? ""),
    queryFn: () => api.get<EditionOutput[]>(`v2/editions/${id}/related`),
    enabled: !!id,
  });
}

export function useEditionRelatedSegments(
  id: string | undefined,
  span: { start?: number; end?: number },
  paging: { limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: qk.editions.relatedSegments(id ?? "", span, paging),
    queryFn: () =>
      api.get<Paginated<SegmentOutput>>(`v2/editions/${id}/segments/related`, {
        span_start: span.start,
        span_end: span.end,
        ...paging,
      }),
    enabled: !!id,
  });
}
