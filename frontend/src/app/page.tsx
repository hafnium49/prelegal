"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { ChatPane } from "@/components/ChatPane";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DocumentsSidebar } from "@/components/DocumentsSidebar";
import { Wordmark } from "@/components/Wordmark";
import { logout, type AuthUser } from "@/lib/auth";
import {
  fetchCatalog,
  fetchTemplate,
  type DocumentSpec,
  type FormState,
} from "@/lib/documents";
import {
  createMyDocument,
  deleteMyDocument,
  getMyDocument,
  listMyDocuments,
  updateMyDocument,
  type DocumentSummary,
} from "@/lib/myDocuments";

const EMPTY_FORM: FormState = {
  document_type: null,
  field_values: {},
  parties: [],
};

export default function Home() {
  return <AuthGate>{(user) => <Workspace user={user} />}</AuthGate>;
}

function generateTitle(spec: DocumentSpec | null, form: FormState): string {
  if (!spec) return "Untitled draft";
  const company =
    form.parties?.[0]?.company || form.parties?.[1]?.company || null;
  return company ? `${spec.name} — ${company}` : `Untitled ${spec.name}`;
}

function Workspace({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [specs, setSpecs] = useState<DocumentSpec[]>([]);
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [currentDocId, setCurrentDocIdState] = useState<number | null>(null);
  // Synchronously-updated mirror of currentDocId so the auto-save callback can
  // tell "we already POSTed once" even before React commits the state update —
  // prevents duplicate-document creation when a debounced timer fires
  // between the POST resolving and the next render.
  const currentDocIdRef = useRef<number | null>(null);
  const setCurrentDocId = useCallback((id: number | null) => {
    currentDocIdRef.current = id;
    setCurrentDocIdState(id);
  }, []);
  const [chatKey, setChatKey] = useState(0);
  const [templateMarkdown, setTemplateMarkdown] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then(setSpecs)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load catalog"),
      );
  }, []);

  const refreshDocs = useCallback(async () => {
    try {
      const list = await listMyDocuments();
      setDocs(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot initial fetch on mount; refreshDocs setState calls happen in async .then chain
    refreshDocs();
  }, [refreshDocs]);

  useEffect(() => {
    if (!form.document_type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const selectedSpec =
    specs.find((s) => s.id === form.document_type) ?? null;

  // Debounced auto-save: persist whenever the form has a document_type.
  useEffect(() => {
    if (!form.document_type) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const title = generateTitle(selectedSpec, form);
      try {
        if (currentDocIdRef.current === null) {
          const created = await createMyDocument({
            document_type: form.document_type,
            title,
            form_state: form,
          });
          setCurrentDocId(created.id);
        } else {
          await updateMyDocument(currentDocIdRef.current, {
            document_type: form.document_type,
            title,
            form_state: form,
          });
        }
        await refreshDocs();
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Auto-save failed");
      }
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form, selectedSpec, refreshDocs, setCurrentDocId]);

  const onNew = () => {
    setCurrentDocId(null);
    setForm(EMPTY_FORM);
    setChatKey((k) => k + 1);
  };

  const onSelectDoc = async (id: number) => {
    try {
      const doc = await getMyDocument(id);
      setCurrentDocId(doc.id);
      setForm(doc.form_state);
      setChatKey((k) => k + 1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not open draft");
    }
  };

  const onDeleteDoc = async (id: number) => {
    try {
      await deleteMyDocument(id);
      if (currentDocId === id) {
        setCurrentDocId(null);
        setForm(EMPTY_FORM);
        setChatKey((k) => k + 1);
      }
      await refreshDocs();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:px-6">
        <Wordmark size="md" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#888888] sm:inline">
            Signed in as{" "}
            <strong className="font-medium text-slate-700">{user.name}</strong>
          </span>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!selectedSpec}
            className="rounded-md bg-[#753991] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e2c75] focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-50"
          >
            Download / Print PDF
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
        <DisclaimerBanner />

        {loadError && (
          <div className="no-print rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,440px)_minmax(0,1fr)]">
          <section className="no-print h-[calc(100vh-12rem)] lg:sticky lg:top-20">
            <DocumentsSidebar
              docs={docs}
              currentDocId={currentDocId}
              onSelect={onSelectDoc}
              onNew={onNew}
              onDelete={onDeleteDoc}
              loading={docsLoading}
            />
          </section>
          <section className="no-print h-[calc(100vh-12rem)] lg:sticky lg:top-20">
            <ChatPane
              key={chatKey}
              form={form}
              specs={specs}
              onFormUpdate={setForm}
            />
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
