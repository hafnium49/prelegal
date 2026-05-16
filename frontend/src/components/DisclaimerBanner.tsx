export function DisclaimerBanner() {
  return (
    <div
      className="no-print flex items-start gap-3 rounded-md border-l-4 border-[#ecad0a] bg-[#ecad0a]/10 px-4 py-3 text-sm text-[#032147]"
      role="note"
    >
      <span aria-hidden className="select-none text-base font-bold text-[#ecad0a]">
        !
      </span>
      <p>
        <strong>Draft only.</strong> Documents generated here are drafts intended
        for legal review. They are not legal advice and are not a substitute for
        a qualified attorney.
      </p>
    </div>
  );
}

export function DisclaimerFooter() {
  return (
    <div className="generated-disclaimer mt-10 border-t border-slate-300 pt-4 text-center text-xs text-[#888888]">
      <strong>DRAFT — Subject to legal review.</strong> This document was
      generated for drafting purposes only and is not a substitute for advice
      from a qualified attorney.
    </div>
  );
}
