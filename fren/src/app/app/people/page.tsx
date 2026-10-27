"use client";

import { LayoutGrid, List, Mic, Search, Star, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PersonForm } from "@/components/person-form";
import { subtitle } from "@/components/person-row";
import { Avatar, Empty, Loading, Modal, PageHeader, PlatformBadge } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import type { Circle, Person, Source } from "@/lib/types";
import { CIRCLES, cn, normalize, relativeDay } from "@/lib/utils";

type Sort = "recent" | "name" | "contact";

const SOURCE_LABEL: Record<Source, string> = {
  voice: "Voice notes",
  manual: "Added by hand",
  contacts: "Phone contacts",
  email: "Email",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
};

export default function PeoplePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PeopleView />
    </Suspense>
  );
}

function PeopleView() {
  const data = useFren();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [circle, setCircle] = useState<Circle | "all" | "starred">("all");
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [source, setSource] = useState<Source | "">("");
  const [sort, setSort] = useState<Sort>("recent");
  const [grid, setGrid] = useState(true);
  const [adding, setAdding] = useState(false);

  const tags = useMemo(() => [...new Set(data?.people.flatMap((p) => p.tags) ?? [])].sort(), [data]);

  const list = useMemo(() => {
    if (!data) return [];
    const needle = normalize(q);
    const eventName = (p: Person) => data.events.find((e) => e.id === p.eventId)?.name ?? "";
    return data.people
      .filter((p) => (circle === "all" ? true : circle === "starred" ? p.starred : p.circle === circle))
      .filter((p) => !tag || p.tags.includes(tag))
      .filter((p) => !source || p.sources.includes(source))
      .filter((p) => {
        if (!needle) return true;
        const hay = [p.name, p.role, p.company, p.location, p.howWeMet, eventName(p), ...p.tags, ...p.interests, ...p.accounts.map((a) => a.handle), ...p.notes.map((n) => n.text)]
          .filter(Boolean)
          .join(" ");
        return normalize(hay).includes(needle) || hay.toLowerCase().includes(q.toLowerCase());
      })
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "contact"
            ? (a.lastContactedAt ?? "").localeCompare(b.lastContactedAt ?? "")
            : (b.metOn ?? b.createdAt).localeCompare(a.metOn ?? a.createdAt),
      );
  }, [data, q, circle, tag, source, sort]);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="People"
        subtitle={`${data.people.length} people across ${new Set(data.people.flatMap((p) => p.sources)).size} sources`}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setAdding(true)}>
              <UserPlus size={16} /> Add
            </button>
            <Link href="/app/capture" className="btn-accent">
              <Mic size={16} /> Voice note
            </Link>
          </div>
        }
      />

      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          className="input !rounded-full !py-3 !pl-11"
          placeholder="Search names, companies, “met at”, interests, notes, handles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(["all", "starred", ...Object.keys(CIRCLES)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCircle(c as typeof circle)}
              className={cn(
                "chip shrink-0 border !py-1.5 transition",
                circle === c ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone-600 hover:border-stone-300",
              )}
            >
              {c === "all" ? "Everyone" : c === "starred" ? "★ Starred" : CIRCLES[c as Circle].label}
            </button>
          ))}
        </div>
        <select className="input !w-auto !rounded-full !py-1.5 text-xs" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag">
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
        <select className="input !w-auto !rounded-full !py-1.5 text-xs" value={source} onChange={(e) => setSource(e.target.value as Source)} aria-label="Source">
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="input !w-auto !rounded-full !py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="recent">Recently met</option>
          <option value="name">A–Z</option>
          <option value="contact">Longest since contact</option>
        </select>
        <div className="ml-auto flex rounded-full border border-line bg-white p-0.5">
          <button className={cn("rounded-full p-1.5", grid && "bg-stone-100")} onClick={() => setGrid(true)} aria-label="Grid view">
            <LayoutGrid size={16} />
          </button>
          <button className={cn("rounded-full p-1.5", !grid && "bg-stone-100")} onClick={() => setGrid(false)} aria-label="List view">
            <List size={16} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<Users size={30} />} title={data.people.length ? "Nobody matches" : "Your network starts here"}>
          {data.people.length ? "Try a different search or filter." : "Record a voice note after you meet someone, or import your contacts."}
        </Empty>
      ) : grid ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PersonCard key={p.id} person={p} event={data.events.find((e) => e.id === p.eventId)?.name} />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {list.map((p) => (
            <Link key={p.id} href={`/app/people/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
              <Avatar person={p} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-muted">{subtitle(p)}</span>
              </span>
              <span className="hidden gap-1 sm:flex">
                {p.accounts.slice(0, 4).map((a, i) => (
                  <PlatformBadge key={i} platform={a.platform} size={18} />
                ))}
              </span>
              <span className="w-24 text-right text-xs text-muted">{relativeDay(p.lastContactedAt)}</span>
            </Link>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add someone" wide>
        <PersonForm
          data={data}
          submitLabel="Add to FREN"
          onSubmit={(p) => {
            const id = actions.addPerson({ ...p, sources: ["manual"] });
            setAdding(false);
            router.push(`/app/people/${id}`);
          }}
        />
      </Modal>
    </div>
  );
}

function PersonCard({ person: p, event }: { person: Person; event?: string }) {
  return (
    <Link href={`/app/people/${p.id}`} className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar person={p} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold">
            {p.name} {p.starred && <Star size={14} className="shrink-0 fill-coral-500 text-coral-500" />}
          </p>
          <p className="truncate text-xs text-muted">{[p.role, p.company].filter(Boolean).join(" · ") || p.location || " "}</p>
        </div>
        <span className="chip shrink-0" style={{ background: `${CIRCLES[p.circle].dot}1f`, color: CIRCLES[p.circle].dot }}>
          {CIRCLES[p.circle].label}
        </span>
      </div>
      {p.howWeMet && <p className="mt-3 line-clamp-2 text-sm text-stone-600">{p.howWeMet}</p>}
      <div className="mt-auto flex items-center gap-1.5 pt-3">
        {p.accounts.slice(0, 5).map((a, i) => (
          <PlatformBadge key={i} platform={a.platform} size={18} />
        ))}
        <span className="ml-auto truncate text-xs text-stone-400">{event ?? relativeDay(p.metOn)}</span>
      </div>
    </Link>
  );
}
