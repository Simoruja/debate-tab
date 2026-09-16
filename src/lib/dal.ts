import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    redirect("/login");
  }
  return session;
}

export async function getSession() {
  return auth();
}
