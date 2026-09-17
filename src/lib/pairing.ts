export type PairingTeam = {
  teamId: string;
  wins: number;
  speakerScore: number;
  govCount: number;
  oppCount: number;
};

export type Pairing = {
  govTeamId: string;
  oppTeamId: string;
};

export type PairingResult = {
  pairings: Pairing[];
  bye: string | null;
};

/**
 * Power-pairs teams by record (wins, then speaker score as tiebreak), matching
 * adjacent-ranked teams. Makes one pass to swap away from immediate rematches,
 * then balances sides toward whichever side each team has argued less.
 */
export function generatePairings(
  teams: PairingTeam[],
  pastOpponents: Map<string, Set<string>>
): PairingResult {
  const sorted = [...teams].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.speakerScore - a.speakerScore ||
      a.teamId.localeCompare(b.teamId)
  );

  let bye: string | null = null;
  if (sorted.length % 2 === 1) {
    bye = sorted.pop()!.teamId;
  }

  // One pass of local swaps to avoid immediate rematches where possible.
  for (let i = 0; i < sorted.length - 1; i += 2) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const isRematch = pastOpponents.get(a.teamId)?.has(b.teamId);
    if (isRematch && i + 3 < sorted.length + 1 && sorted[i + 2]) {
      const c = sorted[i + 2];
      const wouldStillRematch = pastOpponents.get(a.teamId)?.has(c.teamId);
      if (!wouldStillRematch) {
        sorted[i + 1] = c;
        sorted[i + 2] = b;
      }
    }
  }

  const pairings: Pairing[] = [];
  for (let i = 0; i < sorted.length - 1; i += 2) {
    const a = sorted[i];
    const b = sorted[i + 1];
    // Whoever has argued Government less often takes it this round.
    const aGovDeficit = a.govCount - a.oppCount;
    const bGovDeficit = b.govCount - b.oppCount;
    const aTakesGov =
      aGovDeficit < bGovDeficit ||
      (aGovDeficit === bGovDeficit && a.teamId.localeCompare(b.teamId) < 0);

    pairings.push({
      govTeamId: aTakesGov ? a.teamId : b.teamId,
      oppTeamId: aTakesGov ? b.teamId : a.teamId,
    });
  }

  return { pairings, bye };
}
