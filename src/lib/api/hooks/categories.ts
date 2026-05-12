import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type CategoryInput,
  type CategoryOutput,
  type IdResponse,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export function useCategories(parent_id?: string | null) {
  return useQuery({
    queryKey: qk.categories.list(parent_id),
    queryFn: () =>
      api.get<CategoryOutput[]>("v2/categories", {
        parent_id: parent_id ?? undefined,
      }),
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: qk.categories.detail(id ?? ""),
    queryFn: () => api.get<CategoryOutput>(`v2/categories/${id}`),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryInput) =>
      api.post<IdResponse>("v2/categories", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}
