"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { SpeakerRole, TeamPosition } from "@/generated/prisma/enums";

const ROLES: SpeakerRole[] = ["PM", "MG", "LO", "MO"];

export type BallotFormState = { error?: string } | undefined;

export async function submitBallot(
  debateId: string,
  adjudicatorId: string,
  redirectPath: string,
  _prevState: BallotFormState,
  formData: FormData
): Promise<BallotFormState> {
  const session = await requireRole("ADMIN", "ADJUDICATOR");

  if (session.user.role === "ADJUDICATOR") {
    const adj = await prisma.adjudicator.findUnique({
      where: { id: adjudicatorId },
      select: { userId: true },
    });
    if (adj?.userId !== session.user.id) {
      return { error: "You can only submit ballots for yourself." };
    }
  }

  const winner = formData.get("winner") as TeamPosition | null;
  if (winner !== "GOVERNMENT" && winner !== "OPPOSITION") {
    return { error: "Select which side won the debate." };
  }

  const debate = await prisma.debate.findUniqueOrThrow({
    where: { id: debateId },
    include: { teams: { include: { team: { include: { speakers: true } } } } },
  });

  const govTeam = debate.teams.find((t) => t.position === "GOVERNMENT");
  const oppTeam = debate.teams.find((t) => t.position === "OPPOSITION");
  if (!govTeam || !oppTeam) {
    return { error: "This debate is missing a Government or Opposition team." };
  }

  const entries: {
    teamId: string;
    speakerId: string;
    role: SpeakerRole;
    score: number;
    rank: number;
  }[] = [];

  const usedRanks = new Set<number>();
  for (const dt of [govTeam, oppTeam]) {
    for (const speaker of dt.team.speakers) {
      const roleValue = formData.get(`role-${speaker.id}`) as SpeakerRole | null;
      const scoreRaw = formData.get(`score-${speaker.id}`);
      const rankRaw = formData.get(`rank-${speaker.id}`);
      if (!roleValue || scoreRaw === null || rankRaw === null) continue;

      const score = Number(scoreRaw);
      const rank = Number(rankRaw);
      if (!Number.isInteger(score)) {
        return { error: "Speaker points must be whole numbers." };
      }
      if (!ROLES.includes(roleValue) || !Number.isInteger(rank) || rank < 1 || rank > 4) {
        return { error: "Invalid role or rank submitted." };
      }
      if (usedRanks.has(rank)) {
        return {
          error: `Rank ${rank} was assigned to more than one speaker — each rank (1–4) must be used exactly once.`,
        };
      }
      usedRanks.add(rank);
      entries.push({ teamId: dt.teamId, speakerId: speaker.id, role: roleValue, score, rank });
    }
  }

  if (entries.length !== 4 || usedRanks.size !== 4) {
    return { error: "All four speakers need a role, points, and a unique rank (1–4)." };
  }

  const govPoints = entries
    .filter((e) => e.teamId === govTeam.teamId)
    .reduce((sum, e) => sum + e.score, 0);
  const oppPoints = entries
    .filter((e) => e.teamId === oppTeam.teamId)
    .reduce((sum, e) => sum + e.score, 0);

  const winningPoints = winner === "GOVERNMENT" ? govPoints : oppPoints;
  const losingPoints = winner === "GOVERNMENT" ? oppPoints : govPoints;
  if (winningPoints < losingPoints) {
    return {
      error: `Low-point win: the winning side's total speaks (${winningPoints}) must be at least the losing side's (${losingPoints}). APDA does not allow low-point wins.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.debateTeam.update({
      where: { id: govTeam.id },
      data: { won: winner === "GOVERNMENT" },
    });
    await tx.debateTeam.update({
      where: { id: oppTeam.id },
      data: { won: winner === "OPPOSITION" },
    });

    // Replace any previously submitted ballot for this debate rather than
    // stacking duplicates, which would double-count in standings.
    await tx.ballot.deleteMany({ where: { debateId } });

    const ballot = await tx.ballot.create({
      data: { debateId, adjudicatorId },
    });

    await tx.speakerScore.createMany({
      data: entries.map((e) => ({
        ballotId: ballot.id,
        speakerId: e.speakerId,
        role: e.role,
        score: e.score,
        rank: e.rank,
      })),
    });

    await tx.debate.update({
      where: { id: debateId },
      data: { status: "RESULT_ENTERED" },
    });
  });

  revalidatePath(redirectPath);
}

export async function confirmDebate(debateId: string, redirectPath: string) {
  await requireRole("ADMIN");
  await prisma.debate.update({
    where: { id: debateId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath(redirectPath);
}
