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

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
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
      <div className="mt-2 mb-8 flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
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
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Speaker score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStandings.map((row, i) => (
                  <TableRow key={row.teamId}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{row.teamName}</TableCell>
                    <TableCell className="text-right">
                      {row.totalPoints}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalSpeakerScore.toFixed(1)}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {speakerStandings.map((row, i) => (
                  <TableRow key={row.speakerId}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{row.speakerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.teamName}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalScore.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.averageScore.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
