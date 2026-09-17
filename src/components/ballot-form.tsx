"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitBallot, type BallotFormState } from "@/lib/actions/ballots";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { haptic } from "@/lib/haptics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type Position = "GOVERNMENT" | "OPPOSITION";

type DebateTeamForBallot = {
  id: string;
  teamId: string;
  position: Position;
  won: boolean | null;
  team: {
    id: string;
    name: string;
    speakers: { id: string; name: string }[];
  };
};

type DebateForBallot = {
  id: string;
  teams: DebateTeamForBallot[];
  ballots?: {
    speakerScores: { speakerId: string; role: string; score: number; rank: number }[];
  }[];
};

const ROLE_OPTIONS: Record<Position, { value: string }[]> = {
  GOVERNMENT: [{ value: "PM" }, { value: "MG" }],
  OPPOSITION: [{ value: "LO" }, { value: "MO" }],
};

function ScoreStepper({
  speakerId,
  value,
  onChange,
}: {
  speakerId: string;
  value: number;
  onChange: (value: number) => void;
}) {
  function step(delta: number) {
    const next = Math.min(50, Math.max(0, value + delta));
    if (next !== value) haptic.tap();
    onChange(next);
  }

  return (
    <div className="flex h-11 items-stretch overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        aria-label="Decrease points"
        onClick={() => step(-1)}
        className="w-9 shrink-0 touch-manipulation text-lg font-medium text-muted-foreground transition-colors active:bg-muted active:text-foreground"
      >
        &minus;
      </button>
      <input
        name={`score-${speakerId}`}
        type="number"
        inputMode="numeric"
        step="1"
        min="0"
        max="50"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(50, Math.max(0, n)) : 0);
        }}
        className="w-full min-w-0 flex-1 border-x bg-transparent text-center text-base font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase points"
        onClick={() => step(1)}
        className="w-9 shrink-0 touch-manipulation text-lg font-medium text-muted-foreground transition-colors active:bg-muted active:text-foreground"
      >
        +
      </button>
    </div>
  );
}

