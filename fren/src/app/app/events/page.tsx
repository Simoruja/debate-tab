"use client";

import { CalendarDays, MapPin, Mic, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, Empty, Loading, Modal, PageHeader } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import type { FrenEvent, Person } from "@/lib/types";
import { formatDate, relativeDay } from "@/lib/utils";

/** A connection "stuck" if you have been in touch at least a day after the event. */
function stuck(p: Person, ev: FrenEvent) {
  return !!p.lastContactedAt && new Date(p.lastContactedAt).getTime() - new Date(ev.date).getTime() > 86_400_000;
}

export default function EventsPage() {
  const data = useFren();
  const [editing, setEditing] = useState<FrenEvent | "new" | null>(null);

  if (!data) return <Loading />;
  const events = [...data.events].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Every room you’ve been in, and who you met there."
        action={
          <button className="btn-ghost" onClick={() => setEditing("new")}>
            <Plus size={16} /> Add event
          </button>
        }
      />

      {events.length === 0 ? (
        <Empty icon={<CalendarDays size={30} />} title="No events yet">
          Mention a place in a voice note (“met Sam at the Climate Mixer”) and FREN creates the event for you.
        </Empty>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const people = data.people.filter((p) => p.eventId === ev.id);
            const kept = people.filter((p) => stuck(p, ev));
            const pct = people.length ? Math.round((kept.length / people.length) * 100) : 0;
            return (
              <section key={ev.id} id={ev.id} className="card scroll-mt-24 p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-lilac-100 text-lilac-700">
                    <span className="text-[10px] font-semibold uppercase">{new Date(ev.date).toLocaleDateString(undefined, { month: "short" })}</span>
                    <span className="font-display text-xl font-bold leading-none">{new Date(ev.date).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-semibold">{ev.name}</h2>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      <span>{relativeDay(ev.date)}</span>
                      {ev.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} /> {ev.location}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold">
                      {kept.length}/{people.length}
                    </p>
                    <p className="text-xs text-muted">stuck</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded-full p-2 text-muted hover:bg-stone-100" onClick={() => setEditing(ev)} aria-label="Edit event">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${pct}%` }} />
                </div>

                {people.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {people.map((p) => (
                      <Link key={p.id} href={`/app/people/${p.id}`} className="flex items-start gap-3 rounded-2xl p-2 hover:bg-stone-50">
                        <Avatar person={p} size={36} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {p.name}
                            {stuck(p, ev) ? (
                              <span className="chip bg-mint-100 !py-0 text-[10px] text-mint-700">in touch</span>
                            ) : (
                              <span className="chip bg-coral-50 !py-0 text-[10px] text-coral-700">not since</span>
                            )}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted">{p.howWeMet ?? [p.role, p.company].filter(Boolean).join(" · ")}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">Nobody linked to this event yet.</p>
                )}
                <Link href="/app/capture" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-coral-600 hover:underline">
                  <Mic size={14} /> Add someone you met here
                </Link>
              </section>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New event" : "Edit event"}>
        {editing && <EventForm event={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function EventForm({ event, onDone }: { event?: FrenEvent; onDone: () => void }) {
  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState((event?.date ?? new Date().toISOString()).slice(0, 10));
  const [location, setLocation] = useState(event?.location ?? "");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const iso = new Date(`${date}T12:00:00`).toISOString();
        if (event) actions.updateEvent(event.id, { name: name.trim(), date: iso, location: location || undefined });
        else actions.ensureEvent(name.trim(), iso, location || undefined);
        onDone();
      }}
    >
      <div>
        <label className="label">Name</label>
        <input className="input" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Founders’ dinner" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Where</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      <button className="btn-primary w-full !py-3">{event ? "Save" : "Create event"}</button>
      {event && (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium text-coral-700 hover:bg-coral-50"
          onClick={() => {
            if (confirm(`Delete “${event.name}”? People stay, they just lose the link.`)) {
              actions.deleteEvent(event.id);
              onDone();
            }
          }}
        >
          <Trash2 size={14} /> Delete event
        </button>
      )}
      {event && <p className="text-center text-xs text-muted">Created {formatDate(event.date)}</p>}
    </form>
  );
}
