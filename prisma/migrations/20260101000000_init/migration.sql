-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WORDLE', 'WORD_SEARCH');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'NORMAL', 'HARD');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'NORMAL',
    "gridRows" INTEGER,
    "gridCols" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "hint" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phoneme_segments" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "ipa" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "phoneme_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "words_activityId_idx" ON "words"("activityId");

-- CreateIndex
CREATE INDEX "phoneme_segments_wordId_idx" ON "phoneme_segments"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "phoneme_segments_wordId_position_key" ON "phoneme_segments"("wordId", "position");

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phoneme_segments" ADD CONSTRAINT "phoneme_segments_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
