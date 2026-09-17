"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [error, action, pending] = useActionState(authenticate, undefined);

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-navy px-4 py-16 text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(55% 45% at 20% 15%, rgba(196,144,48,0.25), transparent), radial-gradient(45% 40% at 85% 85%, rgba(61,112,96,0.25), transparent)",
        }}
      />
      <div className="relative w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <Link
          href="/"
          className="eyebrow mb-6 block text-gold hover:text-gold/80"
        >
          Tabroom
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-cream">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-cream/60">
          Access the tournament admin and adjudication tools.
        </p>

        <form action={action} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-cream/80">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="border-cream/20 bg-white/5 text-cream placeholder:text-cream/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-cream/80">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="border-cream/20 bg-white/5 text-cream placeholder:text-cream/30"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-gold text-navy hover:bg-gold/90"
            disabled={pending}
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
