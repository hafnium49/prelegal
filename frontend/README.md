# Mutual NDA Creator

A Next.js prototype that generates a [Common Paper Mutual NDA](https://commonpaper.com/standards/mutual-nda/1.0/) from a short form, with a live document preview and a one-click "Download / Print PDF" button (uses the browser's native print-to-PDF).

Implements [KAN-3](https://hafnium.atlassian.net/browse/KAN-3).

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Usage

1. Fill in the form on the left: purpose, effective date, term, confidentiality length, governing law, jurisdiction, and each party's company/signer/notice address.
2. The MNDA preview on the right updates as you type — placeholders are shown in italic until filled.
3. Click **Download / Print PDF** to open the browser print dialog, then choose "Save as PDF". Form controls and chrome are hidden in print output via `@media print` rules in `src/app/globals.css`.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript, Tailwind CSS v4
- No backend — the form, preview, and download are entirely client-side.

## Layout

```
src/
  app/
    layout.tsx          # root layout + metadata
    page.tsx            # form ↔ preview orchestration (client component)
    globals.css         # Tailwind import + print stylesheet
  components/
    MndaForm.tsx        # form UI (controlled inputs)
    MndaPreview.tsx     # rendered MNDA (cover page + standard terms)
    PlaceholderText.tsx # `{{token}}` substitution into prose
  lib/
    mnda.ts                  # types, defaults, formatting helpers
    mnda-standard-terms.ts   # the eleven Standard Terms with `{{token}}` slots
```

The Standard Terms text is from Common Paper Mutual NDA v1.0 (CC BY 4.0); attribution is preserved in the generated document footer.

## Commands

```bash
npm run dev    # dev server
npm run build  # production build
npm run lint   # ESLint
npx tsc --noEmit  # type-check
```
