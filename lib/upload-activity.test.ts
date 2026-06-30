import { describe, expect, it } from "vitest";
import {
  compactUploadActivities,
  mapTaskStatus,
  readUploadActivities,
  writeUploadActivities,
} from "@/lib/upload-activity";
import type { UploadActivity } from "@/lib/types";

function activity(
  taskId: string,
  status: UploadActivity["status"],
  updatedAt: string,
): UploadActivity {
  return {
    taskId,
    fileName: `${taskId}.pdf`,
    createdAt: updatedAt,
    updatedAt,
    status,
  };
}

describe("upload activity", () => {
  it("maps Paperless task states", () => {
    expect(mapTaskStatus("PENDING")).toBe("queued");
    expect(mapTaskStatus("STARTED")).toBe("processing");
    expect(mapTaskStatus("RETRY")).toBe("processing");
    expect(mapTaskStatus("SUCCESS")).toBe("completed");
    expect(mapTaskStatus("FAILURE")).toBe("failed");
    expect(mapTaskStatus("REVOKED")).toBe("cancelled");
  });

  it("keeps every active task and only twenty terminal tasks", () => {
    const values = [
      activity("active", "processing", "2026-01-01T00:00:00.000Z"),
      ...Array.from({ length: 24 }, (_, index) =>
        activity(
          `done-${index}`,
          "completed",
          `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        ),
      ),
    ];
    const compacted = compactUploadActivities(values);
    expect(compacted).toHaveLength(21);
    expect(compacted.some((item) => item.taskId === "active")).toBe(true);
    expect(compacted.some((item) => item.taskId === "done-0")).toBe(false);
  });

  it("round-trips persisted activity and ignores corrupt data", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    writeUploadActivities(storage, [
      activity("task", "queued", "2026-01-01T00:00:00.000Z"),
    ]);
    expect(readUploadActivities(storage)).toHaveLength(1);
    store.set("paperless-studio:uploads:v1", "{");
    expect(readUploadActivities(storage)).toEqual([]);
  });
});
