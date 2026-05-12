import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type LanguageCreateRequest,
  type LanguageResponse,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export function useLanguages() {
  return useQuery({
    queryKey: qk.languages.all,
    queryFn: () => api.get<LanguageResponse[]>("v2/languages"),
  });
}

export function useCreateLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LanguageCreateRequest) =>
      api.post<LanguageResponse>("v2/languages", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.languages.all }),
  });
}

export function useDeleteLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.delete(`v2/languages/${code}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.languages.all }),
  });
}
