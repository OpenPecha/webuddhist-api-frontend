import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type EditionOutput,
  type EditionRequestModel,
  type IdResponse,
  type Paginated,
  type TextInput,
  type TextOutput,
  type TextPatch,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export type TextListFilters = {
  language?: string;
  title?: string;
  category_id?: string;
  tag_id?: string;
  author_id?: string;
  bdrc?: string;
  wiki?: string;
  limit?: number;
  offset?: number;
};

export function useTexts(filters: TextListFilters = {}) {
  return useQuery({
    queryKey: qk.texts.list(filters as Record<string, unknown>),
    queryFn: () =>
      api.get<Paginated<TextOutput>>("v2/texts", filters as Record<string, unknown>),
  });
}

export function useText(id: string | undefined) {
  return useQuery({
    queryKey: qk.texts.detail(id ?? ""),
    queryFn: () => api.get<TextOutput>(`v2/texts/${id}`),
    enabled: !!id,
  });
}

export function useCreateText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TextInput) => api.post<IdResponse>("v2/texts", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.texts.all }),
  });
}

export function usePatchText(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TextPatch) => api.patch<TextOutput>(`v2/texts/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.texts.detail(id) });
      qc.invalidateQueries({ queryKey: qk.texts.all });
    },
  });
}

export function useDeleteText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/texts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.texts.all }),
  });
}

export function useTextEditions(id: string | undefined, type?: string) {
  return useQuery({
    queryKey: qk.texts.editions(id ?? "", type),
    queryFn: () =>
      api.get<EditionOutput[]>(`v2/texts/${id}/editions`, {
        edition_type: type,
      }),
    enabled: !!id,
  });
}

export function useCreateTextEdition(textId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditionRequestModel) =>
      api.post<IdResponse>(`v2/texts/${textId}/editions`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.texts.editions(textId) });
      qc.invalidateQueries({ queryKey: qk.texts.detail(textId) });
    },
  });
}

export function useAddTagToText(textId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => api.post(`v2/texts/${textId}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.texts.detail(textId) }),
  });
}

export function useRemoveTagFromText(textId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.delete(`v2/texts/${textId}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.texts.detail(textId) }),
  });
}
