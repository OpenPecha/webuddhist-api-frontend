import { useMutation } from "@tanstack/react-query";
import {
  api,
  type ApplicationCreateRequest,
  type ApplicationResponse,
} from "@/lib/api/client";

export function useCreateApplication() {
  return useMutation({
    mutationFn: (body: ApplicationCreateRequest) =>
      api.post<ApplicationResponse>("v2/applications", body),
  });
}

export function useDeleteApplication() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`v2/applications/${id}`),
  });
}
