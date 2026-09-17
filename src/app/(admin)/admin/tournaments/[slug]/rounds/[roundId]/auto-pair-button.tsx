"use client";

import { useActionState } from "react";
import { autoPairRound, type AutoPairState } from "@/lib/actions/rounds";
import { Button } from "@/components/ui/button";

export function AutoPairButton({
  slug,
  roundId,
}: {
  slug: string;
  roundId: string;
}) {
  const action = autoPairRound.bind(null, slug, roundId);
  const [state, formAction, pending] = useActionState<AutoPairState, FormData>(
    action,
    undefined
  );

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Pairing..." : "Auto-pair remaining teams"}
        </Button>
      </form>
      {state?.message && (
        <p className="text-xs text-muted-foreground">{state.message}</p>
      )}
      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
