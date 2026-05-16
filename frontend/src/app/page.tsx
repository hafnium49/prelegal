"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MndaFormUI } from "@/components/MndaForm";
import { MndaPreview } from "@/components/MndaPreview";
import { LoginGate } from "@/components/LoginGate";
import { defaultMndaForm, type MndaForm } from "@/lib/mnda";
import { clearSession } from "@/lib/session";

export default function Home() {
  return (
    <LoginGate>
      {(session) => <MndaWorkspace userName={session.name} />}
    </LoginGate>
  );
}

function MndaWorkspace({ userName }: { userName: string }) {
  const router = useRouter();
  const [form, setForm] = useState<MndaForm>(defaultMndaForm);

  const signOut = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="no-print flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#032147]">
              Mutual NDA creator
            </h1>
            <p className="text-sm text-slate-600">
              Fill in the form to generate a Common Paper Mutual NDA. Use the
              download button to save it as a PDF.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              Signed in as{" "}
              <strong className="font-medium">{userName}</strong>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5e2c75] focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2"
            >
              Download / Print PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className="no-print h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-4">
            <MndaFormUI
              form={form}
              onChange={setForm}
              onReset={() => setForm(defaultMndaForm())}
            />
          </section>
          <section className="document-pane">
            <MndaPreview form={form} />
          </section>
        </div>
      </div>
    </main>
  );
}
