export type FieldType = "text" | "long_text" | "date" | "number" | "choice";

export type DocumentField = {
  key: string;
  label: string;
  hint: string;
  type: FieldType;
  choices?: string[] | null;
  required: boolean;
};

export type DocumentSpec = {
  id: string;
  name: string;
  description: string;
  filename: string;
  source_url: string;
  fields: DocumentField[];
  party_roles: string[];
};

export type PartyValue = {
  company?: string | null;
  printName?: string | null;
  title?: string | null;
  noticeAddress?: string | null;
};

export type FormState = {
  document_type: string | null;
  field_values: Record<string, string | number | null>;
  parties: (PartyValue | null)[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchCatalog(): Promise<DocumentSpec[]> {
  const res = await fetch(`${API_BASE}/api/catalog`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`/api/catalog failed: ${res.status}`);
  return (await res.json()) as DocumentSpec[];
}

export async function fetchTemplate(
  docId: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/catalog/${docId}/template`, {
    signal,
    credentials: "include",
  });
  if (!res.ok)
    throw new Error(`/api/catalog/${docId}/template failed: ${res.status}`);
  const body = (await res.json()) as { markdown: string };
  return body.markdown;
}
