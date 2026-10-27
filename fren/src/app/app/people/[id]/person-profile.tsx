"use client";

import {
  ArrowLeft,
  Bell,
  Briefcase,
  Cake,
  CalendarDays,
  Coffee,
  Handshake,
  MapPin,
  MessageCircle,
  Mic,
  Network,
  Pencil,
  Phone,
  Plus,
  Send,
  Square,
  Star,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PersonForm } from "@/components/person-form";
import { AccountChip, Avatar, Empty, Loading, Modal } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import type { NoteKind, Person } from "@/lib/types";
import { useSpeech } from "@/lib/use-speech";
import { CADENCES, CIRCLES, cn, daysUntilBirthday, formatDate, overdueBy, relativeDay } from "@/lib/utils";

const NOTE_META: Record<NoteKind, { label: string; icon: typeof Mic; color: string }> = {
  voice: { label: "Voice note", icon: Mic, color: "bg-coral-100 text-coral-700" },
  text: { label: "Note", icon: StickyNote, color: "bg-stone-100 text-stone-700" },
  call: { label: "Call", icon: Phone, color: "bg-sky-100 text-sky-800" },
  meetup: { label: "Met up", icon: Coffee, color: "bg-mint-100 text-mint-700" },
  message: { label: "Message", icon: MessageCircle, color: "bg-lilac-100 text-lilac-700" },
};

const SOURCE_LABEL: Record<string, string> = {
  voice: "Voice note",
  manual: "Added by hand",
  contacts: "Phone contacts",
  email: "Email",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
};

