const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b) => b?.detail)
      .catch(() => null);
    throw new Error(detail || `${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}
