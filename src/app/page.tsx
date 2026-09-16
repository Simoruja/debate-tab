import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString(
    "en-US",
    { ...opts, year: "numeric" }
  )}`;
}

export default async function Home() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Tournaments</h1>
        <p className="mt-1 text-muted-foreground">
          Browse active and past debate tournaments.
        </p>
      </header>

      {tournaments.length === 0 ? (
        <p className="text-muted-foreground">
          No tournaments have been created yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.slug}/standings`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{t.name}</CardTitle>
                    <Badge variant={t.isActive ? "default" : "secondary"}>
                      {t.isActive ? "Active" : "Concluded"}
                    </Badge>
                  </div>
                  <CardDescription>{t.format}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDateRange(t.startDate, t.endDate)}</span>
                  <span>{t._count.teams} teams</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
