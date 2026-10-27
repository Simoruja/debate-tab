"use client";

import { ArrowRight, Maximize2, Minus, Plus, Route, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccountChip, Avatar, Loading, PlatformBadge } from "@/components/ui";
import { buildGraph, shortestPath, type GNode } from "@/lib/graph";
import { mutualsOf, useFren } from "@/lib/store";
import type { Circle, FrenData, Platform } from "@/lib/types";
import { CIRCLES, cn, normalize, relativeDay } from "@/lib/utils";

interface View {
  x: number;
  y: number;
  k: number;
}

export function GraphView() {
  const data = useFren();
  const params = useSearchParams();
  const [showEvents, setShowEvents] = useState(true);
  const [showAccounts, setShowAccounts] = useState(false);
  const [circles, setCircles] = useState<Set<string>>(() => new Set(Object.keys(CIRCLES)));
  const [selected, setSelected] = useState<string | null>(params.get("focus"));
  const [q, setQ] = useState("");
  const [pathMode, setPathMode] = useState(false);
  const [pathA, setPathA] = useState("");
  const [pathB, setPathB] = useState("");

  const graph = useMemo(
    () => (data ? buildGraph(data, { events: showEvents, accounts: showAccounts, circles }) : null),
    [data, showEvents, showAccounts, circles],
  );

  if (!data || !graph) return <Loading />;

  const toggleCircle = (c: string) =>
    setCircles((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  // What to light up: a mutual/path query beats a selection, which beats a search.
  let focus: Set<string> | null = null;
  let pathEdges = new Set<string>();
  let path: string[] | null = null;
  let mutuals: FrenData["people"] = [];
  if (pathMode && pathA && pathB) {
    path = shortestPath(data, pathA, pathB);
    mutuals = mutualsOf(data, pathA, pathB);
    focus = new Set([pathA, pathB, ...(path ?? []), ...mutuals.map((m) => m.id)]);
    if (path) for (let i = 0; i < path.length - 1; i++) pathEdges.add([path[i], path[i + 1]].sort().join("|"));
    for (const m of mutuals) {
      pathEdges.add([pathA, m.id].sort().join("|"));
      pathEdges.add([pathB, m.id].sort().join("|"));
    }
  } else if (selected) {
    focus = new Set([selected]);
    for (const l of graph.links) {
      if (l.source === selected) focus.add(l.target);
      if (l.target === selected) focus.add(l.source);
    }
    if (selected !== "me") focus.delete("me");
    pathEdges = new Set();
  } else if (q.trim()) {
    const n = normalize(q);
    focus = new Set(graph.nodes.filter((x) => normalize(x.label).includes(n)).map((x) => x.id));
  }

  return (
    <div className="-mx-4 -mt-6 flex h-[calc(100dvh-8.5rem)] flex-col sm:-mx-6 lg:-mx-10 lg:-mt-10 lg:h-dvh">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-4 py-3 sm:px-6 lg:px-10">
        <h1 className="mr-2 font-display text-2xl font-semibold tracking-tight">Your graph</h1>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input !w-44 !rounded-full !py-1.5 !pl-8 text-xs"
            placeholder="Find someone"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(null);
            }}
          />
        </div>
        <Toggle on={showEvents} onClick={() => setShowEvents((v) => !v)}>
          Events
        </Toggle>
        <Toggle on={showAccounts} onClick={() => setShowAccounts((v) => !v)}>
          Social accounts
        </Toggle>
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        {(Object.keys(CIRCLES) as Circle[]).map((c) => (
          <button
            key={c}
            onClick={() => toggleCircle(c)}
            className={cn("chip border !py-1 transition", circles.has(c) ? "border-line bg-white" : "border-transparent text-stone-400 line-through")}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: CIRCLES[c].dot }} />
            {CIRCLES[c].label}
          </button>
        ))}
        <button
          className={cn("btn ml-auto !py-1.5 text-xs", pathMode ? "bg-ink text-paper" : "border border-line bg-white")}
          onClick={() => {
            setPathMode((v) => !v);
            setSelected(null);
          }}
        >
          <Route size={14} /> Mutuals finder
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Canvas graph={graph} focus={focus} pathEdges={pathEdges} selected={selected} onSelect={(id) => (setSelected(id), setPathMode(false))} />

        {pathMode && (
          <div className="absolute left-3 right-3 top-3 max-w-sm rounded-3xl border border-line bg-white/95 p-4 shadow-xl backdrop-blur sm:right-auto">
            <p className="font-display font-semibold">How are they connected?</p>
            <p className="mb-3 text-xs text-muted">Pick two people to see who you both know and the shortest intro chain.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                [pathA, setPathA],
                [pathB, setPathB],
              ].map(([v, set], i) => (
                <select key={i} className="input !py-1.5 text-xs" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)}>
                  <option value="">{i === 0 ? "First person" : "Second person"}</option>
                  {[...data.people]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              ))}
            </div>
            {pathA && pathB && pathA !== pathB && (
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <strong>{mutuals.length}</strong> mutual{mutuals.length === 1 ? "" : "s"}
                  {mutuals.length > 0 && `: ${mutuals.map((m) => m.name.split(" ")[0]).join(", ")}`}
                </p>
                {path ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {path.map((id, i) => (
                      <span key={id} className="inline-flex items-center gap-1">
                        {i > 0 && <ArrowRight size={12} className="text-stone-400" />}
                        <span className="chip bg-coral-50 text-coral-700">{data.people.find((p) => p.id === id)?.name.split(" ")[0]}</span>
                      </span>
                    ))}
                    <span className="ml-1 text-xs text-muted">{path.length - 2 === 0 ? "they know each other" : `${path.length - 2} hop${path.length > 3 ? "s" : ""}`}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Not connected through anyone you know yet. You’re the bridge.</p>
                )}
              </div>
            )}
          </div>
        )}

        {selected && !pathMode && <SidePanel id={selected} data={data} node={graph.nodes.find((n) => n.id === selected)} onClose={() => setSelected(null)} onSelect={setSelected} />}

        <Legend />
      </div>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("chip border !py-1 transition", on ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone-600")}>
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 hidden flex-col gap-1 rounded-2xl bg-white/85 px-3 py-2 text-[11px] text-muted backdrop-blur sm:flex">
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-5 bg-stone-500" /> know each other
      </span>
      <span className="flex items-center gap-2">
        <span className="h-0 w-5 border-t-2 border-dashed border-lilac-500" /> met at event
      </span>
      <span className="flex items-center gap-2">
        <span className="h-0 w-5 border-t-2 border-dotted border-stone-400" /> on platform
      </span>
    </div>
  );
}