export function PersonProfile({ id }: { id: string }) {
  const data = useFren();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [noteKind, setNoteKind] = useState<NoteKind>("text");
  const [note, setNote] = useState("");
  const [dictated, setDictated] = useState(false);
  const append = useCallback((t: string) => {
    setNote((n) => (n ? `${n} ${t}` : t));
    setDictated(true);
  }, []);
  const speech = useSpeech(append);

  if (!data) return <Loading />;
  const p = data.people.find((x) => x.id === id);
  if (!p) {
    return (
      <Empty icon={<X size={28} />} title="This person isn’t in FREN">
        <Link href="/app/people" className="text-coral-600 underline">
          Back to people
        </Link>
      </Empty>
    );
  }

  const event = data.events.find((e) => e.id === p.eventId);
  const introducer = data.people.find((x) => x.id === p.introducedBy);
  const connections = p.connections.map((c) => data.people.find((x) => x.id === c)).filter((x): x is Person => !!x);
  const introduced = data.people.filter((x) => x.introducedBy === p.id);
  const metSameEvent = event ? data.people.filter((x) => x.eventId === event.id && x.id !== p.id) : [];
  const over = overdueBy(p);
  const bday = daysUntilBirthday(p.birthday);

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    speech.stop();
    actions.addNote(p!.id, dictated ? "voice" : noteKind, note.trim(), { touch: noteKind !== "text" });
    setNote("");
    setDictated(false);
  }

  return (
    <div>
      <Link href="/app/people" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> People
      </Link>

      <header className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar person={p} size={80} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.name}</h1>
            <button onClick={() => actions.updatePerson(p.id, { starred: !p.starred })} aria-label={p.starred ? "Unstar" : "Star"}>
              <Star size={22} className={p.starred ? "fill-coral-500 text-coral-500" : "text-stone-300 hover:text-coral-400"} />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {(p.role || p.company) && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={14} /> {[p.role, p.company].filter(Boolean).join(" at ")}
              </span>
            )}
            {p.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {p.location}
              </span>
            )}
            {p.birthday && (
              <span className="inline-flex items-center gap-1.5">
                <Cake size={14} /> {new Date(2000, Number(p.birthday.slice(0, 2)) - 1, Number(p.birthday.slice(3))).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                {bday !== null && bday <= 30 && <span className="chip bg-lilac-100 text-lilac-700">{bday === 0 ? "today!" : `in ${bday}d`}</span>}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip" style={{ background: `${CIRCLES[p.circle].dot}1f`, color: CIRCLES[p.circle].dot }}>
              {CIRCLES[p.circle].label}
            </span>
            {p.tags.map((t) => (
              <Link key={t} href={`/app/people?tag=${encodeURIComponent(t)}`} className="chip bg-stone-100 text-stone-600">
                #{t}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/graph?focus=${p.id}`} className="btn-ghost" title="Show in graph">
            <Network size={16} />
          </Link>
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Handshake size={18} className="text-coral-500" /> How you know {p.name.split(" ")[0]}
            </h2>
            {p.howWeMet ? <p className="text-[15px] leading-relaxed">“{p.howWeMet}”</p> : <p className="text-sm text-muted">No story yet. Add one, it’s the thing you’ll forget first.</p>}
            <dl className="mt-4 space-y-2 text-sm">
              {event && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">Met at</dt>
                  <dd>
                    <Link href={`/app/events#${event.id}`} className="font-medium text-coral-600 hover:underline">
                      {event.name}
                    </Link>
                  </dd>
                </div>
              )}
              {p.metOn && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">When</dt>
                  <dd>
                    {formatDate(p.metOn)} <span className="text-muted">({relativeDay(p.metOn)})</span>
                  </dd>
                </div>
              )}
              {introducer && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">Introduced by</dt>
                  <dd>
                    <Link href={`/app/people/${introducer.id}`} className="font-medium text-coral-600 hover:underline">
                      {introducer.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">Found via</dt>
                <dd className="flex flex-wrap gap-1">
                  {p.sources.map((s) => (
                    <span key={s} className="chip bg-stone-100 !py-0.5 text-stone-600">
                      {SOURCE_LABEL[s] ?? s}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Find them on</h2>
            {p.accounts.length ? (
              <div className="flex flex-wrap gap-2">
                {p.accounts.map((a, i) => (
                  <AccountChip key={i} account={a} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No accounts linked. Add their Instagram, LinkedIn or number so you can find them later.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Bell size={18} className="text-lilac-500" /> Keep in touch
            </h2>
            <select
              className="input"
              value={p.cadenceDays ?? 0}
              onChange={(e) => actions.updatePerson(p.id, { cadenceDays: Number(e.target.value) || undefined })}
              aria-label="Reminder cadence"
            >
              {CADENCES.map((c) => (
                <option key={c.days} value={c.days}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm text-muted">
              Last contact: <strong className="text-ink">{relativeDay(p.lastContactedAt)}</strong>
              {over !== null && (
                <span className={cn("ml-2 chip", over >= 0 ? "bg-coral-100 text-coral-700" : "bg-mint-100 text-mint-700")}>
                  {over >= 0 ? (over === 0 ? "due today" : `${over}d overdue`) : `due in ${-over}d`}
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["message", "call", "meetup"] as const).map((k) => {
                const M = NOTE_META[k];
                return (
                  <button key={k} className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => actions.addNote(p.id, k, `${M.label}`, { touch: true })}>
                    <M.icon size={14} /> {M.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
              <Network size={18} className="text-mint-500" /> Mutuals
            </h2>
            <p className="mb-3 text-xs text-muted">People you both know.</p>
            {connections.length === 0 && <p className="text-sm text-muted">No mutuals linked yet.</p>}
            <div className="space-y-1">
              {connections.map((c) => (
                <div key={c.id} className="group flex items-center gap-2">
                  <Link href={`/app/people/${c.id}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 hover:bg-stone-50">
                    <Avatar person={c} size={28} />
                    <span className="truncate text-sm">{c.name}</span>
                    {c.id === p.introducedBy && <span className="chip bg-coral-50 !py-0 text-[10px] text-coral-700">introduced you</span>}
                  </Link>
                  <button className="rounded-full p-1 text-stone-300 opacity-0 hover:text-coral-600 group-hover:opacity-100" onClick={() => actions.disconnect(p.id, c.id)} aria-label={`Unlink ${c.name}`}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <select
              className="mt-2 w-full rounded-full border border-dashed border-line bg-transparent px-3 py-1.5 text-xs text-muted"
              value=""
              onChange={(e) => e.target.value && actions.connect(p.id, e.target.value)}
              aria-label="Link someone they know"
            >
              <option value="">+ link someone they know</option>
              {data.people
                .filter((x) => x.id !== p.id && !p.connections.includes(x.id))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
            {introduced.length > 0 && (
              <p className="mt-4 text-xs text-muted">
                {p.name.split(" ")[0]} introduced you to{" "}
                {introduced.map((x, i) => (
                  <span key={x.id}>
                    {i > 0 && ", "}
                    <Link href={`/app/people/${x.id}`} className="font-medium text-ink hover:underline">
                      {x.name}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
            {metSameEvent.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Also met at {event!.name}: {metSameEvent.map((x) => x.name.split(" ")[0]).join(", ")}
              </p>
            )}
          </section>

          {p.interests.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Talk to them about</h2>
              <div className="flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <span key={i} className="chip bg-mint-100 text-mint-700">
                    {i}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="lg:col-span-3">
          <form onSubmit={addNote} className="card mb-4 p-4">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(Object.keys(NOTE_META) as NoteKind[])
                .filter((k) => k !== "voice")
                .map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setNoteKind(k)}
                    className={cn("chip border", noteKind === k ? "border-ink bg-ink text-paper" : "border-line text-stone-600")}
                  >
                    {NOTE_META[k].label}
                  </button>
                ))}
            </div>
            <textarea
              className="input min-h-20"
              placeholder={`What happened? What did you learn about ${p.name.split(" ")[0]}?`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {speech.interim && <p className="mt-1 text-sm italic text-stone-400">{speech.interim}</p>}
            <div className="mt-2 flex justify-end gap-2">
              {speech.supported && (
                <button type="button" className={cn("btn-ghost", speech.listening && "!bg-coral-500 !text-white")} onClick={speech.listening ? speech.stop : speech.start}>
                  {speech.listening ? <Square size={14} /> : <Mic size={16} />} {speech.listening ? "Stop" : "Dictate"}
                </button>
              )}
              <button className="btn-primary" disabled={!note.trim()}>
                <Send size={14} /> Add to timeline
              </button>
            </div>
          </form>

          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarDays size={18} /> Timeline
          </h2>
          {p.notes.length === 0 ? (
            <Empty icon={<Plus size={28} />} title="Nothing here yet">
              Notes, calls and voice memos about {p.name.split(" ")[0]} show up here.
            </Empty>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-line pl-6">
              {p.notes.map((n) => {
                const M = NOTE_META[n.kind];
                return (
                  <li key={n.id} className="group relative">
                    <span className={cn("absolute -left-[37px] top-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-paper", M.color)}>
                      <M.icon size={12} />
                    </span>
                    <div className="card p-4">
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                        <span className="font-medium text-ink">{M.label}</span> · {formatDate(n.createdAt)}
                        <button
                          className="ml-auto rounded-full p-1 opacity-0 hover:text-coral-600 group-hover:opacity-100"
                          onClick={() => actions.deleteNote(p.id, n.id)}
                          aria-label="Delete note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
                    </div>
                  </li>
                );
              })}
              <li className="relative">
                <span className="absolute -left-[37px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper ring-4 ring-paper">
                  <Handshake size={12} />
                </span>
                <p className="py-1 text-sm text-muted">
                  First met {formatDate(p.metOn ?? p.createdAt)}
                  {event && ` at ${event.name}`}
                </p>
              </li>
            </ol>
          )}
        </section>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title={`Edit ${p.name}`} wide>
        <PersonForm
          initial={p}
          data={data}
          submitLabel="Save changes"
          onSubmit={(patch) => {
            actions.updatePerson(p.id, { ...patch, cadenceDays: patch.cadenceDays, birthday: patch.birthday });
            if (patch.introducedBy) actions.connect(p.id, patch.introducedBy);
            setEditing(false);
          }}
        />
        <button
          className="mt-3 w-full rounded-full py-2 text-sm font-medium text-coral-700 hover:bg-coral-50"
          onClick={() => {
            if (confirm(`Delete ${p.name} from FREN? This can’t be undone.`)) {
              actions.deletePerson(p.id);
              router.push("/app/people");
            }
          }}
        >
          Delete {p.name}
        </button>
      </Modal>
    </div>
  );
}
