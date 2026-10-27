import { ArrowRight, Brain, Check, Lock, Mic, Network, Route, Sparkles, Users, X } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const STEPS = [
  {
    icon: Mic,
    title: "Say it once",
    body: "Walking away from a conversation? Hold the mic and talk: “Met Amara at Web Summit, founder of Gridlight, knows Tomás.” Ten seconds, done.",
  },
  {
    icon: Sparkles,
    title: "FREN does the remembering",
    body: "Name, where you met, what they do, their handles, who introduced you. FREN pulls it all out and fills the card. You just check it.",
  },
  {
    icon: Network,
    title: "See who you know",
    body: "Everyone lands in one graph with their Instagram, LinkedIn and number attached. See how you know them, and who you both know.",
  },
];

const FEATURES = [
  { icon: Mic, title: "Voice-note capture", body: "Built for the moment after the handshake, not for typing at your desk." },
  { icon: Network, title: "Unified graph", body: "Contacts, LinkedIn, Instagram and events in one map. Each person shows up once." },
  { icon: Route, title: "Mutuals finder", body: "Pick any two people. See who you share and the shortest chain to an intro." },
  { icon: Users, title: "Friends and work", body: "Circles for your closest people, friends, work and met-once. Not just a sales pipeline." },
  { icon: Brain, title: "Recall practice", body: "A one-minute memory game so new names actually stick after an event." },
  { icon: Lock, title: "Private layer", body: "Stored on your device. No one gets a notification, nothing gets posted." },
];

const COMPARE: [string, boolean, boolean, boolean][] = [
  ["Remembers friends, not only colleagues", false, true, true],
  ["Capture with a quick voice note", false, false, true],
  ["Fills in details for you", false, false, true],
  ["Contacts + email + social in one graph", false, false, true],
  ["Shows how you know someone and your mutuals", false, false, true],
  ["Keep-in-touch reminders", true, true, true],
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <a href="#how" className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:block">
            How it works
          </a>
          <a href="#privacy" className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:block">
            Privacy
          </a>
          <Link href="/app" className="btn-primary">
            Open FREN
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> Personal relationship manager · MVP
          </p>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            Find your
            <br />
            <span className="text-coral-500">friends.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
            You meet great people and forget them by Friday. FREN does the remembering: after you meet someone, record a quick voice note, and FREN maps who they are, how you know them, and who you both know.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app/capture" className="btn-accent !px-6 !py-3 text-base">
              <Mic size={18} /> Record your first note
            </Link>
            <Link href="/app" className="btn-ghost !px-6 !py-3 text-base">
              Explore the demo <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">No sign-up. Your network stays on your device.</p>
        </div>
        <HeroVisual />
      </section>

      <section className="bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-coral-400">The problem</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Think of the last event you went to. How many of those introductions actually stuck?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ["3,000", "contacts in a typical phone, and most of them are a name with no story attached"],
              ["4+", "places your people are spread across: contacts, email, Instagram, LinkedIn…"],
              ["0", "apps that show the whole picture of who you know and how you know them"],
            ].map(([n, t]) => (
              <div key={n} className="rounded-3xl border border-paper/15 p-6">
                <p className="font-display text-5xl font-bold text-coral-400">{n}</p>
                <p className="mt-3 text-sm leading-relaxed text-paper/70">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-paper/70">
            Most tools are built for work, not for the friends who matter just as much. The ones that do handle relationships expect you to type in every detail yourself. FREN works the other way round.
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-20 sm:px-8">
        <h2 className="font-display text-4xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-4 font-display text-6xl font-bold text-stone-100">{i + 1}</span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
                <s.icon size={22} />
              </span>
              <h3 className="relative mt-5 font-display text-xl font-semibold">{s.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl bg-white/60 p-6 ring-1 ring-line">
              <f.icon size={22} className="text-lilac-500" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        <h2 className="text-center font-display text-4xl font-semibold tracking-tight">A private layer on the apps you already use</h2>
        <div className="card mt-10 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-4 font-medium" />
                <th className="p-4 text-center font-medium">Work CRMs</th>
                <th className="p-4 text-center font-medium">Manual PRMs</th>
                <th className="p-4 text-center font-display text-sm font-bold normal-case tracking-normal text-coral-600">FREN</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, ...cols]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="p-4">{label}</td>
                  {cols.map((v, i) => (
                    <td key={i} className={`p-4 text-center ${i === 2 ? "bg-coral-50/60" : ""}`}>
                      {v ? <Check size={18} className="mx-auto text-mint-500" /> : <X size={16} className="mx-auto text-stone-300" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-10 bg-mint-100/60 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-2">
          <div>
            <Lock className="text-mint-700" size={28} />
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">Your notes about people are yours.</h2>
          </div>
          <ul className="space-y-3 text-stone-700">
            {[
              "Your network is stored on your device. There’s no public profile, and nobody gets notified when you add them.",
              "Imports read the files you export from your apps. FREN never logs in as you.",
              "Export everything as one file, or wipe it, any time.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check size={18} className="mt-0.5 shrink-0 text-mint-700" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
        <h2 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
          FREN: <span className="text-coral-500">find your friends.</span>
        </h2>
        <Link href="/app" className="btn-primary mt-8 !px-7 !py-3.5 text-base">
          Open FREN <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        <Logo className="mb-2 scale-90" />
        <p>Built as an MVP. Your data never leaves this browser unless you export it.</p>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-coral-200/60 blur-3xl" />
      <div className="absolute -bottom-10 -right-6 h-56 w-56 rounded-full bg-lilac-200/70 blur-3xl" />

      <div className="relative rounded-3xl bg-ink p-4 text-paper shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-500">
            <Mic size={18} />
          </span>
          <div className="flex h-8 flex-1 items-center gap-[3px]">
            {[4, 9, 14, 7, 18, 11, 22, 15, 8, 19, 12, 6, 16, 10, 20, 13, 7, 17, 9, 5, 12, 8].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-paper/70" style={{ height: h }} />
            ))}
          </div>
          <span className="text-xs text-paper/60">0:09</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          “Just met <mark className="rounded bg-coral-500/30 px-0.5 text-paper">Amara Okafor</mark> at <mark className="rounded bg-lilac-500/40 px-0.5 text-paper">Web Summit</mark>, founder of{" "}
          <mark className="rounded bg-sky-500/30 px-0.5 text-paper">Gridlight</mark>. She knows <mark className="rounded bg-mint-500/30 px-0.5 text-paper">Tomás</mark>. Follow up next week.”
        </p>
      </div>

      <div className="relative -mt-3 ml-6 rounded-3xl border border-line bg-white p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 font-display text-lg font-bold text-coral-700">AO</span>
          <div>
            <p className="font-semibold">Amara Okafor</p>
            <p className="text-xs text-muted">Founder · Gridlight</p>
          </div>
          <span className="chip ml-auto bg-lilac-100 text-lilac-700">Web Summit</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
          <span className="chip bg-[#0a66c2] text-white">in /amaraokafor</span>
          <span className="chip bg-ink text-white">X @amarabuilds</span>
          <span className="chip bg-coral-50 text-coral-700">⏰ follow up in 7d</span>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
          <span>Mutuals</span>
          <span className="flex -space-x-2">
            {["TR", "DK", "NH"].map((x, i) => (
              <span key={x} className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white" style={{ background: `oklch(0.9 0.07 ${i * 110 + 40})`, color: `oklch(0.4 0.12 ${i * 110 + 40})` }}>
                {x}
              </span>
            ))}
          </span>
          <span>Tomás, Daniel, Nadia</span>
        </div>
      </div>
    </div>
  );
}
