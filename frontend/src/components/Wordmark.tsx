type Props = {
  size?: "md" | "lg";
};

export function Wordmark({ size = "lg" }: Props) {
  const dot = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const text = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${dot} flex items-center justify-center rounded-md bg-[#032147] text-[0.7em] font-bold text-[#ecad0a]`}
        aria-hidden
      >
        §
      </span>
      <span className={`${text} font-semibold text-[#032147]`}>Prelegal</span>
    </div>
  );
}
