import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewTournamentDialog } from "./new-tournament-dialog";

const ACCENTS = ["border-l-gold", "border-l-green-accent", "border-l-navy"];

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardContent className="py-4">
        <p className="font-serif text-3xl font-semibold tracking-tight lining-nums">
          {value}
        </p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const [tournaments, activeCount, teamCount, pendingCount] =
    await Promise.all([
      prisma.tournament.findMany({
        orderBy: { startDate: "desc" },
        include: { _count: { select: { teams: true, rounds: true } } },
      }),
      prisma.tournament.count({ where: { isActive: true } }),
      prisma.team.count(),
      prisma.debate.count({ where: { status: { not: "CONFIRMED" } } }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">
            Tournaments
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your tournaments, rosters, and rounds.
          </p>
        </div>
        <NewTournamentDialog />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Active tournaments"
          value={activeCount}
          accent={ACCENTS[0]}
        />
        <StatCard
          label="Total tournaments"
          value={tournaments.length}
          accent={ACCENTS[1]}
        />
        <StatCard
          label="Teams registered"
          value={teamCount}
          accent={ACCENTS[2]}
        />
        <StatCard
          label="Debates pending"
          value={pendingCount}
          accent={ACCENTS[0]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All tournaments</CardTitle>
          <CardDescription>{tournaments.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tournaments yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Rounds</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        href={`/admin/tournaments/${t.slug}`}
                        className="font-medium hover:underline"
                      >
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell>{t.format}</TableCell>
                    <TableCell>{t._count.teams}</TableCell>
                    <TableCell>{t._count.rounds}</TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? "default" : "secondary"}>
                        {t.isActive ? "Active" : "Concluded"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
