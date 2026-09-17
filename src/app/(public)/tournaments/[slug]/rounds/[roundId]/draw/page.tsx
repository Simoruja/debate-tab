import { notFound } from "next/navigation";
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

export default async function PublicDrawPage(
  props: PageProps<"/tournaments/[slug]/rounds/[roundId]/draw">
) {
  const { slug, roundId } = await props.params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      tournament: true,
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

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Link
        href={`/tournaments/${slug}/standings`}
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; {round.tournament.name}
      </Link>
      <span className="eyebrow mt-4 block">{round.tournament.format}</span>
      <h1 className="mt-2 mb-2 font-serif text-4xl font-semibold tracking-tight">
        {round.name}
      </h1>
      {round.motion && (
        <p className="mb-8 text-muted-foreground italic">{round.motion}</p>
      )}

      {round.debates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This round hasn&rsquo;t been paired yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {round.debates.map((debate) => {
            const gov = debate.teams.find((t) => t.position === "GOVERNMENT");
            const opp = debate.teams.find((t) => t.position === "OPPOSITION");
            const decided = debate.status === "CONFIRMED";
            return (
              <Card key={debate.id} className="border-l-4 border-l-navy">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    <span
                      className={
                        decided && gov?.won ? "text-green-accent" : ""
                      }
                    >
                      {gov?.team.name ?? "TBD"}
                    </span>
                    <span className="mx-1.5 font-sans text-xs font-normal text-muted-foreground">
                      vs
                    </span>
                    <span className={decided && opp?.won ? "text-gold" : ""}>
                      {opp?.team.name ?? "TBD"}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {debate.venue?.name ?? "Venue TBD"} &middot;{" "}
                    {debate.adjudicators.map((a) => a.name).join(", ") ||
                      "Adjudicator TBD"}
                  </CardDescription>
                </CardHeader>
                {decided && (
                  <CardContent>
                    <Badge>
                      Winner: {gov?.won ? gov.team.name : opp?.team.name}
                    </Badge>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
