"use client";

import { useActionState, useMemo, useState } from "react";
import { submitBallot, type BallotFormState } from "@/lib/actions/ballots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        onClick={onSelectWinner}
        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors ${
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
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
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
              <Input
                name={`score-${speaker.id}`}
                type="number"
                step="1"
                min="0"
                max="50"
                value={scores[speaker.id] ?? 25}
                onChange={(e) =>
                  onScoreChange(speaker.id, Number(e.target.value))
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rank</Label>
              <select
                name={`rank-${speaker.id}`}
                value={ranks[speaker.id] ?? ""}
                onChange={(e) => onRankChange(speaker.id, e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
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

  if (!gov || !opp) {
    return (
      <p className="text-sm text-muted-foreground">
        This debate needs both a Government and Opposition team assigned.
      </p>
    );
  }

  const govTotal = gov.team.speakers.reduce(
    (sum, s) => sum + (scores[s.id] ?? 0),
    0
  );
  const oppTotal = opp.team.speakers.reduce(
    (sum, s) => sum + (scores[s.id] ?? 0),
    0
  );
  const lowPointWin =
    winner === "GOVERNMENT"
      ? govTotal < oppTotal
      : winner === "OPPOSITION"
        ? oppTotal < govTotal
        : false;

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

          <Button type="submit" disabled={pending || !winner}>
            {pending ? "Submitting..." : "Submit ballot"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