function TeamColumn({
  dt,
  position,
  isWinner,
  onSelectWinner,
  total,
  scores,
  onScoreChange,
  ranks,
  onRankChange,
  usedRanks,
  roleDefaults,
}: {
  dt: DebateTeamForBallot;
  position: Position;
  isWinner: boolean;
  onSelectWinner: () => void;
  total: number;
  scores: Record<string, number>;
  onScoreChange: (speakerId: string, value: number) => void;
  ranks: Record<string, string>;
  onRankChange: (speakerId: string, value: string) => void;
  usedRanks: Set<string>;
  roleDefaults: Record<string, string>;
}) {
  const accent =
    position === "GOVERNMENT" ? "border-l-green-accent" : "border-l-gold";

  return (
    <div
      className={`space-y-4 rounded-md border border-l-4 p-4 transition-colors ${accent} ${
        isWinner ? "bg-accent/40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => {
          haptic.select();
          onSelectWinner();
        }}
        className={`flex min-h-11 w-full touch-manipulation items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
          isWinner
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:bg-muted"
        }`}
      >
        <span>
          {position === "GOVERNMENT" ? "Government" : "Opposition"} &mdash;{" "}
          {dt.team.name}
        </span>
        {isWinner && <span aria-hidden>&#10003; Winner</span>}
      </button>

      {dt.team.speakers.map((speaker, idx) => (
        <div
          key={speaker.id}
          className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0"
        >
          <p className="text-sm font-medium">{speaker.name}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <select
                name={`role-${speaker.id}`}
                defaultValue={
                  roleDefaults[speaker.id] ?? ROLE_OPTIONS[position][idx % 2].value
                }
                className="h-11 w-full touch-manipulation rounded-md border bg-background px-2 text-sm"
              >
                {ROLE_OPTIONS[position].map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Points</Label>
              <ScoreStepper
                speakerId={speaker.id}
                value={scores[speaker.id] ?? 25}
                onChange={(value) => onScoreChange(speaker.id, value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rank</Label>
              <select
                name={`rank-${speaker.id}`}
                value={ranks[speaker.id] ?? ""}
                onChange={(e) => {
                  haptic.tap();
                  onRankChange(speaker.id, e.target.value);
                }}
                className="h-11 w-full touch-manipulation rounded-md border bg-background px-2 text-sm"
              >
                <option value="" disabled>
                  &mdash;
                </option>
                {[1, 2, 3, 4].map((n) => (
                  <option
                    key={n}
                    value={n}
                    disabled={
                      usedRanks.has(String(n)) &&
                      ranks[speaker.id] !== String(n)
                    }
                  >
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <p className="text-right text-xs text-muted-foreground">
        Total: <span className="font-medium text-foreground">{total}</span>
      </p>
    </div>
  );
}

export function BallotForm({
  debate,
  adjudicatorId,
  redirectPath,
}: {
  debate: DebateForBallot;
  adjudicatorId: string;
  redirectPath: string;
}) {
  const gov = debate.teams.find((t) => t.position === "GOVERNMENT");
  const opp = debate.teams.find((t) => t.position === "OPPOSITION");

  const action = submitBallot.bind(null, debate.id, adjudicatorId, redirectPath);
  const [state, formAction, pending] = useActionState<BallotFormState, FormData>(
    action,
    undefined
  );

  const existingScores = useMemo(
    () => debate.ballots?.[0]?.speakerScores ?? [],
    [debate.ballots]
  );

  const [winner, setWinner] = useState<Position | null>(
    gov?.won ? "GOVERNMENT" : opp?.won ? "OPPOSITION" : null
  );
  const [ranks, setRanks] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const s of existingScores) initial[s.speakerId] = String(s.rank);
    return initial;
  });
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const dt of debate.teams) {
      for (const speaker of dt.team.speakers) initial[speaker.id] = 25;
    }
    for (const s of existingScores) initial[s.speakerId] = s.score;
    return initial;
  });
  const roleDefaults = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of existingScores) map[s.speakerId] = s.role;
    return map;
  }, [existingScores]);

  const usedRanks = useMemo(() => new Set(Object.values(ranks)), [ranks]);

  const govTotal = (gov?.team.speakers ?? []).reduce(
    (sum, s) => sum + (scores[s.id] ?? 0),
    0
  );
  const oppTotal = (opp?.team.speakers ?? []).reduce(
    (sum, s) => sum + (scores[s.id] ?? 0),
    0
  );
  const lowPointWin =
    winner === "GOVERNMENT"
      ? govTotal < oppTotal
      : winner === "OPPOSITION"
        ? oppTotal < govTotal
        : false;

  useEffect(() => {
    if (lowPointWin) haptic.warning();
  }, [lowPointWin]);

  useEffect(() => {
    if (state?.error) haptic.error();
  }, [state?.error]);

  if (!gov || !opp) {
    return (
      <p className="text-sm text-muted-foreground">
        This debate needs both a Government and Opposition team assigned.
      </p>
    );
  }

  function handleScoreChange(speakerId: string, value: number) {
    setScores((prev) => ({ ...prev, [speakerId]: value }));
  }

  function handleRankChange(speakerId: string, value: string) {
    setRanks((prev) => ({ ...prev, [speakerId]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter ballot</CardTitle>
        <CardDescription>
          Pick the winning side, assign each speaker&rsquo;s role, points
          (whole numbers, ~25 is average), and a unique rank 1&ndash;4.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="winner" value={winner ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TeamColumn
              dt={gov}
              position="GOVERNMENT"
              isWinner={winner === "GOVERNMENT"}
              onSelectWinner={() => setWinner("GOVERNMENT")}
              total={govTotal}
              scores={scores}
              onScoreChange={handleScoreChange}
              ranks={ranks}
              onRankChange={handleRankChange}
              usedRanks={usedRanks}
              roleDefaults={roleDefaults}
            />
            <TeamColumn
              dt={opp}
              position="OPPOSITION"
              isWinner={winner === "OPPOSITION"}
              onSelectWinner={() => setWinner("OPPOSITION")}
              total={oppTotal}
              scores={scores}
              onScoreChange={handleScoreChange}
              ranks={ranks}
              onRankChange={handleRankChange}
              usedRanks={usedRanks}
              roleDefaults={roleDefaults}
            />
          </div>

          {lowPointWin && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Low-point win: the winning side&rsquo;s total speaks must be at
              least the losing side&rsquo;s. APDA does not allow low-point
              wins &mdash; adjust the points before submitting.
            </p>
          )}
          {state?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="safe-bottom sticky bottom-0 -mx-4 -mb-4 border-t bg-card/95 px-4 py-3 backdrop-blur sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <Button
              type="submit"
              size="lg"
              disabled={pending || !winner}
              className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm"
            >
              {pending ? "Submitting..." : "Submit ballot"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
