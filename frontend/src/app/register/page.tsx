"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-[#209dd7]/10 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-[#032147]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[#888888]">
            Draft Common Paper legal agreements in minutes.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Full name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                disabled={pending}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-2 focus:ring-[#209dd7]/30 disabled:bg-slate-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={pending}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-2 focus:ring-[#209dd7]/30 disabled:bg-slate-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-2 focus:ring-[#209dd7]/30 disabled:bg-slate-50"
              />
              <p className="mt-1 text-xs text-[#888888]">
                At least 8 characters.
              </p>
            </label>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-[#753991] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e2c75] focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-50"
            >
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#209dd7] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
