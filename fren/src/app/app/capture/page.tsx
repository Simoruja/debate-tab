"use client";

import { Check, Cpu, Link2, Loader, Mic, Plus, Sparkles, Square, Trash2, Wand2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccountChip, Avatar, Loading, PageHeader, TagInput } from "@/components/ui";
import { extractOnDevice, matchKnown } from "@/lib/extract";
import { actions, useFren } from "@/lib/store";
import type { Account, Circle, Extraction, FrenData, Platform } from "@/lib/types";
import { useSpeech } from "@/lib/use-speech";
import { CIRCLES, cn, hueFor, PLATFORMS, uid } from "@/lib/utils";

const SAMPLES = [
  "Just met Amara's cofounder Felix Brandt at Web Summit. He's a CTO at Gridlight, based in Lisbon, loves free diving and old Nokia phones. Instagram @felixdives. Follow up next week about the pilot.",
  "Met Sarah Chen and her cofounder Tom at the Climate Tech Mixer. Sarah is a designer at Pitch, lives in Amsterdam, loves climbing and natural wine. She knows Tomas and Maya. Instagram @sarahdraws",
  "met josh at the gym today, he's into powerlifting and crypto, works at Adyen. his birthday is March 3rd",
];

interface Draft {
  key: string;
  include: boolean;
  matchId: string | null;
  name: string;
  role: string;
  company: string;
  location: string;
  howWeMet: string;
  eventName: string;
  introducedBy: string;
  interests: string[];
  accounts: Account[];
  connectionIds: string[];
  circle: Circle;
  followUpDays: number | null;
  birthday: string;
}

function toDrafts(x: Extraction, data: FrenData): Draft[] {
  const known = data.people.map((p) => ({ id: p.id, name: p.name }));
  return x.people.map((p) => {
    const match = matchKnown(p.name, known);
    return {
      key: uid(),
      include: true,
      matchId: match?.id ?? null,
      name: match?.name ?? p.name,
      role: p.role ?? "",
      company: p.company ?? "",
      location: p.location ?? "",
      howWeMet: p.howWeMet ?? "",
      eventName: p.eventName ?? "",
      introducedBy: p.introducedBy ?? "",
      interests: p.interests,
      accounts: p.accounts,
      connectionIds: p.mentions.map((m) => matchKnown(m, known)?.id).filter((id): id is string => !!id && id !== match?.id),
      circle: "acquaintance",
      followUpDays: p.followUpDays,
      birthday: p.birthday ?? "",
    };
  });
}

