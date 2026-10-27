"use client";

import { Brain, CalendarDays, Download, Home, Lock, Menu, Mic, Network, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/people", label: "People", icon: Users },
  { href: "/app/capture", label: "Voice note", icon: Mic },
  { href: "/app/graph", label: "Graph", icon: Network },
  { href: "/app/events", label: "Events", icon: CalendarDays },
  { href: "/app/recall", label: "Recall", icon: Brain },
  { href: "/app/import", label: "Import & merge", icon: Download },
  { href: "/app/settings", label: "Privacy & data", icon: Settings },
];

const MOBILE = ["/app", "/app/people", "/app/capture", "/app/graph", "/app/events"];

function isActive(path: string, href: string) {
  return href === "/app" ? path === "/app" : path.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2">
          <Logo />
        </Link>
        <Link href="/app/capture" className="btn-accent mb-6 w-full !py-3">
          <Mic size={18} /> New voice note
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.filter((n) => n.href !== "/app/capture").map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                isActive(path, href) ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-white/60 hover:text-ink",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-start gap-2 rounded-2xl bg-mint-100/70 p-3 text-xs text-mint-700">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <p>Private by default. Your network lives on this device, not on our servers.</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/">
          <Logo />
        </Link>
        <button className="rounded-full p-2 hover:bg-stone-200" onClick={() => setMenu((m) => !m)} aria-label="Menu">
          {menu ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menu && (
          <nav className="absolute inset-x-3 top-full mt-2 flex flex-col gap-1 rounded-3xl border border-line bg-white p-2 shadow-xl">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenu(false)}
                className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium", isActive(path, href) ? "bg-coral-50 text-coral-700" : "text-ink")}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-paper/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden">
        {MOBILE.map((href) => {
          const item = NAV.find((n) => n.href === href)!;
          const Icon = item.icon;
          if (href === "/app/capture") {
            return (
              <Link key={href} href={href} className="-mt-7 flex flex-col items-center" aria-label="New voice note">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg shadow-coral-500/30 ring-4 ring-paper">
                  <Mic size={24} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn("flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium", isActive(path, href) ? "text-coral-600" : "text-muted")}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
