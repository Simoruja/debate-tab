"use client";

import { ArrowRight, Brain, Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, Empty, Loading, PageHeader } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import type { FrenData, Person } from "@/lib/types";
import { cn, daysSince, relativeDay } from "@/lib/utils";

const ROUND = 8;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Recent people and people you keep getting wrong come first. */
function buildDeck(data: FrenData, seed: number): Person[] {
  const score = (p: Person) => {
    const r = data.recall[p.id];
    const accuracy = r ? r.correct / r.seen : 0;
    const age = daysSince(p.metOn ?? p.createdAt) ?? 365;
    return accuracy * 2 + Math.min(age, 365) / 120 + ((hash(p.id) + seed) % 100) / 200;
  };
  return data.people
    .filter((p) => p.howWeMet || p.role || p.company || p.eventId)
    .sort((a, b) => score(a) - score(b))
    .slice(0, ROUND);
}

function options(data: FrenData, answer: Person, seed: number) {
  const others = data.people.filter((p) => p.id !== answer.id).sort((a, b) => ((hash(a.id) + seed) % 97) - ((hash(b.id) + seed) % 97));
  const picks = [answer, ...others.slice(0, 3)];
  return picks.sort((a, b) => ((hash(a.name) + seed) % 13) - ((hash(b.name) + seed) % 13));
}

function redact(text: string, name: string) {
  let out = text;
  for (const part of [name, ...name.split(" ")]) {
    if (part.length > 1) out = out.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "___");
  }
  return out;
}

export default function RecallPage() {
  const data = useFren();
  const [seed, setSeed] = useState(1);
  const [deck, setDeck] = useState<Person[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: string; ok: boolean }[]>([]);

  if (!data) return <Loading />;

  const start = () => {
    const s = seed + 1;
    setSeed(s);
    setDeck(buildDeck(data, s));
    setI(0);
    setPicked(null);
    setResults([]);
  };

  if (!deck) {
    const fresh = data.people.filter((p) => (daysSince(p.metOn) ?? 999) <= 30).length;
    return (
      <div>
        <PageHeader title="Recall" subtitle="A quick game so new names actually stick." />
        {data.people.length < 4 ? (
          <Empty icon={<Brain size={30} />} title="Add a few more people first">
            Recall needs at least four people to make a round.
          </Empty>
        ) : (
          <div className="card mx-auto max-w-lg p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-coral-100 text-coral-600">
              <Brain size={30} />
            </div>
            <p className="font-display text-2xl font-semibold">Who was that again?</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              You’ll get {ROUND} memory clues: where you met, what they do, what you talked about. Pick the right name. People you met recently or keep forgetting come up first.
            </p>
            {fresh > 0 && <p className="mt-3 text-sm font-medium text-coral-700">{fresh} people met in the last 30 days are in the pool.</p>}
            <button className="btn-accent mt-6 !px-6 !py-3" onClick={start}>
              Start a round <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (i >= deck.length) {
    const right = results.filter((r) => r.ok).length;
    const missed = results.filter((r) => !r.ok).map((r) => data.people.find((p) => p.id === r.id)!).filter(Boolean);
    return (
      <div>
        <PageHeader title="Recall" />
        <div className="card mx-auto max-w-lg p-8 text-center">
          <p className="font-display text-5xl font-bold">
            {right}/{deck.length}
          </p>
          <p className="mt-2 text-muted">{right === deck.length ? "Perfect. These people are locked in." : right >= deck.length / 2 ? "Nice. A few more rounds and they’ll stick." : "Good start. This is exactly why we practice."}</p>
          {missed.length > 0 && (
            <div className="mt-6 text-left">
              <p className="label">Brush up on</p>
              <div className="space-y-1">
                {missed.map((p) => (
                  <Link key={p.id} href={`/app/people/${p.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-stone-50">
                    <Avatar person={p} size={32} />
                    <span className="text-sm font-semibold">{p.name}</span>
                    <ArrowRight size={14} className="ml-auto text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          <button className="btn-primary mt-6" onClick={start}>
            <RotateCcw size={16} /> Another round
          </button>
        </div>
      </div>
    );
  }

  const card = deck[i];
  const event = data.events.find((e) => e.id === card.eventId);
  const opts = options(data, card, seed + i);
  const clues = [
    event && `Met at ${event.name}, ${relativeDay(card.metOn)}`,
    !event && card.metOn && `First met ${relativeDay(card.metOn)}`,
    (card.role || card.company) && [card.role, card.company && `at ${card.company}`].filter(Boolean).join(" "),
    card.location && `Lives in ${card.location}`,
    card.interests.length > 0 && `Into ${card.interests.slice(0, 3).join(", ")}`,
  ].filter(Boolean) as string[];

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    const ok = id === card.id;
    actions.recordRecall(card.id, ok);
    setResults((r) => [...r, { id: card.id, ok }]);
  };

  return (
    <div>
      <PageHeader title="Recall" subtitle={`Card ${i + 1} of ${deck.length}`} />
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex gap-1">
          {deck.map((_, j) => (
            <span key={j} className={cn("h-1.5 flex-1 rounded-full", j < i ? (results[j]?.ok ? "bg-mint-500" : "bg-coral-400") : j === i ? "bg-ink" : "bg-stone-200")} />
          ))}
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            {picked ? (
              <Avatar person={card} size={56} />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 font-display text-2xl font-bold text-stone-400">?</span>
            )}
            <p className="font-display text-xl font-semibold">{picked ? card.name : "Who is this?"}</p>
          </div>
          {card.howWeMet && <p className="mb-3 text-[15px] leading-relaxed">“{picked ? card.howWeMet : redact(card.howWeMet, card.name)}”</p>}
          <ul className="space-y-1 text-sm text-muted">
            {clues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {opts.map((o) => {
            const state = !picked ? "idle" : o.id === card.id ? "right" : o.id === picked ? "wrong" : "idle";
            return (
              <button
                key={o.id}
                onClick={() => choose(o.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition",
                  state === "right" && "border-mint-500 bg-mint-100 text-mint-700",
                  state === "wrong" && "border-coral-400 bg-coral-50 text-coral-700",
                  state === "idle" && "border-line bg-white hover:border-stone-300",
                  picked && state === "idle" && "opacity-50",
                )}
              >
                {state === "right" ? <Check size={16} /> : state === "wrong" ? <X size={16} /> : null}
                {o.name}
              </button>
            );
          })}
        </div>
        {picked && (
          <button className="btn-primary mt-4 w-full !py-3" onClick={() => (setI(i + 1), setPicked(null))}>
            {i + 1 < deck.length ? "Next" : "See results"} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
