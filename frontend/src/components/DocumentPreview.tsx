"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type {
  DocumentField,
  DocumentSpec,
  FormState,
  PartyValue,
} from "@/lib/documents";
import { DisclaimerFooter } from "./DisclaimerBanner";

type Props = {
  spec: DocumentSpec | null;
  form: FormState;
  templateMarkdown: string;
};

export function DocumentPreview({ spec, form, templateMarkdown }: Props) {
  if (!spec) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-12 text-center text-[#888888]">
        <p className="text-base">Chat with the assistant to choose a document.</p>
        <p className="mt-2 text-sm">
          Once a template is selected it will preview here, updating live as you
          answer questions.
        </p>
      </div>
    );
  }

  return (
    <article
      id="generated-document"
      className="generated-document mx-auto max-w-3xl bg-white p-10 text-[0.95rem] leading-relaxed text-slate-800 shadow-sm"
    >
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#032147]">
          {spec.name}
        </h1>
      </header>

      <CoverPage spec={spec} form={form} />

      <SignatureBlock spec={spec} parties={form.parties} />

      <hr className="my-10 border-slate-300" />

      <section className="document-body prose prose-slate max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
          {templateMarkdown}
        </ReactMarkdown>
      </section>

      <DisclaimerFooter />
    </article>
  );
}

function CoverPage({ spec, form }: { spec: DocumentSpec; form: FormState }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
        Cover Page
      </h2>
      <dl>
        {spec.fields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={form.field_values[field.key]}
          />
        ))}
      </dl>
    </section>
  );
}

function FieldRow({
  field,
  value,
}: {
  field: DocumentField;
  value: string | number | null | undefined;
}) {
  const filled = value !== null && value !== undefined && String(value).trim() !== "";
  return (
    <div className="mb-4 border-l-2 border-slate-200 pl-4">
      <dt className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        {field.label}
        {!field.required && (
          <span className="ml-2 text-xs font-normal text-[#888888]">
            (optional)
          </span>
        )}
      </dt>
      {field.hint && <p className="text-xs text-[#888888]">{field.hint}</p>}
      <dd className="mt-1 text-slate-800">
        {filled ? (
          <span className="font-medium text-slate-900">{String(value)}</span>
        ) : (
          <span className="italic text-slate-400">[{field.label}]</span>
        )}
      </dd>
    </div>
  );
}

function SignatureBlock({
  spec,
  parties,
}: {
  spec: DocumentSpec;
  parties: (PartyValue | null)[];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
        Signatures
      </h2>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-1/5 border border-slate-300 bg-slate-50 p-2 text-left font-semibold text-slate-700"></th>
            {spec.party_roles.map((role) => (
              <th
                key={role}
                className="border border-slate-300 bg-slate-50 p-2 text-left font-semibold text-slate-700"
              >
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["company", "printName", "title", "noticeAddress"] as const).map(
            (key) => (
              <tr key={key}>
                <th className="border border-slate-300 p-2 text-left align-top font-semibold text-slate-700">
                  {SIGNER_LABELS[key]}
                </th>
                {spec.party_roles.map((_, i) => {
                  const val = parties[i]?.[key]?.toString().trim() ?? "";
                  return (
                    <td
                      key={i}
                      className="border border-slate-300 p-2 align-top text-slate-800"
                    >
                      {val ? (
                        <span className="whitespace-pre-line">{val}</span>
                      ) : (
                        <span className="italic text-slate-300">
                          [{SIGNER_LABELS[key]}]
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
}

const SIGNER_LABELS: Record<
  "company" | "printName" | "title" | "noticeAddress",
  string
> = {
  company: "Company",
  printName: "Print Name",
  title: "Title",
  noticeAddress: "Notice Address",
};
