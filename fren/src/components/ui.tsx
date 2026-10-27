"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { Account, Person } from "@/lib/types";
import { cn, initials, PLATFORMS } from "@/lib/utils";

export function Avatar({ person, size = 40, className }: { person: Pick<Person, "name" | "hue">; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `oklch(0.9 0.07 ${person.hue})`,
        color: `oklch(0.38 0.12 ${person.hue})`,
      }}
      aria-hidden
    >
      {initials(person.name)}
    </span>
  );
}

const SHORT: Record<Account["platform"], string> = {
  instagram: "IG",
  linkedin: "in",
  x: "X",
  tiktok: "TT",
  facebook: "f",
  github: "GH",
  whatsapp: "WA",
  telegram: "TG",
  email: "@",
  phone: "☎",
  website: "www",
};

export function PlatformBadge({ platform, size = 20 }: { platform: Account["platform"]; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45, background: PLATFORMS[platform].color }}
      aria-hidden
    >
      {SHORT[platform]}
    </span>
  );
}

export function AccountChip({ account }: { account: Account }) {
  const meta = PLATFORMS[account.platform];
  const href = meta.url?.(account.handle);
  const label = account.platform === "email" || account.platform === "phone" || account.platform === "website" ? account.handle : `@${account.handle}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-xs font-medium hover:border-stone-300"
      title={meta.label}
    >
      <PlatformBadge platform={account.platform} size={20} />
      <span className="truncate">{label}</span>
    </a>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          "max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-2xl sm:rounded-3xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-stone-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-3 text-coral-500">{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="input flex flex-wrap items-center gap-1.5 !py-2">
      {value.map((t) => (
        <span key={t} className="chip bg-stone-100 text-stone-700">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        className="min-w-24 flex-1 bg-transparent outline-none"
        placeholder={value.length ? "" : placeholder}
        onKeyDown={(e) => {
          const v = e.currentTarget.value.trim().replace(/,$/, "");
          if ((e.key === "Enter" || e.key === ",") && v) {
            e.preventDefault();
            if (!value.includes(v)) onChange([...value, v]);
            e.currentTarget.value = "";
          } else if (e.key === "Backspace" && !e.currentTarget.value && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          if (v && !value.includes(v)) onChange([...value, v]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-stone-200/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-stone-200/50" />
        ))}
      </div>
    </div>
  );
}
