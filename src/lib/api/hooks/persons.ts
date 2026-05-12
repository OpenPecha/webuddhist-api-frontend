import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  type IdResponse,
  type Paginated,
  type PersonInput,
  type PersonOutput,
  type PersonPatch,
} from "@/lib/api/client";
import { qk } from "@/lib/utils/query-keys";

export type PersonListFilters = {
  name?: string;
  bdrc?: string;
  wiki?: string;
  limit?: number;
  offset?: number;
};

export function usePersons(filters: PersonListFilters = {}) {
  return useQuery({
    queryKey: qk.persons.list(filters as Record<string, unknown>),
    queryFn: () =>
      api.get<Paginated<PersonOutput>>(
        "v2/persons",
        filters as Record<string, unknown>,
      ),
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: qk.persons.detail(id ?? ""),
    queryFn: () => api.get<PersonOutput>(`v2/persons/${id}`),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PersonInput) => api.post<IdResponse>("v2/persons", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.persons.all }),
  });
}

export function usePatchPerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PersonPatch) =>
      api.patch<PersonOutput>(`v2/persons/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.persons.detail(id) });
      qc.invalidateQueries({ queryKey: qk.persons.all });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/persons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.persons.all }),
  });
}
