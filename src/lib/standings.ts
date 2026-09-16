import { prisma } from "@/lib/prisma";

export type TeamStanding = {
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalSpeakerScore: number;
  debatesCounted: number;
};

export type SpeakerStanding = {
  speakerId: string;
  speakerName: string;
  teamName: string;
  totalScore: number;
  averageScore: number;
  debatesCounted: number;
};

export async function getTeamStandings(
  tournamentId: string
): Promise<TeamStanding[]> {
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    include: {
      debateTeams: {
        where: { debate: { status: "CONFIRMED" } },
        include: {
          team: {
            include: {
              speakers: {
                include: {
                  scores: {
                    where: { ballot: { debate: { status: "CONFIRMED" } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return teams
    .map((team) => {
      const totalPoints = team.debateTeams.reduce(
        (sum, dt) => sum + (dt.points ?? 0),
        0
      );
      const totalSpeakerScore = team.debateTeams
        .flatMap((dt) => dt.team.speakers)
        .flatMap((s) => s.scores)
        .reduce((sum, score) => sum + score.score, 0);

      return {
        teamId: team.id,
        teamName: team.name,
        totalPoints,
        totalSpeakerScore,
        debatesCounted: team.debateTeams.length,
      };
    })
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.totalSpeakerScore - a.totalSpeakerScore
    );
}

export async function getSpeakerStandings(
  tournamentId: string
): Promise<SpeakerStanding[]> {
  const speakers = await prisma.speaker.findMany({
    where: { team: { tournamentId } },
    include: {
      team: true,
      scores: {
        where: { ballot: { debate: { status: "CONFIRMED" } } },
      },
    },
  });

  return speakers
    .map((speaker) => {
      const totalScore = speaker.scores.reduce((sum, s) => sum + s.score, 0);
      const debatesCounted = speaker.scores.length;
      return {
        speakerId: speaker.id,
        speakerName: speaker.name,
        teamName: speaker.team.name,
        totalScore,
        averageScore: debatesCounted > 0 ? totalScore / debatesCounted : 0,
        debatesCounted,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}
