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

export default async function AdjudicateHome() {
  const session = await requireRole("ADJUDICATOR", "ADMIN");

  const adjudicator = await prisma.adjudicator.findUnique({
    where: { userId: session.user.id },
  });

  const debates = adjudicator
    ? await prisma.debate.findMany({
        where: { adjudicators: { some: { id: adjudicator.id } } },
        include: {
          round: { include: { tournament: true } },
          teams: { include: { team: true } },
        },
        orderBy: { round: { seq: "asc" } },
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your assigned debates
        </h1>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      {debates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no assigned debates yet.
        </p>
      ) : (
        <div className="space-y-3">
          {debates.map((debate) => (
            <Card key={debate.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {debate.teams.map((t) => t.team.name).join(" vs. ")}
                  </CardTitle>
                  <CardDescription>
                    {debate.round.tournament.name} &middot; {debate.round.name}
                  </CardDescription>
                </div>
                <Badge>{debate.status}</Badge>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link href={`/adjudicate/${debate.id}`}>
                    {debate.status === "SCHEDULED" ? "Enter result" : "View result"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
