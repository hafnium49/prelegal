"use client";

import { useState } from "react";
import { MndaFormUI } from "@/components/MndaForm";
import { MndaPreview } from "@/components/MndaPreview";
import { defaultMndaForm, type MndaForm } from "@/lib/mnda";

export default function Home() {
  const [form, setForm] = useState<MndaForm>(defaultMndaForm);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="no-print flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Mutual NDA creator
            </h1>
            <p className="text-sm text-slate-600">
              Fill in the form to generate a Common Paper Mutual NDA. Use the
              download button to save it as a PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Download / Print PDF
          </button>
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