function Canvas({
  graph,
  focus,
  pathEdges,
  selected,
  onSelect,
}: {
  graph: ReturnType<typeof buildGraph>;
  focus: Set<string> | null;
  pathEdges: Set<string>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ x: 400, y: 300, k: 1 });
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ kind: "pan" | "node"; id?: string; sx: number; sy: number; ox: number; oy: number; dist: number } | null>(null);

  const pos = useCallback((n: GNode) => moved[n.id] ?? n, [moved]);

  const fit = useCallback(() => {
    if (!graph.nodes.length) return;
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs) - 60, Math.max(...xs) + 60, Math.min(...ys) - 60, Math.max(...ys) + 60];
    const k = Math.min(size.w / (maxX - minX), size.h / (maxY - minY), 1.4);
    setView({ k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k });
  }, [graph, size]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-fit whenever the graph or the viewport changes; drop manual drags from the old layout.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoved({});
    fit();
  }, [fit]);

  // Wheel zoom needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const k = Math.min(3, Math.max(0.25, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const zoom = (f: number) => setView((v) => ({ k: v.k * f, x: size.w / 2 - ((size.w / 2 - v.x) * f), y: size.h / 2 - ((size.h / 2 - v.y) * f) }));

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,#fff_0,#fbf7f1_70%)]">
      <svg
        ref={svg}
        width={size.w}
        height={size.h}
        className="touch-none select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, dist: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          d.dist = Math.max(d.dist, Math.abs(dx) + Math.abs(dy));
          if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
          else if (d.id && d.id !== "me") setMoved((m) => ({ ...m, [d.id!]: { x: d.ox + dx / view.k, y: d.oy + dy / view.k } }));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.dist > 4) return;
          onSelect(d.kind === "node" ? d.id! : null);
        }}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {graph.links.map((l, i) => {
            const s = pos(byId.get(l.source)!);
            const t = pos(byId.get(l.target)!);
            const key = [l.source, l.target].sort().join("|");
            const onPath = pathEdges.has(key);
            const lit = onPath || (!pathEdges.size && focus ? focus.has(l.source) && focus.has(l.target) && (l.source === selected || l.target === selected || !selected) : !focus);
            const base =
              l.kind === "me"
                ? { stroke: "#1d1a16", w: 0.6, o: 0.08, dash: undefined }
                : l.kind === "knows"
                  ? { stroke: "#57534e", w: 1.6, o: 0.55, dash: undefined }
                  : l.kind === "event"
                    ? { stroke: "#7c66f0", w: 1.2, o: 0.5, dash: "5 4" }
                    : { stroke: l.color ?? "#a8a29e", w: 1, o: 0.35, dash: "1.5 4" };
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={onPath ? "#ff6b3d" : base.stroke}
                strokeWidth={onPath ? 3 : base.w}
                strokeDasharray={base.dash}
                strokeLinecap="round"
                opacity={onPath ? 1 : lit ? (focus ? Math.max(base.o, 0.6) : base.o) : 0.05}
              />
            );
          })}
          {graph.nodes.map((n) => {
            const p = pos(n);
            const dim = focus && !focus.has(n.id);
            const isSel = n.id === selected;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                opacity={dim ? 0.18 : 1}
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget.ownerSVGElement as Element | null)?.setPointerCapture?.(e.pointerId);
                  drag.current = { kind: "node", id: n.id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, dist: 0 };
                }}
              >
                {isSel && <circle r={n.r + 7} fill="none" stroke="#ff6b3d" strokeWidth={2.5} />}
                {n.kind === "event" ? (
                  <rect x={-n.r} y={-n.r} width={n.r * 2} height={n.r * 2} rx={4} transform="rotate(45)" fill="#ece7ff" stroke="#7c66f0" strokeWidth={2} />
                ) : n.kind === "platform" ? (
                  <>
                    <rect x={-n.r} y={-n.r} width={n.r * 2} height={n.r * 2} rx={8} fill={n.color} />
                    <text textAnchor="middle" dy="0.35em" fontSize={10} fontWeight={700} fill="#fff">
                      {n.label.slice(0, 2)}
                    </text>
                  </>
                ) : n.kind === "me" ? (
                  <>
                    <circle r={n.r} fill="#1d1a16" />
                    <text textAnchor="middle" dy="0.35em" fontSize={11} fontWeight={700} fill="#fbf7f1">
                      YOU
                    </text>
                  </>
                ) : (
                  <>
                    <circle r={n.r} fill="#fff" stroke={n.color} strokeWidth={3} />
                    <text textAnchor="middle" dy="0.35em" fontSize={n.r * 0.72} fontWeight={700} fill={n.color} className="font-display">
                      {n.label
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </text>
                  </>
                )}
                {n.kind !== "me" && (view.k > 0.55 || isSel || (focus && focus.has(n.id))) && (
                  <text
                    textAnchor="middle"
                    y={n.r + 14}
                    fontSize={n.kind === "person" ? 11 : 10}
                    fontWeight={n.kind === "person" ? 600 : 500}
                    fill={n.kind === "event" ? "#4f3bbd" : "#1d1a16"}
                    stroke="#fbf7f1"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {n.kind === "person" ? n.label.split(" ")[0] : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <button className="p-2 hover:bg-stone-50" onClick={() => zoom(1.25)} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button className="border-y border-line p-2 hover:bg-stone-50" onClick={() => zoom(0.8)} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <button className="p-2 hover:bg-stone-50" onClick={fit} aria-label="Fit to screen">
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}

function SidePanel({ id, node, data, onClose, onSelect }: { id: string; node?: GNode; data: FrenData; onClose: () => void; onSelect: (id: string) => void }) {
  let body: React.ReactNode = null;
  const person = data.people.find((p) => p.id === id);

  if (person) {
    const event = data.events.find((e) => e.id === person.eventId);
    const conns = person.connections.map((c) => data.people.find((p) => p.id === c)).filter((x) => !!x);
    body = (
      <>
        <div className="flex items-center gap-3">
          <Avatar person={person} size={52} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{person.name}</p>
            <p className="truncate text-xs text-muted">{[person.role, person.company].filter(Boolean).join(" · ") || person.location}</p>
          </div>
        </div>
        {person.howWeMet && <p className="mt-3 text-sm">“{person.howWeMet}”</p>}
        <p className="mt-2 text-xs text-muted">
          {event ? `Met at ${event.name} · ` : ""}
          {relativeDay(person.metOn)}
        </p>
        {person.accounts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {person.accounts.slice(0, 4).map((a, i) => (
              <AccountChip key={i} account={a} />
            ))}
          </div>
        )}
        <p className="label mt-4">Mutuals ({conns.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {conns.length === 0 && <span className="text-xs text-muted">Only connected through you</span>}
          {conns.map((c) => (
            <button key={c!.id} onClick={() => onSelect(c!.id)} className="chip bg-stone-100 pl-1 text-stone-700 hover:bg-stone-200">
              <Avatar person={c!} size={18} /> {c!.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <Link href={`/app/people/${person.id}`} className="btn-primary mt-4 w-full">
          Open profile <ArrowRight size={14} />
        </Link>
      </>
    );
  } else if (node?.kind === "event") {
    const ev = data.events.find((e) => e.id === node.ref)!;
    const members = data.people.filter((p) => p.eventId === ev.id);
    body = (
      <>
        <p className="font-display text-lg font-semibold">{ev.name}</p>
        <p className="text-xs text-muted">
          {new Date(ev.date).toLocaleDateString()} {ev.location && `· ${ev.location}`}
        </p>
        <p className="label mt-4">You met {members.length} here</p>
        <div className="space-y-1">
          {members.map((m) => (
            <button key={m.id} onClick={() => onSelect(m.id)} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left text-sm hover:bg-stone-50">
              <Avatar person={m} size={26} /> {m.name}
            </button>
          ))}
        </div>
      </>
    );
  } else if (node?.kind === "platform") {
    const pl = node.id.slice(3) as Platform;
    const members = data.people.filter((p) => p.accounts.some((a) => a.platform === pl));
    body = (
      <>
        <p className="flex items-center gap-2 font-display text-lg font-semibold">
          <PlatformBadge platform={pl} size={24} /> {node.label}
        </p>
        <p className="label mt-4">{members.length} people you can reach here</p>
        <div className="space-y-1">
          {members.map((m) => (
            <button key={m.id} onClick={() => onSelect(m.id)} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left text-sm hover:bg-stone-50">
              <Avatar person={m} size={26} /> <span className="flex-1 truncate">{m.name}</span>
              <span className="text-xs text-muted">@{m.accounts.find((a) => a.platform === pl)?.handle}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (id === "me") {
    const edges = data.people.reduce((n, p) => n + p.connections.length, 0) / 2;
    body = (
      <>
        <p className="font-display text-lg font-semibold">Your network</p>
        <p className="mt-2 text-sm text-muted">
          {data.people.length} people, {edges} mutual connections, {data.events.length} events. Bigger circles know more of your people.
        </p>
      </>
    );
  }

  return (
    <div className="absolute inset-x-3 bottom-3 max-h-[60%] overflow-y-auto rounded-3xl border border-line bg-white p-4 shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:max-h-[calc(100%-1.5rem)] sm:w-80">
      <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 hover:bg-stone-100" aria-label="Close panel">
        <X size={16} />
      </button>
      {body}
    </div>
  );
}
