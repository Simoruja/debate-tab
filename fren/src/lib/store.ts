"use client";

import { useSyncExternalStore } from "react";
import { demoData, emptyData } from "./seed";
import type { Account, FrenData, FrenEvent, Note, NoteKind, Person } from "./types";
import { hueFor, normalize, uid } from "./utils";

/**
 * FREN keeps everything on the device: a single JSON document in
 * localStorage. That is the "private layer" — nothing leaves the browser
 * unless the user explicitly exports it or turns on AI parsing.
 */
const KEY = "fren:v1";

let state: FrenData | null = null;
const listeners = new Set<() => void>();

function load(): FrenData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FrenData;
  } catch {
    // Storage blocked or corrupt: fall through to demo data.
  }
  return demoData();
}

function commit(next: FrenData) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: keep working in memory.
  }
  listeners.forEach((l) => l());
}

function get(): FrenData {
  if (!state) state = load();
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during SSR / first paint, then the live data. */
export function useFren(): FrenData | null {
  return useSyncExternalStore(subscribe, get, () => null);
}

function mutate(fn: (d: FrenData) => FrenData) {
  commit(fn(get()));
}

const mapPeople = (d: FrenData, fn: (p: Person) => Person): FrenData => ({ ...d, people: d.people.map(fn) });

function mergeAccounts(a: Account[], b: Account[]) {
  const seen = new Set(a.map((x) => `${x.platform}:${normalize(x.handle)}`));
  return [...a, ...b.filter((x) => !seen.has(`${x.platform}:${normalize(x.handle)}`))];
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export type NewPerson = Partial<Omit<Person, "id" | "hue" | "createdAt">> & { name: string };

function makePerson(input: NewPerson): Person {
  return {
    circle: "acquaintance",
    tags: [],
    interests: [],
    accounts: [],
    connections: [],
    notes: [],
    sources: ["manual"],
    ...input,
    id: uid(),
    hue: hueFor(input.name),
    createdAt: new Date().toISOString(),
    metOn: input.metOn ?? new Date().toISOString(),
  };
}

export const actions = {
  addPerson(input: NewPerson): string {
    const p = makePerson(input);
    mutate((d) => {
      // Keep connection edges symmetric.
      const people = d.people.map((o) =>
        p.connections.includes(o.id) ? { ...o, connections: uniq([...o.connections, p.id]) } : o,
      );
      return { ...d, people: [p, ...people] };
    });
    return p.id;
  },

  updatePerson(id: string, patch: Partial<Person>) {
    mutate((d) => mapPeople(d, (p) => (p.id === id ? { ...p, ...patch } : p)));
  },

  deletePerson(id: string) {
    mutate((d) => ({
      ...d,
      people: d.people
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          connections: p.connections.filter((c) => c !== id),
          introducedBy: p.introducedBy === id ? undefined : p.introducedBy,
        })),
    }));
  },

  connect(a: string, b: string) {
    if (a === b) return;
    mutate((d) =>
      mapPeople(d, (p) =>
        p.id === a ? { ...p, connections: uniq([...p.connections, b]) } : p.id === b ? { ...p, connections: uniq([...p.connections, a]) } : p,
      ),
    );
  },

  disconnect(a: string, b: string) {
    mutate((d) =>
      mapPeople(d, (p) =>
        p.id === a || p.id === b ? { ...p, connections: p.connections.filter((c) => c !== a && c !== b) } : p,
      ),
    );
  },

  addNote(id: string, kind: NoteKind, text: string, opts: { touch?: boolean } = {}) {
    const note: Note = { id: uid(), kind, text, createdAt: new Date().toISOString() };
    mutate((d) =>
      mapPeople(d, (p) =>
        p.id === id
          ? { ...p, notes: [note, ...p.notes], lastContactedAt: opts.touch ? note.createdAt : p.lastContactedAt }
          : p,
      ),
    );
  },

  deleteNote(id: string, noteId: string) {
    mutate((d) => mapPeople(d, (p) => (p.id === id ? { ...p, notes: p.notes.filter((n) => n.id !== noteId) } : p)));
  },

  ensureEvent(name: string, date = new Date().toISOString(), location?: string): string {
    const existing = get().events.find((e) => normalize(e.name) === normalize(name));
    if (existing) return existing.id;
    const ev: FrenEvent = { id: uid(), name, date, location };
    mutate((d) => ({ ...d, events: [ev, ...d.events] }));
    return ev.id;
  },

  updateEvent(id: string, patch: Partial<FrenEvent>) {
    mutate((d) => ({ ...d, events: d.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  },

  deleteEvent(id: string) {
    mutate((d) => ({
      ...d,
      events: d.events.filter((e) => e.id !== id),
      people: d.people.map((p) => (p.eventId === id ? { ...p, eventId: undefined } : p)),
    }));
  },

  /** Imports contacts, merging into an existing person when name, email or phone match. */
  importPeople(list: NewPerson[]): { added: number; merged: number } {
    let added = 0;
    let merged = 0;
    mutate((d) => {
      const people = [...d.people];
      for (const input of list) {
        const match = people.findIndex((p) => samePerson(p, input));
        if (match >= 0) {
          const p = people[match];
          people[match] = {
            ...p,
            role: p.role ?? input.role,
            company: p.company ?? input.company,
            location: p.location ?? input.location,
            birthday: p.birthday ?? input.birthday,
            accounts: mergeAccounts(p.accounts, input.accounts ?? []),
            sources: uniq([...p.sources, ...(input.sources ?? [])]),
            tags: uniq([...p.tags, ...(input.tags ?? [])]),
          };
          merged++;
        } else {
          people.push(makePerson(input));
          added++;
        }
      }
      return { ...d, people };
    });
    return { added, merged };
  },

  /** Folds `dropId` into `keepId`, rewiring every edge that pointed at it. */
  merge(keepId: string, dropId: string) {
    mutate((d) => {
      const keep = d.people.find((p) => p.id === keepId);
      const drop = d.people.find((p) => p.id === dropId);
      if (!keep || !drop) return d;
      const combined: Person = {
        ...drop,
        ...Object.fromEntries(Object.entries(keep).filter(([, v]) => v !== undefined && v !== "")),
        accounts: mergeAccounts(keep.accounts, drop.accounts),
        tags: uniq([...keep.tags, ...drop.tags]),
        interests: uniq([...keep.interests, ...drop.interests]),
        sources: uniq([...keep.sources, ...drop.sources]),
        connections: uniq([...keep.connections, ...drop.connections]).filter((c) => c !== keepId && c !== dropId),
        notes: [...keep.notes, ...drop.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        howWeMet: [keep.howWeMet, drop.howWeMet].filter(Boolean).join(" · ") || undefined,
      } as Person;
      return {
        ...d,
        people: d.people
          .filter((p) => p.id !== dropId)
          .map((p) => {
            if (p.id === keepId) return combined;
            const connections = uniq(p.connections.map((c) => (c === dropId ? keepId : c)));
            return { ...p, connections, introducedBy: p.introducedBy === dropId ? keepId : p.introducedBy };
          }),
      };
    });
  },

  recordRecall(id: string, correct: boolean) {
    mutate((d) => {
      const prev = d.recall[id] ?? { seen: 0, correct: 0, lastSeen: "" };
      return {
        ...d,
        recall: {
          ...d.recall,
          [id]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), lastSeen: new Date().toISOString() },
        },
      };
    });
  },

  setMyName(name: string) {
    mutate((d) => ({ ...d, me: { name } }));
  },

  replace(data: FrenData) {
    commit(data);
  },

  reset(kind: "demo" | "empty") {
    commit(kind === "demo" ? demoData() : emptyData());
  },
};

function contactKeys(p: { accounts?: Account[] }) {
  return (p.accounts ?? [])
    .filter((a) => a.platform === "email" || a.platform === "phone" || a.platform === "linkedin")
    .map((a) => `${a.platform}:${a.platform === "phone" ? a.handle.replace(/\D/g, "").slice(-9) : normalize(a.handle)}`);
}

export function samePerson(a: { name: string; accounts?: Account[] }, b: { name: string; accounts?: Account[] }) {
  if (normalize(a.name) && normalize(a.name) === normalize(b.name)) return true;
  const keys = new Set(contactKeys(a));
  return contactKeys(b).some((k) => keys.has(k));
}

/** Pairs that look like the same human imported from different places. */
export function findDuplicates(people: Person[]): [Person, Person, string][] {
  const out: [Person, Person, string][] = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i];
      const b = people[j];
      const keys = new Set(contactKeys(a));
      const shared = contactKeys(b).find((k) => keys.has(k));
      if (shared) out.push([a, b, `Same ${shared.split(":")[0]}`]);
      else if (normalize(a.name) === normalize(b.name)) out.push([a, b, "Same name"]);
      else {
        const [af, al] = [a.name.split(" ")[0], a.name.split(" ").slice(-1)[0]].map(normalize);
        const [bf, bl] = [b.name.split(" ")[0], b.name.split(" ").slice(-1)[0]].map(normalize);
        if (al === bl && al.length > 2 && (af.startsWith(bf) || bf.startsWith(af))) out.push([a, b, "Similar name"]);
      }
    }
  }
  return out;
}

export function mutualsOf(data: FrenData, a: string, b: string) {
  const pa = data.people.find((p) => p.id === a);
  const pb = data.people.find((p) => p.id === b);
  if (!pa || !pb) return [];
  const set = new Set(pb.connections);
  return data.people.filter((p) => pa.connections.includes(p.id) && set.has(p.id));
}
