import { z } from 'zod';
import { insertCustomEraserSchema, customErasers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  customErasers: {
    list: {
      method: 'GET' as const,
      path: '/api/custom-erasers' as const,
      responses: {
        200: z.array(z.custom<typeof customErasers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/custom-erasers' as const,
      input: insertCustomEraserSchema,
      responses: {
        201: z.custom<typeof customErasers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/custom-erasers/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
