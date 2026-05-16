import type { MndaForm } from "./mnda";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type PartyInfoUpdate = {
  company?: string | null;
  printName?: string | null;
  title?: string | null;
  noticeAddress?: string | null;
};

export type MndaFormUpdate = {
  purpose?: string | null;
  effectiveDate?: string | null;
  termKind?: "years" | "until_terminated" | null;
  termYears?: number | null;
  confidentialityKind?: "years" | "perpetual" | null;
  confidentialityYears?: number | null;
  governingLaw?: string | null;
  jurisdiction?: string | null;
  modifications?: string | null;
  party1?: PartyInfoUpdate | null;
  party2?: PartyInfoUpdate | null;
};

export type ChatResponse = {
  reply: string;
  form_updates: MndaFormUpdate;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChat(
  messages: ChatMessage[],
  form: MndaForm,
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

type NonNullish<T> = { [K in keyof T]: NonNullable<T[K]> };

function dropNullish<T extends object>(obj: T): Partial<NonNullish<T>> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<NonNullish<T>>;
}

export function mergeFormUpdates(
  current: MndaForm,
  updates: MndaFormUpdate,
): MndaForm {
  const next: MndaForm = { ...current };
  for (const [key, value] of Object.entries(dropNullish(updates))) {
    if (key === "party1" || key === "party2") {
      next[key] = {
        ...current[key],
        ...dropNullish(value as PartyInfoUpdate),
      };
    } else {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
