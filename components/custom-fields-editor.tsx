"use client";

import { ExternalLink, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  CustomFieldDefinition,
  CustomFieldValue,
  DocumentCustomField,
} from "@/lib/types";
import { studioDocumentPath } from "@/lib/paperless-links";
import { cn } from "@/lib/utils";

type Props = {
  definitions: CustomFieldDefinition[];
  fields: DocumentCustomField[];
  canEdit: boolean;
  onChange: (fields: DocumentCustomField[]) => Promise<boolean>;
};

function hasValue(value: CustomFieldValue) {
  return (
    value !== null &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0)
  );
}

export function CustomFieldsEditor({
  definitions,
  fields,
  canEdit,
  onChange,
}: Props) {
  const [drafts, setDrafts] = useState(fields);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [failed, setFailed] = useState<number | null>(null);

  useEffect(() => setDrafts(fields), [fields]);

  const byId = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );
  const available = definitions.filter(
    (definition) =>
      definition.dataType !== "documentlink" &&
      !drafts.some((field) => field.fieldId === definition.id),
  );

  async function commit(next: DocumentCustomField[], fieldId: number) {
    const previous = drafts;
    setDrafts(next);
    setSaving(fieldId);
    setFailed(null);
    const saved = await onChange(next);
    if (!saved) {
      setDrafts(previous);
      setFailed(fieldId);
    }
    setSaving(null);
  }

  function updateDraft(fieldId: number, value: CustomFieldValue) {
    setDrafts((current) =>
      current.map((field) =>
        field.fieldId === fieldId ? { ...field, value } : field,
      ),
    );
  }

  async function remove(field: DocumentCustomField) {
    if (
      hasValue(field.value) &&
      !window.confirm("Remove this custom field and its value?")
    ) {
      return;
    }
    await commit(
      drafts.filter((item) => item.fieldId !== field.fieldId),
      field.fieldId,
    );
  }

  return (
    <div className="inspector-section custom-fields-section">
      <div className="section-heading">
        <h3>Custom fields</h3>
        {canEdit && available.length ? (
          <button
            className="section-add"
            aria-expanded={adding}
            onClick={() => setAdding((current) => !current)}
          >
            <Plus size={14} />
            Add
          </button>
        ) : null}
      </div>
      {adding ? (
        <div className="custom-field-picker">
          <span>Add a field</span>
          {available.map((definition) => (
            <button
              key={definition.id}
              onClick={() => {
                void commit(
                  [...drafts, { fieldId: definition.id, value: null }],
                  definition.id,
                );
                setAdding(false);
              }}
            >
              {definition.name}
              <small>{definition.dataType}</small>
            </button>
          ))}
        </div>
      ) : null}
      {drafts.length ? (
        <div className="custom-field-list">
          {drafts.map((field) => {
            const definition = byId.get(field.fieldId);
            if (!definition) return null;
            return (
              <div
                key={field.fieldId}
                className={cn(
                  "custom-field",
                  saving === field.fieldId && "is-saving",
                  failed === field.fieldId && "has-error",
                )}
              >
                <div className="custom-field-label">
                  <label htmlFor={`custom-field-${field.fieldId}`}>
                    {definition.name}
                  </label>
                  {canEdit ? (
                    <button
                      aria-label={`Remove ${definition.name}`}
                      onClick={() => void remove(field)}
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
                <CustomFieldControl
                  definition={definition}
                  value={field.value}
                  disabled={!canEdit || saving === field.fieldId}
                  onDraft={(value) => updateDraft(field.fieldId, value)}
                  onCommit={(value) => {
                    const next = drafts.map((item) =>
                      item.fieldId === field.fieldId
                        ? { ...item, value }
                        : item,
                    );
                    void commit(next, field.fieldId);
                  }}
                />
                <small className="custom-field-state">
                  {saving === field.fieldId
                    ? "Saving…"
                    : failed === field.fieldId
                      ? "Couldn’t save. Your previous value was restored."
                      : ""}
                </small>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="custom-fields-empty">
          {canEdit
            ? "No custom fields yet. Add one without leaving this document."
            : "No custom fields are assigned."}
        </p>
      )}
    </div>
  );
}

type ControlProps = {
  definition: CustomFieldDefinition;
  value: CustomFieldValue;
  disabled: boolean;
  onDraft: (value: CustomFieldValue) => void;
  onCommit: (value: CustomFieldValue) => void;
};

function CustomFieldControl({
  definition,
  value,
  disabled,
  onDraft,
  onCommit,
}: ControlProps) {
  const id = `custom-field-${definition.id}`;
  const common = {
    id,
    disabled,
    "aria-invalid": undefined,
  };

  if (definition.dataType === "documentlink") {
    const documentLinks = Array.isArray(value)
      ? value.flatMap((documentId) => {
          const href = studioDocumentPath(documentId);
          return href ? [{ documentId, href }] : [];
        })
      : [];
    return (
      <div className="document-links" id={id}>
        {documentLinks.length
          ? documentLinks.map(({ documentId, href }) => (
              <a key={documentId} href={href}>
                Document {documentId}
                <ExternalLink size={11} />
              </a>
            ))
          : "No linked documents"}
      </div>
    );
  }
  if (definition.dataType === "boolean") {
    return (
      <select
        {...common}
        value={value === null ? "" : String(value)}
        onChange={(event) => {
          const next =
            event.target.value === "" ? null : event.target.value === "true";
          onDraft(next);
          onCommit(next);
        }}
      >
        <option value="">Not set</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (definition.dataType === "select") {
    return (
      <select
        {...common}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => {
          const next = event.target.value || null;
          onDraft(next);
          onCommit(next);
        }}
      >
        <option value="">Not set</option>
        {definition.options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  if (definition.dataType === "longtext") {
    return (
      <textarea
        {...common}
        rows={3}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onDraft(event.target.value || null)}
        onBlur={() => onCommit(value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  const numeric =
    definition.dataType === "integer" || definition.dataType === "float";
  return (
    <input
      {...common}
      type={
        definition.dataType === "date"
          ? "date"
          : definition.dataType === "url"
            ? "url"
            : numeric
              ? "number"
              : "text"
      }
      step={definition.dataType === "integer" ? 1 : numeric ? "any" : undefined}
      maxLength={definition.dataType === "string" ? 128 : undefined}
      placeholder={
        definition.dataType === "monetary"
          ? `${definition.defaultCurrency ?? "EUR"} 0.00`
          : "Not set"
      }
      value={value === null || Array.isArray(value) ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        const next = numeric ? (raw === "" ? null : Number(raw)) : raw || null;
        onDraft(next);
      }}
      onBlur={(event) => {
        let next: CustomFieldValue =
          numeric && event.target.value !== ""
            ? Number(event.target.value)
            : event.target.value || null;
        if (
          definition.dataType === "monetary" &&
          typeof next === "string" &&
          /^-?\d/.test(next)
        ) {
          next = `${definition.defaultCurrency ?? "EUR"}${next}`;
          onDraft(next);
        }
        onCommit(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
