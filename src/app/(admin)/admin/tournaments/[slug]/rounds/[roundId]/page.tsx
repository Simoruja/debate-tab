import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { createDebate, deleteDebate } from "@/lib/actions/rounds";
import { AutoPairButton } from "./auto-pair-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  RESULT_ENTERED: "Result entered",
  CONFIRMED: "Confirmed",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  SCHEDULED: "secondary",
  RESULT_ENTERED: "outline",
  CONFIRMED: "default",
};

export default async function RoundPage(
  props: PageProps<"/admin/tournaments/[slug]/rounds/[roundId]">
) {
  await requireRole("ADMIN");
  const { slug, roundId } = await props.params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      tournament: {
        include: { teams: true, adjudicators: true, venues: true },
      },
      debates: {
        include: {
          venue: true,
          adjudicators: true,
          teams: { include: { team: true } },
        },
      },
    },
  });

  if (!round || round.tournament.slug !== slug) notFound();

  const assignedTeamIds = new Set(
    round.debates.flatMap((d) => d.teams.map((t) => t.teamId))
  );
  const availableTeams = round.tournament.teams.filter(
    (t) => !assignedTeamIds.has(t.id)
  );

  const createDebateAction = createDebate.bind(null, slug, roundId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {round.name}
          </h1>
          <Link
            href={`/admin/tournaments/${slug}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; Back to {round.tournament.name}
          </Link>
        </div>
      </div>

      {round.motion && (
        <div className="rounded-md border-l-4 border-l-gold bg-accent/40 px-4 py-3">
          <span className="eyebrow text-[0.65rem]">Motion</span>
          <p className="mt-1 font-serif text-lg">{round.motion}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Create debate</CardTitle>
            <CardDescription>
              Assign teams, a venue, and adjudicators for this pairing.
            </CardDescription>
          </div>
          <AutoPairButton slug={slug} roundId={roundId} />
        </CardHeader>
        <CardContent>
          <form action={createDebateAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="eyebrow !text-green-accent text-[0.65rem]">
                  Government
                </label>
                <select
                  name="govTeamId"
                  required
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select team
                  </option>
                  {availableTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="eyebrow !text-gold text-[0.65rem]">
                  Opposition
                </label>
                <select
                  name="oppTeamId"
                  required
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select team
                  </option>
                  {availableTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                name="venueId"
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">— No venue —</option>
                {round.tournament.venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-3 text-sm">
                {round.tournament.adjudicators.map((adj) => (
                  <label key={adj.id} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      name="adjudicatorIds"
                      value={adj.id}
                    />
                    {adj.name}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" size="sm">
              Create debate
            </Button>
          </form>
          {availableTeams.length === 0 && round.tournament.teams.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              All teams have been assigned a debate this round.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {round.debates.map((debate) => {
          const gov = debate.teams.find((t) => t.position === "GOVERNMENT");
          const opp = debate.teams.find((t) => t.position === "OPPOSITION");
          return (
          <Card key={debate.id} className="border-l-4 border-l-navy">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-serif">
                  <span
                    className={gov?.won ? "text-green-accent" : ""}
                  >
                    {gov?.team.name ?? "?"}
                  </span>
                  <span className="mx-1.5 font-sans text-xs font-normal text-muted-foreground">
                    vs
                  </span>
                  <span className={opp?.won ? "text-gold" : ""}>
                    {opp?.team.name ?? "?"}
                  </span>
                </CardTitle>
                <CardDescription>
                  {debate.venue?.name ?? "No venue"} &middot;{" "}
                  {debate.adjudicators.map((a) => a.name).join(", ") ||
                    "No adjudicators"}
                </CardDescription>
              </div>
              <Badge variant={STATUS_VARIANT[debate.status]}>
                {STATUS_LABEL[debate.status]}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/tournaments/${slug}/rounds/${roundId}/debates/${debate.id}`}
                >
                  {debate.status === "SCHEDULED" ? "Enter result" : "View result"}
                </Link>
              </Button>
              <form
                action={deleteDebate.bind(null, slug, roundId, debate.id)}
              >
                <Button variant="ghost" size="sm" type="submit">
                  Remove
                </Button>
              </form>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
