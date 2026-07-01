import { z } from "zod";

export const metadataItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

export const customFieldDataTypeSchema = z.enum([
  "string",
  "url",
  "date",
  "boolean",
  "integer",
  "float",
  "monetary",
  "documentlink",
  "select",
  "longtext",
]);

export const customFieldDefinitionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  data_type: customFieldDataTypeSchema,
  extra_data: z
    .object({
      select_options: z
        .array(z.object({ id: z.string(), label: z.string() }))
        .optional(),
      default_currency: z.string().optional(),
    })
    .nullish(),
});

export const customFieldInstanceSchema = z.object({
  field: z.number().int().positive(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.number().int().positive()),
    z.null(),
  ]),
});

export const paperlessDocumentSchema = z.object({
  id: z.number().int().positive(),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? "Untitled document"),
  correspondent: z.number().int().positive().nullable(),
  document_type: z.number().int().positive().nullable(),
  tags: z.array(z.number().int().positive()),
  created: z.string(),
  added: z.string(),
  page_count: z.number().int().nonnegative().nullish(),
  original_file_name: z.string().nullish(),
  user_can_change: z.boolean().optional().default(true),
  custom_fields: z.array(customFieldInstanceSchema).optional().default([]),
});

export const taskSchema = z.object({
  task_id: z.string(),
  task_file_name: z.string().nullish(),
  status: z
    .enum([
      "FAILURE",
      "PENDING",
      "RECEIVED",
      "RETRY",
      "REVOKED",
      "STARTED",
      "SUCCESS",
    ])
    .optional()
    .default("PENDING"),
  result: z.string().nullish(),
  related_document: z.string().nullish(),
});

export function collectionSchema<T extends z.ZodType>(item: T) {
  return z.object({
    count: z.number().int().nonnegative().optional(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(item),
  });
}
