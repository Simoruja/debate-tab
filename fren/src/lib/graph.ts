import type { FrenData, Platform } from "./types";
import { CIRCLES, hueFor, PLATFORMS } from "./utils";

export type NodeKind = "me" | "person" | "event" | "platform";

export interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  r: number;
  color: string;
  ref?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
}

export interface GLink {
  source: string;
  target: string;
  kind: "me" | "knows" | "event" | "account";
  color?: string;
}

export interface GraphOptions {
  events: boolean;
  accounts: boolean;
  circles: Set<string>;
}

/** Deterministic pseudo-random in [0,1) so the layout is stable between renders. */
function rand(seed: string, salt: number) {
  const h = (hueFor(seed) * 9301 + salt * 49297) % 233280;
  return h / 233280;
}

export function buildGraph(data: FrenData, opt: GraphOptions) {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const people = data.people.filter((p) => opt.circles.has(p.circle));
  const ids = new Set(people.map((p) => p.id));

  nodes.push({ id: "me", kind: "me", label: data.me.name || "You", r: 26, color: "#1d1a16", x: 0, y: 0, vx: 0, vy: 0, fixed: true });

  const ring: Record<string, number> = { inner: 120, friends: 200, work: 260, acquaintance: 320 };
  for (const p of people) {
    const a = rand(p.id, 1) * Math.PI * 2;
    const dist = ring[p.circle] ?? 260;
    const degree = p.connections.filter((c) => ids.has(c)).length;
    nodes.push({
      id: p.id,
      kind: "person",
      label: p.name,
      ref: p.id,
      r: 13 + Math.min(degree, 6) * 1.6,
      color: CIRCLES[p.circle].dot,
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist,
      vx: 0,
      vy: 0,
    });
    links.push({ source: "me", target: p.id, kind: "me" });
    for (const c of p.connections) if (ids.has(c) && p.id < c) links.push({ source: p.id, target: c, kind: "knows" });
  }

  if (opt.events) {
    for (const e of data.events) {
      const members = people.filter((p) => p.eventId === e.id);
      if (!members.length) continue;
      const a = rand(e.id, 2) * Math.PI * 2;
      nodes.push({ id: `ev:${e.id}`, kind: "event", label: e.name, ref: e.id, r: 11, color: "#7c66f0", x: Math.cos(a) * 380, y: Math.sin(a) * 380, vx: 0, vy: 0 });
      for (const m of members) links.push({ source: `ev:${e.id}`, target: m.id, kind: "event" });
    }
  }

  if (opt.accounts) {
    const platforms = new Set<Platform>();
    for (const p of people) for (const a of p.accounts) if (a.platform !== "phone" && a.platform !== "email") platforms.add(a.platform);
    [...platforms].forEach((pl, i) => {
      const a = (i / platforms.size) * Math.PI * 2;
      nodes.push({ id: `pl:${pl}`, kind: "platform", label: PLATFORMS[pl].label, r: 15, color: PLATFORMS[pl].color, x: Math.cos(a) * 480, y: Math.sin(a) * 480, vx: 0, vy: 0 });
    });
    for (const p of people)
      for (const a of p.accounts)
        if (platforms.has(a.platform)) links.push({ source: p.id, target: `pl:${a.platform}`, kind: "account", color: PLATFORMS[a.platform].color });
  }

  simulate(nodes, links);
  return { nodes, links };
}

const REST: Record<GLink["kind"], number> = { me: 230, knows: 90, event: 70, account: 170 };
const STRENGTH: Record<GLink["kind"], number> = { me: 0.012, knows: 0.06, event: 0.05, account: 0.015 };

/** Small force-directed layout: pairwise repulsion + springs + gentle centering. */
export function simulate(nodes: GNode[], links: GLink[], iterations = 320) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (let it = 0; it < iterations; it++) {
    const alpha = 1 - it / iterations;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = rand(a.id + b.id, it) - 0.5;
          dy = rand(b.id + a.id, it) - 0.5;
          d2 = 1;
        }
        const minD = a.r + b.r + 26;
        const f = (2600 / d2 + (d2 < minD * minD ? 0.4 : 0)) * alpha;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }
    for (const l of links) {
      const s = byId.get(l.source)!;
      const t = byId.get(l.target)!;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - REST[l.kind]) * STRENGTH[l.kind] * alpha;
      s.vx += (dx / d) * f;
      s.vy += (dy / d) * f;
      t.vx -= (dx / d) * f;
      t.vy -= (dy / d) * f;
    }
    for (const n of nodes) {
      if (n.fixed) {
        n.vx = n.vy = 0;
        continue;
      }
      n.vx -= n.x * 0.002 * alpha;
      n.vy -= n.y * 0.002 * alpha;
      n.vx *= 0.6;
      n.vy *= 0.6;
      n.x += n.vx;
      n.y += n.vy;
    }
  }
}

/** Shortest chain of "knows" edges between two people, excluding you as a hop. */
export function shortestPath(data: FrenData, from: string, to: string): string[] | null {
  if (from === to) return [from];
  const adj = new Map(data.people.map((p) => [p.id, p.connections]));
  const prev = new Map<string, string>([[from, ""]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of adj.get(cur) ?? []) {
      if (prev.has(n)) continue;
      prev.set(n, cur);
      if (n === to) {
        const path = [to];
        let c = cur;
        while (c) {
          path.unshift(c);
          c = prev.get(c)!;
        }
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}
