import { apiFetch } from "./api";
import type { FormState } from "./documents";

export type DocumentSummary = {
  id: number;
  document_type: string | null;
  title: string;
  updated_at: string;
};

export type DocumentRecord = DocumentSummary & {
  form_state: FormState;
  created_at: string;
};

type Upsert = {
  document_type: string | null;
  title: string;
  form_state: FormState;
};

export const listMyDocuments = (): Promise<DocumentSummary[]> =>
  apiFetch<DocumentSummary[]>("/api/my-documents");

export const getMyDocument = (id: number): Promise<DocumentRecord> =>
  apiFetch<DocumentRecord>(`/api/my-documents/${id}`);

export const createMyDocument = (payload: Upsert): Promise<DocumentRecord> =>
  apiFetch<DocumentRecord>("/api/my-documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateMyDocument = (
  id: number,
  payload: Upsert,
): Promise<DocumentRecord> =>
  apiFetch<DocumentRecord>(`/api/my-documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteMyDocument = (id: number): Promise<void> =>
  apiFetch<void>(`/api/my-documents/${id}`, { method: "DELETE" });
