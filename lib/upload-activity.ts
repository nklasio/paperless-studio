import type { UploadActivity, UploadStatus } from "@/lib/types";

export const UPLOAD_STORAGE_KEY = "paperless-studio:uploads:v1";
const MAX_COMPLETED = 20;

export function mapTaskStatus(status: string): UploadStatus {
  if (status === "SUCCESS") return "completed";
  if (status === "FAILURE") return "failed";
  if (status === "REVOKED") return "cancelled";
  if (status === "STARTED" || status === "RETRY") return "processing";
  return "queued";
}

export function compactUploadActivities(items: UploadActivity[]) {
  const active = items.filter(
    (item) => item.status === "queued" || item.status === "processing",
  );
  const completed = items
    .filter((item) => item.status !== "queued" && item.status !== "processing")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_COMPLETED);
  return [...active, ...completed].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function readUploadActivities(storage: Pick<Storage, "getItem">) {
  try {
    const value = JSON.parse(storage.getItem(UPLOAD_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return compactUploadActivities(
      value.filter(
        (item): item is UploadActivity =>
          item &&
          typeof item.taskId === "string" &&
          typeof item.fileName === "string" &&
          typeof item.createdAt === "string" &&
          typeof item.updatedAt === "string" &&
          ["queued", "processing", "completed", "failed", "cancelled"].includes(
            item.status,
          ),
      ),
    );
  } catch {
    return [];
  }
}

export function writeUploadActivities(
  storage: Pick<Storage, "setItem">,
  items: UploadActivity[],
) {
  const compacted = compactUploadActivities(items);
  storage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(compacted));
  return compacted;
}
