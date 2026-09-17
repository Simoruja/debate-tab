"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  ADJUDICATOR: "/adjudicate",
  PARTICIPANT: "/participant",
};

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
) {
  const email = formData.get("email");
  try {
    const user =
      typeof email === "string"
        ? await prisma.user.findUnique({ where: { email }, select: { role: true } })
        : null;

    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: user ? ROLE_HOME[user.role] : "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
