"use client";

import { ArrowRight, Brain, Cake, Check, Clock, Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import { PersonRow } from "@/components/person-row";
import { Empty, Loading } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import { daysSince, daysUntilBirthday, overdueBy, relativeDay } from "@/lib/utils";

export default function HomePage() {
  const data = useFren();
  if (!data) return <Loading />;

  const { people, events } = data;
  const due = people
    .map((p) => ({ p, over: overdueBy(p) }))
    .filter((x) => x.over !== null && x.over >= 0)
    .sort((a, b) => b.over! - a.over!);
  const fresh = people.filter((p) => (daysSince(p.metOn ?? p.createdAt) ?? 999) <= 30).sort((a, b) => (b.metOn ?? "").localeCompare(a.metOn ?? ""));
  const birthdays = people
    .map((p) => ({ p, d: daysUntilBirthday(p.birthday) }))
    .filter((x) => x.d !== null && x.d <= 45)
    .sort((a, b) => a.d! - b.d!);
  const platforms = new Set(people.flatMap((p) => p.accounts.map((a) => a.platform))).size;
  const thin = fresh.filter((p) => !p.role && !p.company && p.accounts.length === 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{greeting}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {due.length ? `${due.length} ${due.length === 1 ? "person" : "people"} would love to hear from you` : "You’re all caught up"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="People" value={people.length} />
        <Stat label="Met this month" value={fresh.length} />
        <Stat label="Events" value={events.length} />
        <Stat label="Platforms linked" value={platforms} />
      </div>

      <Link
        href="/app/capture"
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-ink p-5 text-paper sm:p-6"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white animate-pulse-ring">
          <Mic size={24} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold">Just met someone?</span>
          <span className="block text-sm text-paper/70">Say who, where and one detail. FREN fills in the card and links them to who you already know.</span>
        </span>
        <ArrowRight className="ml-auto hidden shrink-0 transition group-hover:translate-x-1 sm:block" />
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
            <Clock size={18} className="text-coral-500" /> Keep in touch
          </h2>
          <p className="mb-3 text-xs text-muted">Based on the reminder you set for each person.</p>
          {due.length === 0 ? (
            <Empty icon={<Check size={28} />} title="Nobody is overdue">
              Set a keep-in-touch reminder on someone’s profile and they’ll show up here when it’s time.
            </Empty>
          ) : (
            <div className="divide-y divide-line">
              {due.slice(0, 8).map(({ p, over }) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  detail={`Last talked ${relativeDay(p.lastContactedAt ?? p.createdAt)} · ${over === 0 ? "due today" : `${over}d overdue`}`}
                  right={
                    <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => actions.addNote(p.id, "message", "Reached out", { touch: true })}>
                      <Check size={14} /> Reached out
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Cake size={18} className="text-lilac-500" /> Birthdays
            </h2>
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted">No birthdays in the next 6 weeks.</p>
            ) : (
              <div className="divide-y divide-line">
                {birthdays.map(({ p, d }) => (
                  <PersonRow
                    key={p.id}
                    person={p}
                    right={<span className="chip bg-lilac-100 text-lilac-700">{d === 0 ? "Today 🎉" : d === 1 ? "Tomorrow" : `in ${d}d`}</span>}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card bg-gradient-to-br from-coral-50 to-lilac-100 p-5">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
              <Brain size={18} className="text-coral-600" /> Make them stick
            </h2>
            <p className="mb-4 text-sm text-muted">
              You met {fresh.length} {fresh.length === 1 ? "person" : "people"} in the last 30 days. A one-minute recall round helps names and faces stay.
            </p>
            <Link href="/app/recall" className="btn-primary">
              Start recall <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles size={18} className="text-mint-500" /> Recently met
          </h2>
          <Link href="/app/people" className="text-sm font-medium text-coral-600 hover:underline">
            Everyone
          </Link>
        </div>
        {fresh.length === 0 ? (
          <Empty icon={<Mic size={28} />} title="No one new this month">
            After your next event, record a voice note for each person you meet.
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/app/people/${p.id}`} className="rounded-2xl border border-line p-4 transition hover:border-stone-300 hover:shadow-sm">
                <PersonRow person={p} link={false} />
                {p.howWeMet && <p className="mt-1 line-clamp-2 text-sm text-muted">“{p.howWeMet}”</p>}
                <p className="mt-2 text-xs text-stone-400">
                  {relativeDay(p.metOn)}
                  {p.eventId && ` · ${events.find((e) => e.id === p.eventId)?.name ?? ""}`}
                </p>
              </Link>
            ))}
          </div>
        )}
        {thin.length > 0 && (
          <p className="mt-4 rounded-2xl bg-coral-50 px-4 py-3 text-sm text-coral-700">
            {thin.map((p) => p.name.split(" ")[0]).join(", ")} {thin.length === 1 ? "has" : "have"} almost no details yet. Add a note while you still remember.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
