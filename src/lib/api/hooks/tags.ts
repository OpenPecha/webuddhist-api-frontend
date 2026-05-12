import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, type IdResponse, type TagInput, type TagOutput } from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export function useTags() {
  return useQuery({
    queryKey: qk.tags.all,
    queryFn: () => api.get<TagOutput[]>("v2/tags"),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TagInput) => api.post<IdResponse>("v2/tags", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tags.all }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tags.all }),
  });
}
