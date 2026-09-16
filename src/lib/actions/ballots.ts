"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export async function submitBallot(
  debateId: string,
  adjudicatorId: string,
  redirectPath: string,
  formData: FormData
) {
  const session = await requireRole("ADMIN", "ADJUDICATOR");

  if (
    session.user.role === "ADJUDICATOR" &&
    session.user.id !==
      (await prisma.adjudicator.findUnique({
        where: { id: adjudicatorId },
        select: { userId: true },
      }))?.userId
  ) {
    throw new Error("You can only submit ballots for yourself.");
  }

  const debate = await prisma.debate.findUniqueOrThrow({
    where: { id: debateId },
    include: { teams: { include: { team: { include: { speakers: true } } } } },
  });

  await prisma.$transaction(async (tx) => {
    for (const dt of debate.teams) {
      const points = formData.get(`points-${dt.teamId}`);
      if (points !== null) {
        await tx.debateTeam.update({
          where: { id: dt.id },
          data: { points: Number(points) },
        });
      }
    }

    const ballot = await tx.ballot.create({
      data: { debateId, adjudicatorId },
    });

    const speakerScores: { speakerId: string; score: number }[] = [];
    for (const dt of debate.teams) {
      for (const speaker of dt.team.speakers) {
        const score = formData.get(`score-${speaker.id}`);
        if (score !== null && score !== "") {
          speakerScores.push({ speakerId: speaker.id, score: Number(score) });
        }
      }
    }

    if (speakerScores.length > 0) {
      await tx.speakerScore.createMany({
        data: speakerScores.map((s) => ({ ...s, ballotId: ballot.id })),
      });
    }

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
