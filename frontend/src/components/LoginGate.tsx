"use client";

import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { readSession, type Session } from "@/lib/session";

const STORAGE_KEY = "prelegal.user";

// Cache the parsed snapshot so getSnapshot is referentially stable between
// renders (useSyncExternalStore requires this to avoid infinite loops).
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;
let cacheInitialized = false;

function getSnapshot(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (cacheInitialized && raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = readSession();
  cacheInitialized = true;
  return cachedSession;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): Session | null {
  return null;
}

type Props = {
  children: (session: Session) => ReactNode;
};

export function LoginGate({ children }: Props) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  return <>{children(session)}</>;
}
