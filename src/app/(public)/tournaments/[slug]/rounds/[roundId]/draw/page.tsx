import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FlipCard } from "@/components/flip-card";
import { TiltCard } from "@/components/tilt-card";

export default async function PublicDrawPage(
  props: PageProps<"/tournaments/[slug]/rounds/[roundId]/draw">,
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
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
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
          {round.debates.map((debate, i) => {
            const gov = debate.teams.find((t) => t.position === "GOVERNMENT");
            const opp = debate.teams.find((t) => t.position === "OPPOSITION");
            const decided = debate.status === "CONFIRMED";
            const winner = gov?.won ? gov : opp?.won ? opp : null;
            const govName = gov?.team.name ?? "TBD";
            const oppName = opp?.team.name ?? "TBD";
            const adjudicators =
              debate.adjudicators.map((a) => a.name).join(", ") ||
              "Adjudicator TBD";
            const face =
              "flex h-full min-h-44 flex-col rounded-xl border p-5 shadow-sm";

            return (
              <TiltCard
                key={debate.id}
                max={6}
                className="h-full animate-in fade-in-0 slide-in-from-bottom-3 rounded-xl"
                style={{
                  animationDelay: `${i * 70}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <FlipCard
                  className="h-full"
                  label={`${govName} vs ${oppName}`}
                  front={
                    <div className={`${face} bg-card`}>
                      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        {debate.venue?.name ?? "Venue TBD"}
                      </p>
                      <div className="mt-3 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="rounded-lg border-t-4 border-t-gold bg-gold/5 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-gold">
                            Gov
                          </p>
                          <p
                            className={`font-serif text-lg font-semibold leading-tight ${
                              decided && gov?.won ? "text-gold" : ""
                            }`}
                          >
                            {govName}
                          </p>
                        </div>
                        <span className="font-serif text-sm italic text-muted-foreground">
                          vs
                        </span>
                        <div className="rounded-lg border-t-4 border-t-green-accent bg-green-accent/5 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-green-accent">
                            Opp
                          </p>
                          <p
                            className={`font-serif text-lg font-semibold leading-tight ${
                              decided && opp?.won ? "text-green-accent" : ""
                            }`}
                          >
                            {oppName}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Tap to flip
                        {decided ? " for the result" : " for details"}
                      </p>
                    </div>
                  }
                  back={
                    <div
                      className={`${face} items-center justify-center gap-2 bg-navy text-center text-cream`}
                    >
                      {decided && winner ? (
                        <>
                          <Trophy className="size-7 text-gold" />
                          <p className="text-[11px] uppercase tracking-widest text-cream/60">
                            {winner.position === "GOVERNMENT"
                              ? "Government"
                              : "Opposition"}{" "}
                            wins
                          </p>
                          <p className="font-serif text-2xl font-semibold text-gold">
                            {winner.team.name}
                          </p>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary">
                            {debate.status === "RESULT_ENTERED"
                              ? "Awaiting confirmation"
                              : "Result pending"}
                          </Badge>
                          <p className="font-serif text-xl">
                            {debate.venue?.name ?? "Venue TBD"}
                          </p>
                        </>
                      )}
                      <p className="text-xs text-cream/60">
                        Adjudicated by {adjudicators}
                      </p>
                    </div>
                  }
                />
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
