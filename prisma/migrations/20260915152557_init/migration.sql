-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ADJUDICATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('SCHEDULED', 'RESULT_ENTERED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjudicator" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "Adjudicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "motion" TEXT,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "venueId" TEXT,
    "status" "DebateStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateTeam" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "points" INTEGER,

    CONSTRAINT "DebateTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "adjudicatorId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakerScore" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SpeakerScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdjudicatorToDebate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AdjudicatorToDebate_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Team_tournamentId_idx" ON "Team"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Speaker_userId_key" ON "Speaker"("userId");

-- CreateIndex
CREATE INDEX "Speaker_teamId_idx" ON "Speaker"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Adjudicator_userId_key" ON "Adjudicator"("userId");

-- CreateIndex
CREATE INDEX "Adjudicator_tournamentId_idx" ON "Adjudicator"("tournamentId");

-- CreateIndex
CREATE INDEX "Venue_tournamentId_idx" ON "Venue"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_seq_key" ON "Round"("tournamentId", "seq");

-- CreateIndex
CREATE INDEX "Debate_roundId_idx" ON "Debate"("roundId");

-- CreateIndex
CREATE INDEX "DebateTeam_teamId_idx" ON "DebateTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateTeam_debateId_teamId_key" ON "DebateTeam"("debateId", "teamId");

-- CreateIndex
CREATE INDEX "Ballot_debateId_idx" ON "Ballot"("debateId");

-- CreateIndex
CREATE INDEX "SpeakerScore_ballotId_idx" ON "SpeakerScore"("ballotId");

-- CreateIndex
CREATE INDEX "SpeakerScore_speakerId_idx" ON "SpeakerScore"("speakerId");

-- CreateIndex
CREATE INDEX "_AdjudicatorToDebate_B_index" ON "_AdjudicatorToDebate"("B");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjudicator" ADD CONSTRAINT "Adjudicator_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjudicator" ADD CONSTRAINT "Adjudicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTeam" ADD CONSTRAINT "DebateTeam_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTeam" ADD CONSTRAINT "DebateTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_adjudicatorId_fkey" FOREIGN KEY ("adjudicatorId") REFERENCES "Adjudicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScore" ADD CONSTRAINT "SpeakerScore_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScore" ADD CONSTRAINT "SpeakerScore_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdjudicatorToDebate" ADD CONSTRAINT "_AdjudicatorToDebate_A_fkey" FOREIGN KEY ("A") REFERENCES "Adjudicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdjudicatorToDebate" ADD CONSTRAINT "_AdjudicatorToDebate_B_fkey" FOREIGN KEY ("B") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
