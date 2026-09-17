import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { BallotForm } from "@/components/ballot-form";
import { Badge } from "@/components/ui/badge";

export default async function AdjudicateBallotPage(
  props: PageProps<"/adjudicate/[debateId]">
) {
  const session = await requireRole("ADJUDICATOR", "ADMIN");
  const { debateId } = await props.params;

  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      round: true,
      adjudicators: true,
      teams: { include: { team: { include: { speakers: true } } } },
      ballots: { include: { speakerScores: true } },
    },
  });

  if (!debate) notFound();

  const adjudicator = await prisma.adjudicator.findUnique({
    where: { userId: session.user.id },
  });

  const isAssigned =
    session.user.role === "ADMIN" ||
    debate.adjudicators.some((a) => a.id === adjudicator?.id);

  if (!isAssigned || !adjudicator) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/adjudicate"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Your debates
      </Link>
      <span className="eyebrow mt-4 block">{debate.round.name}</span>
      <div className="mt-1 mb-2 flex items-center gap-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {debate.teams
            .slice()
            .sort((a) => (a.position === "GOVERNMENT" ? -1 : 1))
            .map((t) => t.team.name)
            .join(" vs. ")}
        </h1>
        <Badge>{debate.status}</Badge>
      </div>
      {debate.round.motion && (
        <p className="mb-6 text-sm italic text-muted-foreground">
          {debate.round.motion}
        </p>
      )}

      <BallotForm
        debate={debate}
        adjudicatorId={adjudicator.id}
        redirectPath="/adjudicate"
      />
    </div>
  );
}
