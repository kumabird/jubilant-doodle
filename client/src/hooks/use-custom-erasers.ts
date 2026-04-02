import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertCustomEraser } from "@shared/schema";

export function useCustomErasers() {
  return useQuery({
    queryKey: [api.customErasers.list.path],
    queryFn: async () => {
      const res = await fetch(api.customErasers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch custom erasers");
      return api.customErasers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCustomEraser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCustomEraser) => {
      const validated = api.customErasers.create.input.parse(data);
      const res = await fetch(api.customErasers.create.path, {
        method: api.customErasers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.customErasers.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create custom eraser");
      }
      return api.customErasers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customErasers.list.path] });
    },
  });
}

export function useDeleteCustomEraser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.customErasers.delete.path, { id });
      const res = await fetch(url, {
        method: api.customErasers.delete.method,
        credentials: "include",
      });
      if (res.status === 404) throw new Error("Eraser not found");
      if (!res.ok) throw new Error("Failed to delete eraser");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customErasers.list.path] });
    },
  });
}
