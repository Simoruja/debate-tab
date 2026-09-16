import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { confirmDebate } from "@/lib/actions/ballots";
import { BallotForm } from "@/components/ballot-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DebateResultPage(
  props: PageProps<"/admin/tournaments/[slug]/rounds/[roundId]/debates/[debateId]">
) {
  await requireRole("ADMIN");
  const { slug, roundId, debateId } = await props.params;

  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      round: { include: { tournament: true } },
      adjudicators: true,
      teams: { include: { team: { include: { speakers: true } } } },
      ballots: { include: { speakerScores: true } },
    },
  });

  if (!debate || debate.round.tournament.slug !== slug) notFound();

  const redirectPath = `/admin/tournaments/${slug}/rounds/${roundId}`;
  const primaryAdjudicatorId = debate.adjudicators[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={redirectPath}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to {debate.round.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {debate.teams.map((t) => t.team.name).join(" vs. ")}
          </h1>
          <Badge>{debate.status}</Badge>
        </div>
      </div>

      {!primaryAdjudicatorId ? (
        <p className="text-sm text-muted-foreground">
          Assign an adjudicator to this debate before entering a result.
        </p>
      ) : (
        <BallotForm
          debate={debate}
          adjudicatorId={primaryAdjudicatorId}
          redirectPath={redirectPath}
        />
      )}

      {debate.status === "RESULT_ENTERED" && (
        <form action={confirmDebate.bind(null, debate.id, redirectPath)}>
          <Button type="submit" variant="outline">
            Confirm result (count toward standings)
          </Button>
        </form>
      )}
    </div>
  );
}
