"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

async function tournamentIdFromSlug(slug: string) {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug },
    select: { id: true },
  });
  return tournament.id;
}

const RoundSchema = z.object({
  name: z.string().min(1),
  seq: z.coerce.number().int().min(1),
});

export async function createRound(slug: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = RoundSchema.safeParse({
    name: formData.get("name"),
    seq: formData.get("seq"),
  });
  if (!parsed.success) return;

  const tournamentId = await tournamentIdFromSlug(slug);
  await prisma.round.create({
    data: { tournamentId, name: parsed.data.name, seq: parsed.data.seq },
  });

  revalidatePath(`/admin/tournaments/${slug}`);
}

const TEAM_SLOTS = 4;

export async function createDebate(
  slug: string,
  roundId: string,
  formData: FormData
) {
  await requireRole("ADMIN");

  const venueId = (formData.get("venueId") as string) || undefined;
  const adjudicatorIds = formData.getAll("adjudicatorIds") as string[];

  const teamEntries: { teamId: string; position: string }[] = [];
  for (let i = 0; i < TEAM_SLOTS; i++) {
    const teamId = formData.get(`team-${i}`) as string | null;
    const position = (formData.get(`position-${i}`) as string | null) ?? "";
    if (teamId) teamEntries.push({ teamId, position: position || `Team ${i + 1}` });
  }

  if (teamEntries.length < 2) return;

  await prisma.debate.create({
    data: {
      roundId,
      venueId,
      adjudicators: { connect: adjudicatorIds.map((id) => ({ id })) },
      teams: { create: teamEntries },
    },
  });

  revalidatePath(`/admin/tournaments/${slug}/rounds/${roundId}`);
}

export async function deleteDebate(
  slug: string,
  roundId: string,
  debateId: string
) {
  await requireRole("ADMIN");
  await prisma.debate.delete({ where: { id: debateId } });
  revalidatePath(`/admin/tournaments/${slug}/rounds/${roundId}`);
}
