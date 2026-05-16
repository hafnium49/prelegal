import type { DocumentSpec, FormState, PartyValue } from "./documents";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatResponse = {
  reply: string;
  form_updates: FormState;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChat(
  messages: ChatMessage[],
  form: FormState,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, form }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Chat request failed (${res.status})${body ? `: ${body}` : ""}`,
    );
  }
  return (await res.json()) as ChatResponse;
}

export function mergeFormUpdates(
  current: FormState,
  updates: FormState,
  specs: DocumentSpec[],
): FormState {
  const next: FormState = {
    document_type: current.document_type,
    field_values: { ...current.field_values },
    parties: [...current.parties],
  };

  if (updates.document_type && updates.document_type !== current.document_type) {
    next.document_type = updates.document_type;
    const spec = specs.find((s) => s.id === updates.document_type);
    if (spec) {
      const len = spec.party_roles.length;
      next.parties =
        next.parties.length >= len
          ? next.parties.slice(0, len)
          : [
              ...next.parties,
              ...Array(len - next.parties.length).fill(null),
            ];
    }
  }

  if (updates.field_values) {
    for (const [key, value] of Object.entries(updates.field_values)) {
      if (value === null || value === undefined) continue;
      next.field_values[key] = value;
    }
  }

  if (Array.isArray(updates.parties)) {
    for (let i = 0; i < updates.parties.length; i++) {
      const update = updates.parties[i];
      if (!update) continue;
      const merged: PartyValue = { ...(next.parties[i] ?? {}) };
      for (const [k, v] of Object.entries(update)) {
        if (v === null || v === undefined) continue;
        (merged as Record<string, unknown>)[k] = v;
      }
      next.parties[i] = merged;
    }
  }

  return next;
}
