"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPane } from "@/components/ChatPane";
import { DocumentPreview } from "@/components/DocumentPreview";
import { LoginGate } from "@/components/LoginGate";
import {
  fetchDocuments,
  fetchTemplate,
  type DocumentSpec,
  type FormState,
} from "@/lib/documents";
import { clearSession } from "@/lib/session";

export default function Home() {
  return (
    <LoginGate>
      {(session) => <Workspace userName={session.name} />}
    </LoginGate>
  );
}

function Workspace({ userName }: { userName: string }) {
  const router = useRouter();
  const [specs, setSpecs] = useState<DocumentSpec[]>([]);
  const [form, setForm] = useState<FormState>({
    document_type: null,
    field_values: {},
    parties: [],
  });
  const [templateMarkdown, setTemplateMarkdown] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments()
      .then(setSpecs)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load catalog"),
      );
  }, []);

  useEffect(() => {
    if (!form.document_type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing template markdown to selected doc type; async fetch result also goes through setState
      setTemplateMarkdown("");
      return;
    }
    const controller = new AbortController();
    fetchTemplate(form.document_type, controller.signal)
      .then(setTemplateMarkdown)
      .catch((err) => {
        if (err?.name !== "AbortError") setTemplateMarkdown("");
      });
    return () => controller.abort();
  }, [form.document_type]);

  const signOut = () => {
    clearSession();
    router.replace("/login");
  };

  const selectedSpec = specs.find((s) => s.id === form.document_type) ?? null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="no-print flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#032147]">
              Prelegal — legal document creator
            </h1>
            <p className="text-sm text-[#888888]">
              Chat with the assistant to choose and fill out any supported
              Common Paper template. Use the download button to save as PDF.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#888888] sm:inline">
              Signed in as{" "}
              <strong className="font-medium text-slate-700">{userName}</strong>
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
              disabled={!selectedSpec}
              className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5e2c75] focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-50"
            >
              Download / Print PDF
            </button>
          </div>
        </header>

        {loadError && (
          <div className="no-print rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <section className="no-print h-[calc(100vh-12rem)] lg:sticky lg:top-4">
            <ChatPane form={form} specs={specs} onFormUpdate={setForm} />
          </section>
          <section className="document-pane">
            <DocumentPreview
              spec={selectedSpec}
              form={form}
              templateMarkdown={templateMarkdown}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
