import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTeamStandings, getSpeakerStandings } from "@/lib/standings";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function PublicStandingsPage(
  props: PageProps<"/tournaments/[slug]/standings">
) {
  const { slug } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      rounds: {
        orderBy: { seq: "asc" },
        include: { _count: { select: { debates: true } } },
      },
    },
  });
  if (!tournament) notFound();

  const [teamStandings, speakerStandings] = await Promise.all([
    getTeamStandings(tournament.id),
    getSpeakerStandings(tournament.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; All tournaments
      </Link>
      <span className="eyebrow mt-4 block">{tournament.format}</span>
      <div className="mt-2 mb-8 flex items-center gap-3">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {tournament.name}
        </h1>
        <Badge variant={tournament.isActive ? "default" : "secondary"}>
          {tournament.isActive ? "Active" : "Concluded"}
        </Badge>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Team standings</TabsTrigger>
          <TabsTrigger value="speakers">Speaker standings</TabsTrigger>
          <TabsTrigger value="draws">Draws</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          {teamStandings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No confirmed results yet.
            </p>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Debates</TableHead>
                  <TableHead className="text-right">Speaker score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStandings.map((row, i) => (
                  <TableRow key={row.teamId}>
                    <TableCell className="font-serif font-medium lining-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell>{row.teamName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.wins}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.debatesCounted}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalSpeakerScore}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="speakers">
          {speakerStandings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No confirmed results yet.
            </p>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Speaker</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Avg. rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {speakerStandings.map((row, i) => (
                  <TableRow key={row.speakerId}>
                    <TableCell className="font-serif font-medium lining-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell>{row.speakerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.teamName}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalScore}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.averageScore.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.averageRank !== null ? row.averageRank.toFixed(1) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="draws">
          {tournament.rounds.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No rounds have been created yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {tournament.rounds.map((round) => (
                <li
                  key={round.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{round.name}</p>
                    {round.motion && (
                      <p className="truncate text-sm text-muted-foreground">
                        {round.motion}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/tournaments/${slug}/rounds/${round.id}/draw`}
                    className="shrink-0 text-sm font-medium text-gold hover:underline"
                  >
                    {round._count.debates > 0 ? "View draw" : "Not paired yet"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
