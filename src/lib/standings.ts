import { prisma } from "@/lib/prisma";

export type TeamStanding = {
  teamId: string;
  teamName: string;
  wins: number;
  debatesCounted: number;
  totalSpeakerScore: number;
};

export type SpeakerStanding = {
  speakerId: string;
  speakerName: string;
  teamName: string;
  totalScore: number;
  averageScore: number;
  averageRank: number | null;
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
      const wins = team.debateTeams.filter((dt) => dt.won === true).length;
      const totalSpeakerScore = team.debateTeams
        .flatMap((dt) => dt.team.speakers)
        .flatMap((s) => s.scores)
        .reduce((sum, score) => sum + score.score, 0);

      return {
        teamId: team.id,
        teamName: team.name,
        wins,
        debatesCounted: team.debateTeams.length,
        totalSpeakerScore,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.totalSpeakerScore - a.totalSpeakerScore);
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
      const averageRank =
        debatesCounted > 0
          ? speaker.scores.reduce((sum, s) => sum + s.rank, 0) / debatesCounted
          : null;
      return {
        speakerId: speaker.id,
        speakerName: speaker.name,
        teamName: speaker.team.name,
        totalScore,
        averageScore: debatesCounted > 0 ? totalScore / debatesCounted : 0,
        averageRank,
        debatesCounted,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}
