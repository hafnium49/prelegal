export type PartyInfo = {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type MndaTermKind = "years" | "until_terminated";
export type ConfidentialityKind = "years" | "perpetual";

export type MndaForm = {
  purpose: string;
  effectiveDate: string;
  termKind: MndaTermKind;
  termYears: number;
  confidentialityKind: ConfidentialityKind;
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyParty = (): PartyInfo => ({
  printName: "",
  title: "",
  company: "",
  noticeAddress: "",
});

export const defaultMndaForm = (): MndaForm => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: todayISO(),
  termKind: "years",
  termYears: 1,
  confidentialityKind: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty(),
  party2: emptyParty(),
});

export const formatLongDate = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

export const describeTerm = (form: MndaForm): string =>
  form.termKind === "until_terminated"
    ? "until terminated in accordance with the terms of this MNDA"
    : `${form.termYears} year${form.termYears === 1 ? "" : "s"} from the Effective Date`;

export const describeConfidentiality = (form: MndaForm): string =>
  form.confidentialityKind === "perpetual"
    ? "in perpetuity"
    : `${form.confidentialityYears} year${form.confidentialityYears === 1 ? "" : "s"} from the Effective Date (trade secrets remain protected for as long as they qualify as trade secrets under applicable law)`;
