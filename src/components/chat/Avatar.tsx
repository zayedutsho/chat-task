/** Presentational avatar shared by the conversation list and the message thread. */

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  tone?: "slate" | "emerald";
  size?: "sm" | "md";
}

export default function Avatar({ name, tone = "slate", size = "md" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${
        size === "sm" ? "size-8 text-[11px]" : "size-9 text-xs"
      } ${
        tone === "emerald"
          ? "bg-emerald-100 text-emerald-900 ring-emerald-900/10"
          : "bg-slate-100 text-slate-600 ring-slate-900/10"
      }`}
    >
      {getInitials(name)}
    </span>
  );
}
