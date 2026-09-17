-- CreateEnum
CREATE TYPE "TeamPosition" AS ENUM ('GOVERNMENT', 'OPPOSITION');

-- CreateEnum
CREATE TYPE "SpeakerRole" AS ENUM ('PM', 'MG', 'LO', 'MO');

-- AlterTable: DebateTeam — replace free-text position/points with an APDA-shaped side + win flag
ALTER TABLE "DebateTeam" ADD COLUMN "won" BOOLEAN;
ALTER TABLE "DebateTeam" DROP COLUMN "points";
ALTER TABLE "DebateTeam" ALTER COLUMN "position" TYPE "TeamPosition" USING ("position"::"TeamPosition");

-- AlterTable: SpeakerScore — whole-number points, a role per speech, and a required rank
ALTER TABLE "SpeakerScore" ADD COLUMN "role" "SpeakerRole" NOT NULL;
ALTER TABLE "SpeakerScore" ADD COLUMN "rank" INTEGER NOT NULL;
ALTER TABLE "SpeakerScore" ALTER COLUMN "score" TYPE INTEGER USING (ROUND("score")::INTEGER);

-- CreateIndex
CREATE UNIQUE INDEX "DebateTeam_debateId_position_key" ON "DebateTeam"("debateId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakerScore_ballotId_rank_key" ON "SpeakerScore"("ballotId", "rank");
