"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { writeSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    writeSession({ name: name.trim(), email: email.trim() });
    router.replace("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#032147]">
          Sign in to Prelegal
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Foundation prototype — any name and email will let you in.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
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
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5e2c75] focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
