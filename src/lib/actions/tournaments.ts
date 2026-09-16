"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const TournamentSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  format: z.string().min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createTournament(
  _prevState: string | undefined,
  formData: FormData
) {
  await requireRole("ADMIN");

  const parsed = TournamentSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    format: formData.get("format"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input.";
  }

  const { name, slug, format, startDate, endDate } = parsed.data;

  const existing = await prisma.tournament.findUnique({ where: { slug } });
  if (existing) {
    return "A tournament with that slug already exists.";
  }

  await prisma.tournament.create({
    data: {
      name,
      slug,
      format,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/tournaments/${slug}`);
}

export async function toggleTournamentActive(tournamentId: string) {
  await requireRole("ADMIN");
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
  });
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { isActive: !tournament.isActive },
  });
  revalidatePath("/");
  revalidatePath("/admin");
}
