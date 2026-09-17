"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { generatePairings, type PairingTeam } from "@/lib/pairing";

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
  motion: z.string().optional(),
});

export async function createRound(slug: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = RoundSchema.safeParse({
    name: formData.get("name"),
    seq: formData.get("seq"),
    motion: formData.get("motion") || undefined,
  });
  if (!parsed.success) return;

  const tournamentId = await tournamentIdFromSlug(slug);
  await prisma.round.create({
    data: {
      tournamentId,
      name: parsed.data.name,
      seq: parsed.data.seq,
      motion: parsed.data.motion,
    },
  });

  revalidatePath(`/admin/tournaments/${slug}`);
}

export async function createDebate(
  slug: string,
  roundId: string,
  formData: FormData
) {
  await requireRole("ADMIN");

  const venueId = (formData.get("venueId") as string) || undefined;
  const adjudicatorIds = formData.getAll("adjudicatorIds") as string[];
  const govTeamId = formData.get("govTeamId") as string | null;
  const oppTeamId = formData.get("oppTeamId") as string | null;

  if (!govTeamId || !oppTeamId || govTeamId === oppTeamId) return;

  await prisma.debate.create({
    data: {
      roundId,
      venueId,
      adjudicators: { connect: adjudicatorIds.map((id) => ({ id })) },
      teams: {
        create: [
          { teamId: govTeamId, position: "GOVERNMENT" },
          { teamId: oppTeamId, position: "OPPOSITION" },
        ],
      },
    },
  });

  revalidatePath(`/admin/tournaments/${slug}/rounds/${roundId}`);
}

export type AutoPairState = { error?: string; message?: string } | undefined;

export async function autoPairRound(
  slug: string,
  roundId: string,
  _prevState: AutoPairState,
  _formData: FormData
): Promise<AutoPairState> {
  await requireRole("ADMIN");

  const round = await prisma.round.findUniqueOrThrow({
    where: { id: roundId },
    include: {
      tournament: {
        include: {
          teams: true,
          venues: true,
          adjudicators: true,
          rounds: {
            include: {
              debates: {
                include: {
                  teams: { include: { team: { include: { speakers: { include: { scores: true } } } } } },
                },
              },
            },
          },
        },
      },
      debates: { include: { teams: true } },
    },
  });

  const pairedTeamIds = new Set(
    round.debates.flatMap((d) => d.teams.map((t) => t.teamId))
  );
  const unpairedTeams = round.tournament.teams.filter(
    (t) => !pairedTeamIds.has(t.id)
  );

  if (unpairedTeams.length < 2) {
    return { error: "Fewer than two unpaired teams remain — nothing to pair." };
  }

  const allDebateTeams = round.tournament.rounds.flatMap((r) =>
    r.debates.flatMap((d) => d.teams.map((dt) => ({ ...dt, debateId: d.id })))
  );

  const wins = new Map<string, number>();
  const speakerScore = new Map<string, number>();
  const govCount = new Map<string, number>();
  const oppCount = new Map<string, number>();
  const pastOpponents = new Map<string, Set<string>>();

  for (const dt of allDebateTeams) {
    if (dt.won === true) wins.set(dt.teamId, (wins.get(dt.teamId) ?? 0) + 1);
    if (dt.position === "GOVERNMENT")
      govCount.set(dt.teamId, (govCount.get(dt.teamId) ?? 0) + 1);
    else oppCount.set(dt.teamId, (oppCount.get(dt.teamId) ?? 0) + 1);

    const score = dt.team.speakers
      .flatMap((s) => s.scores)
      .reduce((sum, s) => sum + s.score, 0);
    speakerScore.set(dt.teamId, (speakerScore.get(dt.teamId) ?? 0) + score);
  }

  const debateIdToTeamIds = new Map<string, string[]>();
  for (const dt of allDebateTeams) {
    const list = debateIdToTeamIds.get(dt.debateId) ?? [];
    list.push(dt.teamId);
    debateIdToTeamIds.set(dt.debateId, list);
  }
  for (const teamIds of debateIdToTeamIds.values()) {
    for (const teamId of teamIds) {
      const opponents = pastOpponents.get(teamId) ?? new Set<string>();
      for (const otherId of teamIds) {
        if (otherId !== teamId) opponents.add(otherId);
      }
      pastOpponents.set(teamId, opponents);
    }
  }

  const pairingInput: PairingTeam[] = unpairedTeams.map((t) => ({
    teamId: t.id,
    wins: wins.get(t.id) ?? 0,
    speakerScore: speakerScore.get(t.id) ?? 0,
    govCount: govCount.get(t.id) ?? 0,
    oppCount: oppCount.get(t.id) ?? 0,
  }));

  const { pairings, bye } = generatePairings(pairingInput, pastOpponents);

  const venues = round.tournament.venues;
  const adjudicators = round.tournament.adjudicators;

  await prisma.$transaction(
    pairings.map((pair, i) =>
      prisma.debate.create({
        data: {
          roundId,
          venueId: venues.length > 0 ? venues[i % venues.length].id : undefined,
          adjudicators:
            adjudicators.length > 0
              ? { connect: [{ id: adjudicators[i % adjudicators.length].id }] }
              : undefined,
          teams: {
            create: [
              { teamId: pair.govTeamId, position: "GOVERNMENT" },
              { teamId: pair.oppTeamId, position: "OPPOSITION" },
            ],
          },
        },
      })
    )
  );

  revalidatePath(`/admin/tournaments/${slug}/rounds/${roundId}`);

  if (bye) {
    const byeTeam = round.tournament.teams.find((t) => t.id === bye);
    return {
      message: `Paired ${pairings.length} debates. ${byeTeam?.name ?? "One team"} received a bye (odd number of teams) — pair them manually if needed.`,
    };
  }
  return { message: `Paired ${pairings.length} debates.` };
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
