"use client";

import { Check, FileUp, GitMerge, Loader, Mail, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar, Loading, PageHeader, PlatformBadge } from "@/components/ui";
import { parseFile } from "@/lib/importers";
import { actions, findDuplicates, samePerson, type NewPerson } from "@/lib/store";
import { useFren } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { hueFor } from "@/lib/utils";

const SOURCES: { platform: Platform; title: string; how: string; accept: string }[] = [
  { platform: "phone", title: "Phone contacts", how: "iPhone: Contacts → select all → Export vCard. Android: Contacts → Export to .vcf.", accept: ".vcf" },
  { platform: "linkedin", title: "LinkedIn connections", how: "Settings → Data privacy → Get a copy of your data → Connections. Upload Connections.csv.", accept: ".csv" },
  { platform: "email", title: "Google / Outlook contacts", how: "contacts.google.com → Export → Google CSV. Outlook: People → Manage → Export.", accept: ".csv" },
  { platform: "instagram", title: "Instagram", how: "Accounts Centre → Download your information → Followers and following (JSON). Upload following.json.", accept: ".json" },
];

export default function ImportPage() {
  const data = useFren();
  const input = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState(".vcf,.csv,.json");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ people: NewPerson[]; kind: string; file: string } | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) return <Loading />;
  const dupes = findDuplicates(data.people);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await parseFile(f);
      if (!parsed.people.length) setError("Couldn’t find any contacts in that file. Check it’s one of the formats below.");
      else {
        setPreview({ ...parsed, file: f.name });
        setSkip(new Set());
      }
    } catch {
      setError("That file couldn’t be read.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <PageHeader title="Import & merge" subtitle="Bring everyone into one place. FREN merges duplicates so each person shows up once, with all their accounts." />

      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {result && (
        <div className="mb-6 flex items-center gap-2 rounded-3xl bg-mint-100 px-5 py-4 text-sm text-mint-700">
          <Check size={18} /> {result}
          <Link href="/app/graph" className="ml-auto font-medium underline">
            View graph
          </Link>
        </div>
      )}
      {error && <div className="mb-6 rounded-3xl bg-coral-50 px-5 py-4 text-sm text-coral-700">{error}</div>}

      {preview ? (
        <section className="card mb-8 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">
                {preview.people.length} {preview.kind} in {preview.file}
              </h2>
              <p className="text-xs text-muted">Uncheck anyone you don’t want. Matches with people already in FREN get merged, not duplicated.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setPreview(null)}>
                Cancel
              </button>
              <button
                className="btn-accent"
                onClick={() => {
                  const r = actions.importPeople(preview.people.filter((_, i) => !skip.has(i)));
                  setResult(`Added ${r.added} new ${r.added === 1 ? "person" : "people"}, merged ${r.merged} into existing profiles.`);
                  setPreview(null);
                }}
              >
                <Upload size={16} /> Import {preview.people.length - skip.size}
              </button>
            </div>
          </div>
          <div className="max-h-96 divide-y divide-line overflow-y-auto">
            {preview.people.map((p, i) => {
              const existing = data.people.find((x) => samePerson(x, p));
              return (
                <label key={i} className="flex cursor-pointer items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-coral-500"
                    checked={!skip.has(i)}
                    onChange={() =>
                      setSkip((s) => {
                        const n = new Set(s);
                        if (n.has(i)) n.delete(i);
                        else n.add(i);
                        return n;
                      })
                    }
                  />
                  <Avatar person={{ name: p.name, hue: hueFor(p.name) }} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{[p.role, p.company].filter(Boolean).join(" · ") || p.accounts?.[0]?.handle}</span>
                  </span>
                  {existing && <span className="chip bg-lilac-100 text-lilac-700">merges into {existing.name}</span>}
                </label>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <button
              key={s.title}
              className="card group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => {
                setAccept(s.accept);
                setTimeout(() => input.current?.click());
              }}
              disabled={busy}
            >
              <PlatformBadge platform={s.platform} size={40} />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  {s.title}
                  <span className="text-xs font-normal text-muted">{s.accept}</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{s.how}</span>
              </span>
              {busy ? <Loader size={18} className="ml-auto animate-spin text-muted" /> : <FileUp size={18} className="ml-auto shrink-0 text-muted group-hover:text-coral-500" />}
            </button>
          ))}
          <div className="card flex items-start gap-4 border-dashed bg-transparent p-5 sm:col-span-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-500">
              <Mail size={20} />
            </span>
            <span>
              <span className="font-semibold">Live sync with Gmail, LinkedIn and Instagram</span>
              <span className="mt-1 block text-xs text-muted">
                Next on the roadmap: connect accounts once and FREN keeps profiles and “last talked” dates fresh automatically. For the MVP, imports run from files you export, so nothing leaves your device.
              </span>
            </span>
          </div>
        </div>
      )}

      {!preview && (
        <p className="-mt-4 mb-8 text-xs text-muted">
          No export handy? Try the samples:{" "}
          <a href="/samples/linkedin-connections.csv" download className="font-medium text-coral-600 underline">
            LinkedIn CSV
          </a>{" "}
          ·{" "}
          <a href="/samples/phone-contacts.vcf" download className="font-medium text-coral-600 underline">
            phone contacts .vcf
          </a>
        </p>
      )}

      <section>
        <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-semibold">
          <GitMerge size={20} className="text-lilac-500" /> Possible duplicates
        </h2>
        <p className="mb-4 text-sm text-muted">Same person, different apps. Merging combines their accounts, notes and mutuals.</p>
        {dupes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line px-5 py-6 text-center text-sm text-muted">No duplicates. Every person shows up once.</p>
        ) : (
          <div className="space-y-3">
            {dupes.map(([a, b, why]) => (
              <div key={a.id + b.id} className="card flex flex-wrap items-center gap-3 p-4">
                {[a, b].map((p) => (
                  <Link key={p.id} href={`/app/people/${p.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                    <Avatar person={p} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="block truncate text-xs text-muted">{p.sources.join(", ")}</span>
                    </span>
                  </Link>
                ))}
                <span className="chip bg-stone-100 text-stone-600">{why}</span>
                <button className="btn-primary !py-1.5 text-xs" onClick={() => actions.merge(a.id, b.id)}>
                  <GitMerge size={14} /> Merge
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
