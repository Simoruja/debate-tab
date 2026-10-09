// Runs before `next build`. Applies pending Prisma migrations so a freshly
// connected database gets its tables on the next deploy, and optionally loads
// the sample tournament when SEED_SAMPLE_DATA=true (meant for Preview only:
// the seed creates admin@example.com with a well-known password).
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!process.env.DATABASE_URL) {
  console.log("prepare-db: DATABASE_URL is not set; skipping migrations.");
  process.exit(0);
}

run("npx prisma migrate deploy --config prisma7.config.ts");

if (process.env.SEED_SAMPLE_DATA === "true") {
  run("npx prisma db seed --config prisma7.config.ts");
}
