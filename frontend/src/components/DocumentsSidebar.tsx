"use client";

import type { DocumentSummary } from "@/lib/myDocuments";

type Props = {
  docs: DocumentSummary[];
  currentDocId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  loading: boolean;
};

export function DocumentsSidebar({
  docs,
  currentDocId,
  onSelect,
  onNew,
  onDelete,
  loading,
}: Props) {
  return (
    <aside className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#209dd7] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1788bd] focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:ring-offset-2"
        >
          <span aria-hidden>+</span> New document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">
          My documents
        </p>
        {loading && docs.length === 0 && (
          <p className="px-2 py-1 text-sm text-[#888888]">Loading…</p>
        )}
        {!loading && docs.length === 0 && (
          <p className="px-2 py-3 text-sm text-[#888888]">
            No drafts yet. Click <strong>New document</strong> to start one.
          </p>
        )}
        <ul className="space-y-1">
          {docs.map((d) => (
            <li key={d.id}>
              <DocItem
                doc={d}
                selected={d.id === currentDocId}
                onSelect={() => onSelect(d.id)}
                onDelete={() => onDelete(d.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function DocItem({
  doc,
  selected,
  onSelect,
  onDelete,
}: {
  doc: DocumentSummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const updated = new Date(doc.updated_at + "Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <div
      className={`group flex items-start justify-between gap-2 rounded-md px-2 py-2 transition ${
        selected
          ? "bg-[#209dd7]/10 ring-1 ring-[#209dd7]/40"
          : "hover:bg-slate-100"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left focus:outline-none"
      >
        <p className="text-sm font-medium text-[#032147] line-clamp-2">
          {doc.title}
        </p>
        <p className="mt-0.5 text-xs text-[#888888]">{updated}</p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${doc.title}`}
        className="rounded p-1 text-[#888888] opacity-0 transition hover:bg-rose-50 hover:text-rose-700 focus:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
