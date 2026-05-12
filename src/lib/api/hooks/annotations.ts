import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type AlignmentOutput,
  type BibliographicMetadataOutput,
  type NoteOutput,
  type PaginationOutput,
  type SegmentationOutput,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export type AnnotationKind =
  | "segmentations"
  | "alignments"
  | "paginations"
  | "bibliographic"
  | "durchens";

type OutputMap = {
  segmentations: SegmentationOutput;
  alignments: AlignmentOutput;
  paginations: PaginationOutput;
  bibliographic: BibliographicMetadataOutput;
  durchens: NoteOutput;
};

export function useAnnotation<K extends AnnotationKind>(
  kind: K,
  id: string | undefined,
) {
  return useQuery({
    queryKey: qk.annotations.detail(kind, id ?? ""),
    queryFn: () => api.get<OutputMap[K]>(`v2/${kind}/${id}`),
    enabled: !!id,
  });
}

export function useDeleteAnnotation(kind: AnnotationKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/${kind}/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["annotations", kind] }),
  });
}
