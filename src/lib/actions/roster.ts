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

const TeamSchema = z.object({
  name: z.string().min(1),
  institution: z.string().optional(),
  speakerNames: z.string().min(1),
});

export async function createTeam(slug: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    speakerNames: formData.get("speakerNames"),
  });
  if (!parsed.success) return;

  const tournamentId = await tournamentIdFromSlug(slug);
  const speakerNames = parsed.data.speakerNames
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.team.create({
    data: {
      tournamentId,
      name: parsed.data.name,
      institution: parsed.data.institution,
      speakers: { create: speakerNames.map((name) => ({ name })) },
    },
  });

  revalidatePath(`/admin/tournaments/${slug}`);
}

export async function deleteTeam(slug: string, teamId: string) {
  await requireRole("ADMIN");
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath(`/admin/tournaments/${slug}`);
}

const AdjudicatorSchema = z.object({ name: z.string().min(1) });

export async function createAdjudicator(slug: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = AdjudicatorSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const tournamentId = await tournamentIdFromSlug(slug);
  await prisma.adjudicator.create({
    data: { tournamentId, name: parsed.data.name },
  });
  revalidatePath(`/admin/tournaments/${slug}`);
}

export async function deleteAdjudicator(slug: string, adjudicatorId: string) {
  await requireRole("ADMIN");
  await prisma.adjudicator.delete({ where: { id: adjudicatorId } });
  revalidatePath(`/admin/tournaments/${slug}`);
}

const VenueSchema = z.object({ name: z.string().min(1) });

export async function createVenue(slug: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = VenueSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const tournamentId = await tournamentIdFromSlug(slug);
  await prisma.venue.create({
    data: { tournamentId, name: parsed.data.name },
  });
  revalidatePath(`/admin/tournaments/${slug}`);
}

export async function deleteVenue(slug: string, venueId: string) {
  await requireRole("ADMIN");
  await prisma.venue.delete({ where: { id: venueId } });
  revalidatePath(`/admin/tournaments/${slug}`);
}
