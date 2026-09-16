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

  const tournament = await prisma.tournament.upsert({
    where: { slug: "sample-invitational-2026" },
    update: {},
    create: {
      name: "Sample Invitational 2026",
      slug: "sample-invitational-2026",
      format: "British Parliamentary",
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
  console.log(`Tournament: ${tournament.name} (${tournament.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
