"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UploadActivity as UploadActivityType } from "@/lib/types";
import {
  readUploadActivities,
  writeUploadActivities,
} from "@/lib/upload-activity";
import { cn } from "@/lib/utils";

export function useUploadActivities(onCompleted: () => void) {
  const [activities, setActivities] = useState<UploadActivityType[]>([]);
  const attempts = useRef(new Map<string, number>());

  useEffect(() => {
    setActivities(readUploadActivities(window.localStorage));
  }, []);

  const commit = useCallback(
    (
      update:
        | UploadActivityType[]
        | ((current: UploadActivityType[]) => UploadActivityType[]),
    ) => {
      setActivities((current) => {
        const next = typeof update === "function" ? update(current) : update;
        return writeUploadActivities(window.localStorage, next);
      });
    },
    [],
  );

  useEffect(() => {
    const pending = activities.filter(
      (activity) =>
        !activity.pollingPaused &&
        (activity.status === "queued" || activity.status === "processing"),
    );
    if (!pending.length) return;

    const attempt = Math.max(
      0,
      ...pending.map((activity) => attempts.current.get(activity.taskId) ?? 0),
    );
    const delay = attempt === 0 ? 1_000 : attempt === 1 ? 2_000 : 5_000;
    const timer = window.setTimeout(async () => {
      await Promise.all(
        pending.map(async (activity) => {
          const elapsed = Date.now() - new Date(activity.createdAt).valueOf();
          if (elapsed > 10 * 60 * 1_000) {
            commit((current) =>
              current.map((item) =>
                item.taskId === activity.taskId
                  ? {
                      ...item,
                      pollingPaused: true,
                      message:
                        "Still processing. Check again when Paperless has had more time.",
                    }
                  : item,
              ),
            );
            return;
          }
          try {
            const response = await fetch(`/api/tasks/${activity.taskId}`, {
              cache: "no-store",
            });
            if (!response.ok) return;
            const payload =
              (await response.json()) as Partial<UploadActivityType>;
            const now = new Date().toISOString();
            const becameCompleted =
              payload.status === "completed" && activity.status !== "completed";
            attempts.current.set(
              activity.taskId,
              (attempts.current.get(activity.taskId) ?? 0) + 1,
            );
            commit((current) =>
              current.map((item) =>
                item.taskId === activity.taskId
                  ? {
                      ...item,
                      status: payload.status ?? item.status,
                      documentId: payload.documentId ?? item.documentId,
                      message: payload.message,
                      updatedAt: now,
                    }
                  : item,
              ),
            );
            if (becameCompleted) onCompleted();
          } catch {
            // A transient Studio/network failure is not an upload failure.
          }
        }),
      );
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activities, commit, onCompleted]);

  return {
    activities,
    add(fileName: string, taskId: string) {
      const now = new Date().toISOString();
      commit((current) => [
        {
          taskId,
          fileName,
          createdAt: now,
          updatedAt: now,
          status: "queued",
        },
        ...current.filter((item) => item.taskId !== taskId),
      ]);
    },
    dismiss(taskId: string) {
      commit((current) => current.filter((item) => item.taskId !== taskId));
    },
    clearCompleted() {
      commit((current) =>
        current.filter(
          (item) => item.status === "queued" || item.status === "processing",
        ),
      );
    },
    retry(taskId: string) {
      attempts.current.set(taskId, 0);
      commit((current) =>
        current.map((item) =>
          item.taskId === taskId
            ? { ...item, pollingPaused: false, message: undefined }
            : item,
        ),
      );
    },
  };
}

type Props = {
  open: boolean;
  activities: UploadActivityType[];
  onToggle: () => void;
  onDismiss: (taskId: string) => void;
  onClearCompleted: () => void;
  onRetry: (taskId: string) => void;
  onOpenDocument: (documentId: number) => void;
};

export function UploadActivity({
  open,
  activities,
  onToggle,
  onDismiss,
  onClearCompleted,
  onRetry,
  onOpenDocument,
}: Props) {
  const activeCount = activities.filter(
    (item) => item.status === "queued" || item.status === "processing",
  ).length;
  const hasCompleted = activities.some(
    (item) => item.status !== "queued" && item.status !== "processing",
  );

  return (
    <div className="sidebar-popover-wrap">
      <button
        className={cn("nav-item", open && "is-active")}
        aria-expanded={open}
        aria-controls="upload-activity"
        onClick={onToggle}
      >
        <Clock3 size={17} />
        <span>Activity</span>
        {activeCount ? <em>{activeCount}</em> : null}
      </button>
      {open ? (
        <div
          id="upload-activity"
          className="sidebar-popover activity-popover"
          aria-live="polite"
        >
          <div className="activity-heading">
            <strong>Upload activity</strong>
            {hasCompleted ? (
              <button onClick={onClearCompleted}>Clear completed</button>
            ) : null}
          </div>
          {activities.length ? (
            <div className="activity-list">
              {activities.map((activity) => {
                const active =
                  activity.status === "queued" ||
                  activity.status === "processing";
                const failed =
                  activity.status === "failed" ||
                  activity.status === "cancelled";
                return (
                  <article key={activity.taskId} className="activity-item">
                    <span
                      className={cn(
                        "activity-status",
                        active && "is-active",
                        failed && "is-failed",
                      )}
                    >
                      {active ? (
                        <LoaderCircle size={14} />
                      ) : failed ? (
                        <CircleAlert size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                    </span>
                    <div>
                      <strong title={activity.fileName}>
                        {activity.fileName}
                      </strong>
                      <small>
                        {activity.pollingPaused
                          ? "Check paused"
                          : activity.status === "queued"
                            ? "Queued in Paperless"
                            : activity.status === "processing"
                              ? "OCR and matching in progress"
                              : activity.status === "completed"
                                ? "Ready in Paperless"
                                : activity.message || "Consumption failed"}
                      </small>
                    </div>
                    <div className="activity-actions">
                      {activity.documentId ? (
                        <button
                          aria-label={`Open ${activity.fileName}`}
                          onClick={() =>
                            onOpenDocument(activity.documentId as number)
                          }
                        >
                          <ChevronRight size={14} />
                        </button>
                      ) : null}
                      {activity.pollingPaused || failed ? (
                        <button
                          aria-label={`Retry ${activity.fileName}`}
                          onClick={() => onRetry(activity.taskId)}
                        >
                          <RotateCw size={13} />
                        </button>
                      ) : null}
                      {!active ? (
                        <button
                          aria-label={`Dismiss ${activity.fileName}`}
                          onClick={() => onDismiss(activity.taskId)}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="activity-empty">
              <Trash2 size={16} />
              <span>
                Uploads will appear here while Paperless processes them.
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
