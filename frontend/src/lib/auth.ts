import { apiFetch } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>("/api/auth/me");
  } catch {
    return null;
  }
}

export function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}
