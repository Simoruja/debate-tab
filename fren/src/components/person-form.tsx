"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { NewPerson } from "@/lib/store";
import type { Account, Circle, FrenData, Person, Platform } from "@/lib/types";
import { CADENCES, CIRCLES, PLATFORMS } from "@/lib/utils";
import { AccountChip, TagInput } from "./ui";

/** Shared add/edit form. Returns the fields; the caller decides whether to create or update. */
export function PersonForm({
  initial,
  data,
  onSubmit,
  submitLabel,
}: {
  initial?: Person;
  data: FrenData;
  onSubmit: (p: NewPerson) => void;
  submitLabel: string;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    role: initial?.role ?? "",
    company: initial?.company ?? "",
    location: initial?.location ?? "",
    howWeMet: initial?.howWeMet ?? "",
    eventId: initial?.eventId ?? "",
    introducedBy: initial?.introducedBy ?? "",
    circle: initial?.circle ?? ("acquaintance" as Circle),
    birthday: initial?.birthday ?? "",
    cadenceDays: initial?.cadenceDays ?? 0,
  });
  const [tags, setTags] = useState(initial?.tags ?? []);
  const [interests, setInterests] = useState(initial?.interests ?? []);
  const [accounts, setAccounts] = useState<Account[]>(initial?.accounts ?? []);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: k === "cadenceDays" ? Number(e.target.value) : e.target.value }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        const pending = handle.trim() ? [...accounts, { platform, handle: handle.trim().replace(/^@/, "") }] : accounts;
        onSubmit({
          name: f.name.trim(),
          role: f.role || undefined,
          company: f.company || undefined,
          location: f.location || undefined,
          howWeMet: f.howWeMet || undefined,
          eventId: f.eventId || undefined,
          introducedBy: f.introducedBy || undefined,
          circle: f.circle,
          birthday: /^\d{2}-\d{2}$/.test(f.birthday) ? f.birthday : undefined,
          cadenceDays: f.cadenceDays || undefined,
          tags,
          interests,
          accounts: pending,
        });
      }}
    >
      <div>
        <label className="label" htmlFor="pf-name">Name</label>
        <input id="pf-name" className="input" required autoFocus value={f.name} onChange={set("name")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Role</label>
          <input className="input" value={f.role} onChange={set("role")} />
        </div>
        <div>
          <label className="label">Company</label>
          <input className="input" value={f.company} onChange={set("company")} />
        </div>
        <div>
          <label className="label">Lives in</label>
          <input className="input" value={f.location} onChange={set("location")} />
        </div>
        <div>
          <label className="label">Birthday (MM-DD)</label>
          <input className="input" placeholder="04-21" value={f.birthday} onChange={set("birthday")} pattern="\d{2}-\d{2}" />
        </div>
      </div>
      <div>
        <label className="label">How you know them</label>
        <textarea className="input min-h-16" value={f.howWeMet} onChange={set("howWeMet")} placeholder="The detail that will make you remember" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Met at</label>
          <select className="input" value={f.eventId} onChange={set("eventId")}>
            <option value="">—</option>
            {data.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Introduced by</label>
          <select className="input" value={f.introducedBy} onChange={set("introducedBy")}>
            <option value="">—</option>
            {data.people
              .filter((p) => p.id !== initial?.id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="label">Circle</label>
          <select className="input" value={f.circle} onChange={set("circle")}>
            {Object.entries(CIRCLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Keep in touch</label>
          <select className="input" value={f.cadenceDays} onChange={set("cadenceDays")}>
            {CADENCES.map((c) => (
              <option key={c.days} value={c.days}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Tags</label>
        <TagInput value={tags} onChange={setTags} placeholder="uni, climbing, investor…" />
      </div>
      <div>
        <label className="label">Interests</label>
        <TagInput value={interests} onChange={setInterests} placeholder="What do they love talking about?" />
      </div>
      <div>
        <label className="label">Accounts</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {accounts.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <AccountChip account={a} />
              <button type="button" onClick={() => setAccounts(accounts.filter((_, j) => j !== i))} aria-label="Remove account" className="text-muted">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select className="input !w-auto" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} aria-label="Platform">
            {Object.entries(PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <input className="input" placeholder="handle, email or number" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button
            type="button"
            className="btn-ghost"
            aria-label="Add account"
            onClick={() => {
              if (!handle.trim()) return;
              setAccounts([...accounts, { platform, handle: handle.trim().replace(/^@/, "") }]);
              setHandle("");
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <button className="btn-primary w-full !py-3" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
