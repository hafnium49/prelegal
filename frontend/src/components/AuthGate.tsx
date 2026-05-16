"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

type Props = {
  children: (user: AuthUser) => ReactNode;
};

export function AuthGate({ children }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        if (!u) {
          router.replace("/login");
          return;
        }
        setUser(u);
        setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-[#888888]">
        Loading…
      </div>
    );
  }
  return <>{children(user)}</>;
}
