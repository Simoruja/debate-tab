import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Tournament Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin user: ${admin.email} / admin1234`);

  await prisma.tournament.upsert({
    where: { slug: "sample-invitational-2026" },
    update: { format: "American Parliamentary (APDA)" },
    create: {
      name: "Sample Invitational 2026",
      slug: "sample-invitational-2026",
      format: "American Parliamentary (APDA)",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-12"),
      isActive: true,
      venues: {
        create: [{ name: "Room A" }, { name: "Room B" }],
      },
      adjudicators: {
        create: [{ name: "Judge Alvarez" }, { name: "Judge Brooks" }],
      },
      teams: {
        create: [
          {
            name: "Alpha",
            institution: "Riverside University",
            speakers: { create: [{ name: "Amara Chen" }, { name: "Ben Ortiz" }] },
          },
          {
            name: "Bravo",
            institution: "Lakeside College",
            speakers: { create: [{ name: "Cara Diaz" }, { name: "Devon Lee" }] },
          },
          {
            name: "Charlie",
            institution: "Hillcrest Institute",
            speakers: { create: [{ name: "Eli Nakamura" }, { name: "Farah Idris" }] },
          },
          {
            name: "Delta",
            institution: "Northgate Academy",
            speakers: { create: [{ name: "Grace Kim" }, { name: "Hiro Tanaka" }] },
          },
        ],
      },
    },
  });

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "sample-invitational-2026" },
    include: {
      teams: { include: { speakers: true } },
      venues: true,
      adjudicators: true,
      rounds: true,
    },
  });
  console.log(`Tournament: ${tournament.name} (${tournament.slug})`);

  if (tournament.rounds.length === 0) {
    const alpha = tournament.teams.find((t) => t.name === "Alpha")!;
    const bravo = tournament.teams.find((t) => t.name === "Bravo")!;
    const charlie = tournament.teams.find((t) => t.name === "Charlie")!;
    const delta = tournament.teams.find((t) => t.name === "Delta")!;
    const [judgeAlvarez, judgeBrooks] = tournament.adjudicators;
    const [roomA, roomB] = tournament.venues;

    const round1 = await prisma.round.create({
      data: {
        tournamentId: tournament.id,
        seq: 1,
        name: "Round 1",
        motion:
          "This House Would ban the use of legacy admissions in university applications.",
      },
    });

    // Debate 1: Alpha (Gov) defeats Bravo (Opp), confirmed — populates standings.
    const debate1 = await prisma.debate.create({
      data: {
        roundId: round1.id,
        venueId: roomA.id,
        status: "CONFIRMED",
        adjudicators: { connect: [{ id: judgeAlvarez.id }] },
        teams: {
          create: [
            { teamId: alpha.id, position: "GOVERNMENT", won: true },
            { teamId: bravo.id, position: "OPPOSITION", won: false },
          ],
        },
      },
    });
    const ballot1 = await prisma.ballot.create({
      data: { debateId: debate1.id, adjudicatorId: judgeAlvarez.id },
    });
    await prisma.speakerScore.createMany({
      data: [
        { ballotId: ballot1.id, speakerId: alpha.speakers[0].id, role: "PM", score: 27, rank: 1 },
        { ballotId: ballot1.id, speakerId: alpha.speakers[1].id, role: "MG", score: 26, rank: 2 },
        { ballotId: ballot1.id, speakerId: bravo.speakers[0].id, role: "LO", score: 25, rank: 3 },
        { ballotId: ballot1.id, speakerId: bravo.speakers[1].id, role: "MO", score: 24, rank: 4 },
      ],
    });

    // Debate 2: Delta (Opp) defeats Charlie (Gov), still awaiting confirmation.
    const debate2 = await prisma.debate.create({
      data: {
        roundId: round1.id,
        venueId: roomB.id,
        status: "RESULT_ENTERED",
        adjudicators: { connect: [{ id: judgeBrooks.id }] },
        teams: {
          create: [
            { teamId: charlie.id, position: "GOVERNMENT", won: false },
            { teamId: delta.id, position: "OPPOSITION", won: true },
          ],
        },
      },
    });
    const ballot2 = await prisma.ballot.create({
      data: { debateId: debate2.id, adjudicatorId: judgeBrooks.id },
    });
    await prisma.speakerScore.createMany({
      data: [
        { ballotId: ballot2.id, speakerId: charlie.speakers[0].id, role: "PM", score: 25, rank: 3 },
        { ballotId: ballot2.id, speakerId: charlie.speakers[1].id, role: "MG", score: 24, rank: 4 },
        { ballotId: ballot2.id, speakerId: delta.speakers[0].id, role: "LO", score: 27, rank: 1 },
        { ballotId: ballot2.id, speakerId: delta.speakers[1].id, role: "MO", score: 26, rank: 2 },
      ],
    });

    console.log("Seeded Round 1 with two debates (one confirmed, one pending confirmation).");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
