import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { logout } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Upcoming",
  RESULT_ENTERED: "Awaiting confirmation",
  CONFIRMED: "Final",
};

export default async function ParticipantDashboard() {
  const session = await requireRole("PARTICIPANT", "ADMIN");

  const speaker = await prisma.speaker.findUnique({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          tournament: true,
          speakers: true,
          debateTeams: {
            include: {
              debate: {
                include: {
                  round: true,
                  venue: true,
                  teams: { include: { team: true } },
                },
              },
            },
            orderBy: { debate: { round: { seq: "asc" } } },
          },
        },
      },
      scores: {
        where: { ballot: { debate: { status: "CONFIRMED" } } },
      },
    },
  });

  if (!speaker) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="text-sm text-muted-foreground">
          No participant profile is linked to your account yet. Ask your
          tournament admin to invite you from the roster page.
        </p>
      </div>
    );
  }

  const { team } = speaker;
  const totalScore = speaker.scores.reduce((sum, s) => sum + s.score, 0);
  const avgScore =
    speaker.scores.length > 0 ? totalScore / speaker.scores.length : null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="eyebrow">{team.tournament.name}</span>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">
            {team.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {team.speakers.map((s) => s.name).join(" & ")}
          </p>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      {avgScore !== null && (
        <Card className="mb-6 border-l-4 border-l-gold">
          <CardContent className="flex items-center gap-8 py-4">
            <div>
              <p className="font-serif text-2xl font-semibold lining-nums">
                {totalScore}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total points ({speaker.name})
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold lining-nums">
                {avgScore.toFixed(1)}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Average
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 font-serif text-xl font-semibold">Your rounds</h2>
      {team.debateTeams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&rsquo;t been paired into a round yet.
        </p>
      ) : (
        <div className="space-y-3">
          {team.debateTeams.map((dt) => {
            const opponent = dt.debate.teams.find((t) => t.teamId !== team.id);
            return (
              <Card key={dt.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {dt.position === "GOVERNMENT" ? "Gov" : "Opp"} vs{" "}
                      {opponent?.team.name ?? "TBD"}
                    </CardTitle>
                    <CardDescription>
                      {dt.debate.round.name} &middot;{" "}
                      {dt.debate.venue?.name ?? "Venue TBD"}
                    </CardDescription>
                  </div>
                  <Badge variant={dt.debate.status === "CONFIRMED" ? "default" : "secondary"}>
                    {STATUS_LABEL[dt.debate.status]}
                  </Badge>
                </CardHeader>
                {dt.debate.round.motion && (
                  <CardContent>
                    <p className="text-sm italic text-muted-foreground">
                      {dt.debate.round.motion}
                    </p>
                    {dt.debate.status === "CONFIRMED" && (
                      <p className="mt-2 text-sm font-medium">
                        {dt.won ? "You won this debate." : "You lost this debate."}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Link
        href={`/tournaments/${team.tournament.slug}/standings`}
        className="mt-8 inline-block text-sm text-gold hover:underline"
      >
        View full tournament standings &rarr;
      </Link>
    </div>
  );
}
