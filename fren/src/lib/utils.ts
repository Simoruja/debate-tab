import type { Circle, Person, Platform } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function hueFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function daysSince(iso?: string) {
  if (!iso) return null;
  return daysBetween(new Date(iso), new Date());
}

export function relativeDay(iso?: string) {
  const d = daysSince(iso);
  if (d === null) return "never";
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 31) return `${Math.round(d / 7)} wk ago`;
  if (d < 365) return `${Math.round(d / 30)} mo ago`;
  return `${Math.round(d / 365)} yr ago`;
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Days until the next occurrence of an MM-DD birthday. */
export function daysUntilBirthday(mmdd?: string) {
  if (!mmdd) return null;
  const [m, d] = mmdd.split("-").map(Number);
  if (!m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d);
  return daysBetween(today, next);
}

/** How many days past the keep-in-touch cadence this person is (negative = not due). */
export function overdueBy(p: Person) {
  if (!p.cadenceDays) return null;
  const since = daysSince(p.lastContactedAt ?? p.createdAt) ?? 0;
  return since - p.cadenceDays;
}

export const CIRCLES: Record<Circle, { label: string; color: string; dot: string }> = {
  inner: { label: "Inner circle", color: "bg-coral-100 text-coral-700", dot: "#ff6b3d" },
  friends: { label: "Friends", color: "bg-lilac-100 text-lilac-700", dot: "#7c66f0" },
  work: { label: "Work", color: "bg-sky-100 text-sky-800", dot: "#2b8fd6" },
  acquaintance: { label: "Met once", color: "bg-stone-200 text-stone-700", dot: "#a8a29e" },
};

export const CADENCES = [
  { days: 0, label: "No reminder" },
  { days: 7, label: "Every week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Every month" },
  { days: 90, label: "Every quarter" },
  { days: 180, label: "Every 6 months" },
  { days: 365, label: "Every year" },
];

export const PLATFORMS: Record<Platform, { label: string; url?: (h: string) => string; color: string }> = {
  instagram: { label: "Instagram", url: (h) => `https://instagram.com/${h}`, color: "#e1306c" },
  linkedin: { label: "LinkedIn", url: (h) => `https://linkedin.com/in/${h}`, color: "#0a66c2" },
  x: { label: "X", url: (h) => `https://x.com/${h}`, color: "#111111" },
  tiktok: { label: "TikTok", url: (h) => `https://tiktok.com/@${h}`, color: "#25f4ee" },
  facebook: { label: "Facebook", url: (h) => `https://facebook.com/${h}`, color: "#1877f2" },
  github: { label: "GitHub", url: (h) => `https://github.com/${h}`, color: "#333333" },
  whatsapp: { label: "WhatsApp", url: (h) => `https://wa.me/${h.replace(/\D/g, "")}`, color: "#25d366" },
  telegram: { label: "Telegram", url: (h) => `https://t.me/${h}`, color: "#229ed9" },
  email: { label: "Email", url: (h) => `mailto:${h}`, color: "#ea4335" },
  phone: { label: "Phone", url: (h) => `tel:${h}`, color: "#57534e" },
  website: { label: "Website", url: (h) => (h.startsWith("http") ? h : `https://${h}`), color: "#57534e" },
};

export function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}@.+]/gu, "");
}
