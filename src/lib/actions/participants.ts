"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const InviteSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function inviteSpeaker(
  slug: string,
  speakerId: string,
  _prevState: string | undefined,
  formData: FormData
) {
  await requireRole("ADMIN");

  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input.";
  }

  const speaker = await prisma.speaker.findUnique({ where: { id: speakerId } });
  if (!speaker) return "Speaker not found.";
  if (speaker.userId) return "This speaker already has a linked account.";

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return "A user with that email already exists.";

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: speaker.name,
      passwordHash,
      role: "PARTICIPANT",
      speaker: { connect: { id: speakerId } },
    },
  });

  revalidatePath(`/admin/tournaments/${slug}`);
}
