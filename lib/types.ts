export type DocumentStatus = "review" | "ready";

export type CustomFieldDataType =
  | "string"
  | "url"
  | "date"
  | "boolean"
  | "integer"
  | "float"
  | "monetary"
  | "documentlink"
  | "select"
  | "longtext";

export type CustomFieldValue = string | number | boolean | number[] | null;

export type CustomFieldDefinition = {
  id: number;
  name: string;
  dataType: CustomFieldDataType;
  options?: Array<{ id: string; label: string }>;
  defaultCurrency?: string;
};

export type DocumentCustomField = {
  fieldId: number;
  value: CustomFieldValue;
};

export type PaperlessDocument = {
  id: number;
  title: string;
  correspondent: string;
  documentType: string;
  tags: string[];
  created: string;
  added: string;
  pages: number;
  format: string;
  status: DocumentStatus;
  note?: string;
  sourceUrl?: string;
  canEdit: boolean;
  customFields?: DocumentCustomField[];
  accent: "blue" | "ochre" | "sage" | "plum" | "slate";
};

export type DocumentDetail = PaperlessDocument & {
  customFields: DocumentCustomField[];
  customFieldDefinitions: CustomFieldDefinition[];
};

export type ApiErrorCode =
  | "authentication_required"
  | "paperless_authentication_failed"
  | "permission_denied"
  | "not_configured"
  | "not_found"
  | "rate_limited"
  | "validation_failed"
  | "timeout"
  | "upstream_unavailable"
  | "incompatible_response";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type UploadStatus =
  "queued" | "processing" | "completed" | "failed" | "cancelled";

export type UploadActivity = {
  taskId: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  status: UploadStatus;
  documentId?: number;
  message?: string;
  pollingPaused?: boolean;
};

export type NavView =
  "inbox" | "recent" | "review" | "all" | "finance" | "personal" | "work";
