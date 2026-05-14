"use client";

import type { MndaForm, PartyInfo } from "@/lib/mnda";

type Props = {
  form: MndaForm;
  onChange: (form: MndaForm) => void;
  onReset: () => void;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400/40";
const labelClass = "block text-sm font-medium text-slate-700";

export function MndaFormUI({ form, onChange, onReset }: Props) {
  const set = <K extends keyof MndaForm>(key: K, value: MndaForm[K]) =>
    onChange({ ...form, [key]: value });

  const setParty = (key: "party1" | "party2", patch: Partial<PartyInfo>) =>
    onChange({ ...form, [key]: { ...form[key], ...patch } });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Mutual NDA form"
    >
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Agreement details
        </h2>

        <div>
          <label className={labelClass} htmlFor="purpose">
            Purpose
          </label>
          <textarea
            id="purpose"
            className={fieldClass}
            rows={2}
            value={form.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            How Confidential Information may be used.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="effectiveDate">
              Effective Date
            </label>
            <input
              id="effectiveDate"
              type="date"
              className={fieldClass}
              value={form.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </div>
          <fieldset>
            <legend className={labelClass}>MNDA Term</legend>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="termKind"
                  checked={form.termKind === "years"}
                  onChange={() => set("termKind", "years")}
                />
                Expires
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                  value={form.termYears}
                  disabled={form.termKind !== "years"}
                  onChange={(e) =>
                    set("termYears", Math.max(1, Number(e.target.value) || 1))
                  }
                />
                year(s) from Effective Date
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="termKind"
                  checked={form.termKind === "until_terminated"}
                  onChange={() => set("termKind", "until_terminated")}
                />
                Continues until terminated
              </label>
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend className={labelClass}>Term of Confidentiality</legend>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityKind"
                checked={form.confidentialityKind === "years"}
                onChange={() => set("confidentialityKind", "years")}
              />
              <input
                type="number"
                min={1}
                className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                value={form.confidentialityYears}
                disabled={form.confidentialityKind !== "years"}
                onChange={(e) =>
                  set(
                    "confidentialityYears",
                    Math.max(1, Number(e.target.value) || 1),
                  )
                }
              />
              year(s) from Effective Date (trade secrets remain protected
              indefinitely)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityKind"
                checked={form.confidentialityKind === "perpetual"}
                onChange={() => set("confidentialityKind", "perpetual")}
              />
              In perpetuity
            </label>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="governingLaw">
              Governing Law (state)
            </label>
            <input
              id="governingLaw"
              type="text"
              placeholder="Delaware"
              className={fieldClass}
              value={form.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jurisdiction">
              Jurisdiction (city/county and state)
            </label>
            <input
              id="jurisdiction"
              type="text"
              placeholder="New Castle, Delaware"
              className={fieldClass}
              value={form.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="modifications">
            MNDA Modifications (optional)
          </label>
          <textarea
            id="modifications"
            className={fieldClass}
            rows={2}
            placeholder="List any modifications to the Standard Terms"
            value={form.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        </div>
      </section>

      <PartySection
        title="Party 1"
        party={form.party1}
        onChange={(patch) => setParty("party1", patch)}
      />
      <PartySection
        title="Party 2"
        party={form.party2}
        onChange={(patch) => setParty("party2", patch)}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Reset form
        </button>
      </div>
    </form>
  );
}

function PartySection({
  title,
  party,
  onChange,
}: {
  title: string;
  party: PartyInfo;
  onChange: (patch: Partial<PartyInfo>) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company</label>
          <input
            type="text"
            className={fieldClass}
            value={party.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Signer name</label>
          <input
            type="text"
            className={fieldClass}
            value={party.printName}
            onChange={(e) => onChange({ printName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Signer title</label>
          <input
            type="text"
            className={fieldClass}
            value={party.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Notice address</label>
          <input
            type="text"
            className={fieldClass}
            placeholder="email or postal address"
            value={party.noticeAddress}
            onChange={(e) => onChange({ noticeAddress: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
