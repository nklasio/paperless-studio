import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  errorFromUpstream,
  responseForError,
} from "@/lib/api-errors";
import { requireDocumentAuthentication } from "@/lib/auth-route";
import {
  loadPaperlessMetadata,
  mapPaperlessDocument,
  reviewTagName,
} from "@/lib/paperless-adapter";
import { paperlessDocumentSchema } from "@/lib/paperless-contracts";
import {
  paperlessConfiguration,
  paperlessFetch,
  validPaperlessId,
} from "@/lib/paperless-api";
import { isSameOriginRequest } from "@/lib/request-security";
import { customFieldValueIsValid } from "@/lib/custom-fields";

type Context = { params: Promise<{ id: string }> };

async function validatedId(context: Context) {
  const { id } = await context.params;
  return validPaperlessId(id) ? id : null;
}

export async function GET(request: NextRequest, context: Context) {
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;
  if (!paperlessConfiguration()) {
    return apiError("not_configured", "Paperless is not configured.", 503);
  }
  const id = await validatedId(context);
  if (!id) {
    return apiError("validation_failed", "Invalid document ID.", 400);
  }

  try {
    const [metadata, response] = await Promise.all([
      loadPaperlessMetadata(),
      paperlessFetch(`/api/documents/${id}/`, { cache: "no-store" }),
    ]);
    if (!response.ok) {
      throw errorFromUpstream(
        response,
        "Could not load the Paperless document.",
      );
    }
    const document = mapPaperlessDocument(
      paperlessDocumentSchema.parse(await response.json()),
      metadata,
    );
    return NextResponse.json({
      ...document,
      customFields: document.customFields ?? [],
      customFieldDefinitions: metadata.customFields,
      reviewTag: reviewTagName(),
    });
  } catch (error) {
    return responseForError(error);
  }
}

const customFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.number().int().positive()),
  z.null(),
]);

const patchSchema = z
  .object({
    correspondent: z.string().optional(),
    documentType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["review", "ready"]).optional(),
    created: z.string().optional(),
    customFields: z
      .array(
        z.object({
          fieldId: z.number().int().positive(),
          value: customFieldValueSchema,
        }),
      )
      .optional(),
  })
  .strict();

export async function PATCH(request: NextRequest, context: Context) {
  if (!isSameOriginRequest(request)) {
    return apiError(
      "permission_denied",
      "Cross-origin requests are not allowed.",
      403,
    );
  }
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;
  if (!paperlessConfiguration()) {
    return apiError("not_configured", "Paperless is not configured.", 503);
  }
  const id = await validatedId(context);
  if (!id) {
    return apiError("validation_failed", "Invalid document ID.", 400);
  }

  let patch: z.infer<typeof patchSchema>;
  try {
    patch = patchSchema.parse(await request.json());
  } catch {
    return apiError(
      "validation_failed",
      "The document changes are invalid.",
      400,
    );
  }

  try {
    const metadata = await loadPaperlessMetadata();
    const currentResponse = await paperlessFetch(`/api/documents/${id}/`);
    if (!currentResponse.ok) {
      throw errorFromUpstream(
        currentResponse,
        "Could not load the Paperless document.",
      );
    }
    const current = paperlessDocumentSchema.parse(await currentResponse.json());
    if (!current.user_can_change) {
      return apiError(
        "permission_denied",
        "This document is read-only for the configured Paperless account.",
        403,
      );
    }

    const byName = (items: Array<{ id: number; name: string }>) =>
      new Map(items.map((item) => [item.name.toLocaleLowerCase(), item.id]));
    const correspondents = byName(metadata.correspondents);
    const types = byName(metadata.documentTypes);
    const tags = byName(metadata.tags);
    const body: Record<string, number | number[] | string | null | object[]> =
      {};

    if (patch.correspondent !== undefined) {
      body.correspondent =
        correspondents.get(patch.correspondent.toLocaleLowerCase()) ?? null;
    }
    if (patch.documentType !== undefined) {
      body.document_type =
        types.get(patch.documentType.toLocaleLowerCase()) ?? null;
    }
    if (patch.created !== undefined) body.created = patch.created;

    let tagIds =
      patch.tags !== undefined
        ? patch.tags
            .map((name) => tags.get(name.toLocaleLowerCase()))
            .filter((tag): tag is number => tag !== undefined)
        : [...current.tags];
    if (patch.status) {
      const configuredReviewTag = reviewTagName();
      let reviewTag = tags.get(configuredReviewTag.toLocaleLowerCase());
      if (patch.status === "review" && !reviewTag) {
        const createResponse = await paperlessFetch("/api/tags/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: configuredReviewTag,
            color: "#3b72d9",
            text_color: "#ffffff",
          }),
        });
        if (!createResponse.ok) {
          throw errorFromUpstream(
            createResponse,
            `Could not create the ${configuredReviewTag} tag.`,
          );
        }
        reviewTag = z
          .object({ id: z.number().int().positive() })
          .parse(await createResponse.json()).id;
      }
      tagIds =
        patch.status === "review" && reviewTag
          ? Array.from(new Set([...tagIds, reviewTag]))
          : tagIds.filter((tag) => tag !== reviewTag);
    }
    if (patch.tags !== undefined || patch.status !== undefined)
      body.tags = tagIds;

    if (patch.customFields !== undefined) {
      const definitions = new Map(
        metadata.customFields.map((definition) => [definition.id, definition]),
      );
      const seen = new Set<number>();
      for (const field of patch.customFields) {
        const definition = definitions.get(field.fieldId);
        if (
          !definition ||
          seen.has(field.fieldId) ||
          !customFieldValueIsValid(definition, field.value)
        ) {
          return apiError(
            "validation_failed",
            `The value for custom field ${definition?.name ?? field.fieldId} is invalid.`,
            400,
          );
        }
        seen.add(field.fieldId);
      }
      body.custom_fields = patch.customFields.map((field) => ({
        field: field.fieldId,
        value: field.value,
      }));
    }

    const response = await paperlessFetch(`/api/documents/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw errorFromUpstream(
        response,
        "Paperless could not save the document.",
      );
    }
    return new NextResponse(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return responseForError(error);
  }
}
