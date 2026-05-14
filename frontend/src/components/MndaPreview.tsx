import {
  describeConfidentiality,
  describeTerm,
  formatLongDate,
  type MndaForm,
  type PartyInfo,
} from "@/lib/mnda";
import {
  ATTRIBUTION,
  STANDARD_TERMS,
} from "@/lib/mnda-standard-terms";
import { PlaceholderText } from "./PlaceholderText";

const fieldOrPlaceholder = (value: string, placeholder: string) =>
  value.trim() ? (
    <span className="font-medium text-slate-900">{value}</span>
  ) : (
    <span className="italic text-slate-400">[{placeholder}]</span>
  );

export function MndaPreview({ form }: { form: MndaForm }) {
  const subs = {
    purpose: { value: form.purpose, placeholder: "Purpose" },
    effectiveDate: {
      value: formatLongDate(form.effectiveDate),
      placeholder: "Effective Date",
    },
    mndaTerm: { value: describeTerm(form), placeholder: "MNDA Term" },
    termOfConfidentiality: {
      value: describeConfidentiality(form),
      placeholder: "Term of Confidentiality",
    },
    governingLaw: { value: form.governingLaw, placeholder: "Governing Law" },
    jurisdiction: { value: form.jurisdiction, placeholder: "Jurisdiction" },
  };

  return (
    <article
      id="mnda-document"
      className="mnda-document mx-auto max-w-3xl bg-white p-10 text-[0.95rem] leading-relaxed text-slate-800 shadow-sm"
    >
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mutual Non-Disclosure Agreement
        </h1>
      </header>

      <section className="mb-8 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Using this Mutual Non-Disclosure Agreement
        </h2>
        <p>
          This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists
          of: (1) this Cover Page (&ldquo;Cover Page&rdquo;) and (2) the Common
          Paper Mutual NDA Standard Terms Version 1.0 (&ldquo;Standard
          Terms&rdquo;) identical to those posted at{" "}
          <span className="underline">
            commonpaper.com/standards/mutual-nda/1.0
          </span>
          . Any modifications of the Standard Terms should be made on the Cover
          Page, which will control over conflicts with the Standard Terms.
        </p>
      </section>

      <section className="mb-6">
        <CoverField label="Purpose" hint="How Confidential Information may be used">
          {fieldOrPlaceholder(form.purpose, "Purpose")}
        </CoverField>
        <CoverField label="Effective Date">
          {fieldOrPlaceholder(formatLongDate(form.effectiveDate), "Effective Date")}
        </CoverField>
        <CoverField label="MNDA Term" hint="The length of this MNDA">
          <ul className="space-y-1">
            <li>
              <Checkbox checked={form.termKind === "years"} />
              Expires{" "}
              <span className="font-medium text-slate-900">
                {form.termYears}
              </span>{" "}
              year(s) from Effective Date.
            </li>
            <li>
              <Checkbox checked={form.termKind === "until_terminated"} />
              Continues until terminated in accordance with the terms of the
              MNDA.
            </li>
          </ul>
        </CoverField>
        <CoverField
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
        >
          <ul className="space-y-1">
            <li>
              <Checkbox checked={form.confidentialityKind === "years"} />
              <span className="font-medium text-slate-900">
                {form.confidentialityYears}
              </span>{" "}
              year(s) from Effective Date, but in the case of trade secrets
              until Confidential Information is no longer considered a trade
              secret under applicable laws.
            </li>
            <li>
              <Checkbox checked={form.confidentialityKind === "perpetual"} />
              In perpetuity.
            </li>
          </ul>
        </CoverField>
        <CoverField label="Governing Law & Jurisdiction">
          <p>
            Governing Law:{" "}
            {fieldOrPlaceholder(form.governingLaw, "Fill in state")}
          </p>
          <p>
            Jurisdiction:{" "}
            {fieldOrPlaceholder(
              form.jurisdiction,
              "Fill in city or county and state",
            )}
          </p>
        </CoverField>
        <CoverField label="MNDA Modifications">
          {form.modifications.trim() ? (
            <p className="whitespace-pre-line">{form.modifications}</p>
          ) : (
            <p className="italic text-slate-400">
              List any modifications to the MNDA
            </p>
          )}
        </CoverField>
      </section>

      <p className="mb-6 text-sm">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      <SignatureBlock party1={form.party1} party2={form.party2} />

      <hr className="my-10 border-slate-300" />

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Standard Terms</h2>
        <ol className="ml-5 list-decimal space-y-4">
          {STANDARD_TERMS.map((section) => (
            <li key={section.title}>
              <span className="font-semibold">{section.title}.</span>{" "}
              <PlaceholderText template={section.body} subs={subs} />
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        <p>{ATTRIBUTION}</p>
      </footer>
    </article>
  );
}

function CoverField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-l-2 border-slate-200 pl-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        {label}
      </p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="mt-1 text-slate-800">{children}</div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-slate-400 align-text-bottom text-[10px] font-bold leading-none text-slate-800"
    >
      {checked ? "✕" : ""}
    </span>
  );
}

function SignatureBlock({
  party1,
  party2,
}: {
  party1: PartyInfo;
  party2: PartyInfo;
}) {
  const rows: { label: string; party1: string; party2: string }[] = [
    { label: "Signature", party1: "", party2: "" },
    { label: "Print Name", party1: party1.printName, party2: party2.printName },
    { label: "Title", party1: party1.title, party2: party2.title },
    { label: "Company", party1: party1.company, party2: party2.company },
    {
      label: "Notice Address",
      party1: party1.noticeAddress,
      party2: party2.noticeAddress,
    },
    { label: "Date", party1: "", party2: "" },
  ];
  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <thead>
        <tr>
          <th className="w-1/5 border border-slate-300 bg-slate-50 p-2 text-left font-semibold text-slate-700"></th>
          <th className="w-2/5 border border-slate-300 bg-slate-50 p-2 text-left font-semibold text-slate-700">
            Party 1
          </th>
          <th className="w-2/5 border border-slate-300 bg-slate-50 p-2 text-left font-semibold text-slate-700">
            Party 2
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th className="border border-slate-300 p-2 text-left align-top font-semibold text-slate-700">
              {row.label}
            </th>
            <td className="border border-slate-300 p-2 align-top text-slate-800">
              {row.party1 ? (
                <span className="whitespace-pre-line">{row.party1}</span>
              ) : (
                <span className="text-slate-300">&nbsp;</span>
              )}
            </td>
            <td className="border border-slate-300 p-2 align-top text-slate-800">
              {row.party2 ? (
                <span className="whitespace-pre-line">{row.party2}</span>
              ) : (
                <span className="text-slate-300">&nbsp;</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
