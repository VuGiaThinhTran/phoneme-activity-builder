-- CreateTable
CREATE TABLE "generation_events" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_view_metrics" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_view_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_events_activityType_idx" ON "generation_events"("activityType");

-- CreateIndex
CREATE INDEX "generation_events_success_idx" ON "generation_events"("success");

-- CreateIndex
CREATE INDEX "page_view_metrics_page_idx" ON "page_view_metrics"("page");
