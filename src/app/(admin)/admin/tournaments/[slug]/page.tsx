import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import {
  createTeam,
  deleteTeam,
  createAdjudicator,
  deleteAdjudicator,
  createVenue,
  deleteVenue,
} from "@/lib/actions/roster";
import { createRound } from "@/lib/actions/rounds";
import { InviteSpeakerDialog } from "./invite-speaker-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";

export default async function TournamentDetailPage(
  props: PageProps<"/admin/tournaments/[slug]">
) {
  await requireRole("ADMIN");
  const { slug } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      teams: { include: { speakers: true }, orderBy: { name: "asc" } },
      adjudicators: { orderBy: { name: "asc" } },
      venues: { orderBy: { name: "asc" } },
      rounds: { orderBy: { seq: "asc" } },
    },
  });

  if (!tournament) notFound();

  const createTeamAction = createTeam.bind(null, slug);
  const createAdjudicatorAction = createAdjudicator.bind(null, slug);
  const createVenueAction = createVenue.bind(null, slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          {tournament.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tournament.format} &middot;{" "}
          <Badge variant={tournament.isActive ? "default" : "secondary"}>
            {tournament.isActive ? "Active" : "Concluded"}
          </Badge>
        </p>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>{tournament.teams.length} teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={createTeamAction} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input name="name" placeholder="Team name" required />
                    <Input name="institution" placeholder="Institution" />
                  </div>
                  <Input
                    name="speakerNames"
                    placeholder="Speaker names, comma separated"
                    required
                  />
                  <Button type="submit" size="sm">
                    Add team
                  </Button>
                </form>
                <ul className="divide-y">
                  {tournament.teams.map((team) => (
                    <li
                      key={team.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {team.speakers.map((s) => (
                            <span key={s.id} className="flex items-center gap-1.5">
                              {s.name}
                              {s.userId ? (
                                <span className="text-green-accent">&#10003;</span>
                              ) : (
                                <InviteSpeakerDialog
                                  slug={slug}
                                  speakerId={s.id}
                                  speakerName={s.name}
                                />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      <form action={deleteTeam.bind(null, slug, team.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          Remove
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adjudicators</CardTitle>
                <CardDescription>
                  {tournament.adjudicators.length} adjudicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={createAdjudicatorAction} className="flex gap-2">
                  <Input name="name" placeholder="Adjudicator name" required />
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </form>
                <ul className="divide-y">
                  {tournament.adjudicators.map((adj) => (
                    <li
                      key={adj.id}
                      className="flex items-center justify-between py-2"
                    >
                      <p className="font-medium">{adj.name}</p>
                      <form
                        action={deleteAdjudicator.bind(null, slug, adj.id)}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          Remove
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Venues</CardTitle>
                <CardDescription>{tournament.venues.length} venues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={createVenueAction} className="flex gap-2">
                  <Input name="name" placeholder="Venue name" required />
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </form>
                <ul className="divide-y">
                  {tournament.venues.map((venue) => (
                    <li
                      key={venue.id}
                      className="flex items-center justify-between py-2"
                    >
                      <p className="font-medium">{venue.name}</p>
                      <form action={deleteVenue.bind(null, slug, venue.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          Remove
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <RoundsSection slug={slug} rounds={tournament.rounds} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoundsSection({
  slug,
  rounds,
}: {
  slug: string;
  rounds: { id: string; seq: number; name: string; motion: string | null }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rounds</CardTitle>
        <CardDescription>{rounds.length} rounds created</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NewRoundForm slug={slug} nextSeq={rounds.length + 1} />
        {rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rounds yet. Add teams and adjudicators first, then create a
            round above to start pairing debates.
          </p>
        ) : (
          <ul className="divide-y">
            {rounds.map((round) => (
              <li key={round.id} className="flex items-center justify-between gap-4 py-2">
                <div className="min-w-0">
                  <span className="font-medium">{round.name}</span>
                  {round.motion && (
                    <p className="truncate text-xs text-muted-foreground">
                      {round.motion}
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link
                    href={`/admin/tournaments/${slug}/rounds/${round.id}`}
                  >
                    Manage
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function NewRoundForm({ slug, nextSeq }: { slug: string; nextSeq: number }) {
  const action = createRound.bind(null, slug);
  return (
    <form action={action} className="space-y-2 rounded-md border p-3">
      <input type="hidden" name="seq" value={nextSeq} />
      <div className="flex items-center gap-2">
        <Input
          name="name"
          placeholder={`Round ${nextSeq}`}
          defaultValue={`Round ${nextSeq}`}
          className="w-40"
        />
        <Input
          name="motion"
          placeholder="Motion (e.g. This House Would...)"
          className="flex-1"
        />
        <Button type="submit" size="sm">
          Add round
        </Button>
      </div>
    </form>
  );
}
