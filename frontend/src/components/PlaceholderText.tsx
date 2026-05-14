import { Fragment } from "react";

type Substitutions = Record<string, { value: string; placeholder: string }>;

const TOKEN = /\{\{(\w+)\}\}/g;

export function PlaceholderText({
  template,
  subs,
}: {
  template: string;
  subs: Substitutions;
}) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of template.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(template.slice(lastIndex, start));
    }
    const sub = subs[match[1]];
    const filled = sub?.value?.trim();
    parts.push(
      <span
        key={key++}
        className={
          filled
            ? "font-medium text-slate-900"
            : "italic text-slate-400 underline decoration-dotted underline-offset-2"
        }
      >
        {filled || `[${sub?.placeholder ?? match[1]}]`}
      </span>,
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
