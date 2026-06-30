import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  errorFromUpstream,
  responseForError,
} from "@/lib/api-errors";
import { requireDocumentAuthentication } from "@/lib/auth-route";
import { collectionSchema, taskSchema } from "@/lib/paperless-contracts";
import { paperlessConfiguration, paperlessFetch } from "@/lib/paperless-api";
import { mapTaskStatus } from "@/lib/upload-activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;
  if (!paperlessConfiguration()) {
    return apiError("not_configured", "Paperless is not configured.", 503);
  }
  const { taskId } = await params;
  if (!z.string().uuid().safeParse(taskId).success) {
    return apiError("validation_failed", "Invalid upload task ID.", 400);
  }

  try {
    const response = await paperlessFetch(
      `/api/tasks/?task_id=${encodeURIComponent(taskId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      throw errorFromUpstream(response, "Could not load upload progress.");
    }
    const payload = collectionSchema(taskSchema).parse(await response.json());
    const task = payload.results[0];
    if (!task) {
      return NextResponse.json({
        taskId,
        status: "queued",
        message: "Waiting for Paperless to register the task.",
      });
    }
    const relatedDocument = task.related_document?.match(/\d+$/)?.[0];
    const resultDocument =
      task.status === "SUCCESS" ? task.result?.match(/\d+/)?.[0] : undefined;
    return NextResponse.json({
      taskId,
      fileName: task.task_file_name,
      status: mapTaskStatus(task.status),
      documentId: Number(relatedDocument ?? resultDocument) || undefined,
      message:
        task.status === "FAILURE"
          ? task.result || "Paperless could not consume this document."
          : undefined,
    });
  } catch (error) {
    return responseForError(error);
  }
}
