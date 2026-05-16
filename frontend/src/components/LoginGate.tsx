"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readSession, type Session } from "@/lib/session";

type Props = {
  children: (session: Session) => ReactNode;
};

export function LoginGate({ children }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = readSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount-time read from localStorage; useSyncExternalStore is overkill for a fake-login gate
    setSession(s);
  }, [router]);

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#888888]">
        Loading…
      </div>
    );
  }
  return <>{children(session)}</>;
}