export default function CapturePage() {
  const data = useFren();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<Extraction["engine"] | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [saved, setSaved] = useState<{ id: string; name: string }[] | null>(null);

  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((j: { enabled: boolean }) => setAiEnabled(j.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const append = useCallback((t: string) => setText((prev) => (prev ? `${prev.replace(/\s+$/, "")} ${t}` : t)), []);
  const speech = useSpeech(append);

  if (!data) return <Loading />;

  async function process() {
    if (!data || !text.trim()) return;
    setBusy(true);
    setSaved(null);
    let result: Extraction | null = null;
    if (aiEnabled) {
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript: text, known: data.people.map((p) => p.name), events: data.events.map((e) => e.name) }),
        });
        if (res.ok) result = (await res.json()) as Extraction;
      } catch {
        // Offline or the model call failed: on-device parser below.
      }
    }
    result ??= extractOnDevice(text, data.people.map((p) => ({ id: p.id, name: p.name })));
    setEngine(result.engine);
    setDrafts(toDrafts(result, data));
    setBusy(false);
  }

  function save() {
    if (!data || !drafts) return;
    const now = new Date().toISOString();
    const included = drafts.filter((d) => d.include && d.name.trim());
    const ids = new Map<string, string>();
    const known = data.people.map((p) => ({ id: p.id, name: p.name }));

    for (const d of included) {
      const eventId = d.eventName.trim() ? actions.ensureEvent(d.eventName.trim()) : undefined;
      const existing = d.matchId ? data.people.find((p) => p.id === d.matchId) : undefined;
      if (existing) {
        const seen = new Set(existing.accounts.map((a) => `${a.platform}:${a.handle}`));
        actions.updatePerson(existing.id, {
          role: existing.role || d.role || undefined,
          company: existing.company || d.company || undefined,
          location: existing.location || d.location || undefined,
          birthday: existing.birthday || d.birthday || undefined,
          interests: [...new Set([...existing.interests, ...d.interests])],
          accounts: [...existing.accounts, ...d.accounts.filter((a) => !seen.has(`${a.platform}:${a.handle}`))],
          sources: [...new Set([...existing.sources, "voice" as const])],
          lastContactedAt: now,
        });
        actions.addNote(existing.id, "voice", text.trim());
        ids.set(d.key, existing.id);
      } else {
        const id = actions.addPerson({
          name: d.name.trim(),
          role: d.role || undefined,
          company: d.company || undefined,
          location: d.location || undefined,
          howWeMet: d.howWeMet || undefined,
          eventId,
          circle: d.circle,
          interests: d.interests,
          accounts: d.accounts,
          birthday: d.birthday || undefined,
          cadenceDays: d.followUpDays ?? undefined,
          sources: ["voice"],
          notes: [{ id: uid(), kind: "voice", text: text.trim(), createdAt: now }],
        });
        ids.set(d.key, id);
      }
    }

    // Wire up the graph: people met together know each other, plus anyone they were mentioned with.
    const savedIds = included.map((d) => ids.get(d.key)!);
    for (const d of included) {
      const id = ids.get(d.key)!;
      for (const other of savedIds) if (other !== id) actions.connect(id, other);
      for (const c of d.connectionIds) actions.connect(id, c);
      if (d.introducedBy.trim()) {
        const intro = matchKnown(d.introducedBy, known)?.id ?? included.find((x) => x.name === d.introducedBy)?.key;
        const introId = intro ? (ids.get(intro) ?? intro) : undefined;
        if (introId && introId !== id) {
          actions.updatePerson(id, { introducedBy: introId });
          actions.connect(id, introId);
        }
      }
    }

    setSaved(included.map((d) => ({ id: ids.get(d.key)!, name: d.name })));
    setDrafts(null);
    setText("");
    setEngine(null);
  }

  const patch = (key: string, p: Partial<Draft>) => setDrafts((ds) => ds?.map((d) => (d.key === key ? { ...d, ...p } : d)) ?? null);

  return (
    <div>
      <PageHeader title="Voice note" subtitle="Talk like you would to a friend: who, where, what you talked about, how to find them." />

      {saved && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-3xl bg-mint-100 px-5 py-4 text-sm text-mint-700">
          <Check size={18} /> Saved
          {saved.map((s) => (
            <Link key={s.id} href={`/app/people/${s.id}`} className="chip bg-white font-semibold text-mint-700 hover:underline">
              {s.name}
            </Link>
          ))}
          <span className="ml-auto">
            <Link href="/app/graph" className="font-medium underline">
              See them in your graph
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card flex flex-col items-center p-6">
          <button
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={!speech.supported}
            className={cn(
              "mt-2 flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 disabled:bg-stone-300 disabled:shadow-none",
              speech.listening ? "bg-ink animate-pulse-ring" : "bg-coral-500 shadow-coral-500/30 hover:bg-coral-600",
            )}
            aria-label={speech.listening ? "Stop recording" : "Start recording"}
          >
            {speech.listening ? <Square size={34} fill="currentColor" /> : <Mic size={42} />}
          </button>
          <p className="mt-4 text-sm font-medium">
            {speech.listening ? "Listening… tap to stop" : speech.supported ? "Tap to talk" : "Voice isn’t available in this browser, so type your note instead"}
          </p>
          {speech.error && <p className="mt-2 text-center text-xs text-coral-700">{speech.error}</p>}

          <div className="mt-6 w-full">
            <label htmlFor="note" className="label">
              Transcript
            </label>
            <textarea
              id="note"
              className="input min-h-40 resize-y leading-relaxed"
              placeholder="“Met Sam at the climbing gym, she’s a nurse at OLVG and wants to try the Fontainebleau trip. Insta @samclimbs.”"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {speech.interim && <p className="mt-2 text-sm italic text-stone-400">{speech.interim}</p>}
          </div>

          <div className="mt-4 flex w-full flex-wrap gap-2">
            <button className="btn-primary flex-1" onClick={process} disabled={!text.trim() || busy || speech.listening}>
              {busy ? <Loader size={16} className="animate-spin" /> : <Wand2 size={16} />}
              Turn into contact card
            </button>
            {text && (
              <button className="btn-ghost" onClick={() => (setText(""), setDrafts(null))}>
                Clear
              </button>
            )}
          </div>

          <div className="mt-6 w-full border-t border-line pt-4">
            <p className="label">Or try an example</p>
            <div className="flex flex-col gap-2">
              {SAMPLES.map((s) => (
                <button key={s} onClick={() => setText(s)} className="rounded-2xl bg-stone-100 px-3 py-2 text-left text-xs text-stone-600 hover:bg-stone-200">
                  “{s.slice(0, 96)}…”
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          {!drafts ? (
            <div className="card flex h-full min-h-64 flex-col items-center justify-center p-8 text-center">
              <Sparkles className="mb-3 text-lilac-500" size={30} />
              <p className="font-display text-lg font-semibold">Your card appears here</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                FREN pulls out the name, where you met, what they do, their handles and who they know, then links them into your graph.
              </p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="card p-6 text-sm text-muted">
              No name found in that note. Try starting with “Met <em>name</em> at <em>place</em>…”
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Cpu size={14} /> {engine === "claude" ? "Parsed by Claude" : "Parsed on your device"}. Check it over before saving.
                </span>
              </div>
              {drafts.map((d) => (
                <DraftCard key={d.key} draft={d} data={data} onChange={(p) => patch(d.key, p)} />
              ))}
              <button className="btn-accent w-full !py-3" onClick={save} disabled={!drafts.some((d) => d.include && d.name.trim())}>
                <Check size={18} /> Save {drafts.filter((d) => d.include).length > 1 ? `${drafts.filter((d) => d.include).length} people` : "to FREN"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DraftCard({ draft: d, data, onChange }: { draft: Draft; data: FrenData; onChange: (p: Partial<Draft>) => void }) {
  const match = d.matchId ? data.people.find((p) => p.id === d.matchId) : undefined;
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");

  return (
    <div className={cn("card p-5 transition", !d.include && "opacity-50")}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar person={{ name: d.name || "?", hue: hueFor(d.name) }} size={48} />
        <input className="input !text-lg font-semibold" value={d.name} onChange={(e) => onChange({ name: e.target.value })} aria-label="Name" />
        <button className="rounded-full p-2 text-muted hover:bg-stone-100" onClick={() => onChange({ include: !d.include })} title={d.include ? "Skip this person" : "Include"}>
          {d.include ? <Trash2 size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {match && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-lilac-100 px-3 py-2 text-xs text-lilac-700">
          <Link2 size={14} />
          <span>
            Already in FREN as <strong>{match.name}</strong>. This note will be added to their timeline.
          </span>
          <button className="ml-auto underline" onClick={() => onChange({ matchId: null })}>
            It’s someone else
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Role" value={d.role} onChange={(v) => onChange({ role: v })} />
        <Field label="Company" value={d.company} onChange={(v) => onChange({ company: v })} />
        <Field label="Where you met" value={d.eventName} onChange={(v) => onChange({ eventName: v })} list="fren-events" />
        <Field label="Lives in" value={d.location} onChange={(v) => onChange({ location: v })} />
        {!match && (
          <div className="sm:col-span-2">
            <label className="label">How you know them</label>
            <textarea className="input min-h-16" value={d.howWeMet} onChange={(e) => onChange({ howWeMet: e.target.value })} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Interests & topics</label>
          <TagInput value={d.interests} onChange={(v) => onChange({ interests: v })} placeholder="Type and press enter" />
        </div>
      </div>
      <datalist id="fren-events">
        {data.events.map((e) => (
          <option key={e.id} value={e.name} />
        ))}
      </datalist>

      <div className="mt-4">
        <p className="label">Accounts</p>
        <div className="flex flex-wrap gap-2">
          {d.accounts.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <AccountChip account={a} />
              <button onClick={() => onChange({ accounts: d.accounts.filter((_, j) => j !== i) })} aria-label="Remove account" className="text-muted">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!handle.trim()) return;
            onChange({ accounts: [...d.accounts, { platform, handle: handle.trim().replace(/^@/, "") }] });
            setHandle("");
          }}
        >
          <select className="input !w-auto" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} aria-label="Platform">
            {Object.entries(PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <input className="input" placeholder="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="btn-ghost" type="submit" aria-label="Add account">
            <Plus size={16} />
          </button>
        </form>
      </div>

      <div className="mt-4">
        <p className="label">Knows (mutuals)</p>
        <div className="flex flex-wrap gap-2">
          {d.connectionIds.map((id) => {
            const p = data.people.find((x) => x.id === id);
            if (!p) return null;
            return (
              <span key={id} className="chip bg-stone-100 pl-1 text-stone-700">
                <Avatar person={p} size={20} /> {p.name}
                <button onClick={() => onChange({ connectionIds: d.connectionIds.filter((c) => c !== id) })} aria-label={`Remove ${p.name}`}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <select
            className="rounded-full border border-dashed border-line bg-transparent px-3 py-1 text-xs text-muted"
            value=""
            onChange={(e) => e.target.value && onChange({ connectionIds: [...d.connectionIds, e.target.value] })}
            aria-label="Add mutual"
          >
            <option value="">+ add someone they know</option>
            {data.people
              .filter((p) => !d.connectionIds.includes(p.id) && p.id !== d.matchId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {!match && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Circle</label>
            <select className="input" value={d.circle} onChange={(e) => onChange({ circle: e.target.value as Circle })}>
              {Object.entries(CIRCLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Remind me to follow up</label>
            <select
              className="input"
              value={d.followUpDays ?? 0}
              onChange={(e) => onChange({ followUpDays: Number(e.target.value) || null })}
            >
              <option value={0}>No reminder</option>
              <option value={1}>Tomorrow</option>
              <option value={7}>In a week</option>
              <option value={14}>In 2 weeks</option>
              <option value={30}>In a month</option>
              <option value={90}>In 3 months</option>
            </select>
          </div>
          {d.introducedBy && (
            <p className="text-xs text-muted sm:col-span-2">
              Introduced by <strong>{d.introducedBy}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, list }: { label: string; value: string; onChange: (v: string) => void; list?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} list={list} />
    </div>
  );
}
