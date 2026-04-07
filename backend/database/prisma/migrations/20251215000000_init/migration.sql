-- CreateEnum
CREATE TYPE "TenderCategory" AS ENUM (
  'CONSTRUCTION',
  'IT_SERVICES',
  'MEDICAL',
  'ELECTRICAL',
  'STATIONERY',
  'TRANSPORTATION',
  'PLUMBING',
  'CONSULTING',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "SourcePortal" AS ENUM (
  'CPPP',
  'GEM',
  'MAHATENDERS',
  'TNTENDERS',
  'RAJASTHAN_EPROC',
  'IREPS',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM (
  'OPEN',
  'CLOSING_SOON',
  'CLOSED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM (
  'EMAIL',
  'SMS',
  'WHATSAPP'
);

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM (
  'INSTANT',
  'DAILY_DIGEST',
  'WEEKLY_DIGEST'
);

-- CreateEnum
CREATE TYPE "BookmarkStage" AS ENUM (
  'DISCOVERED',
  'EVALUATING',
  'PREPARING',
  'SUBMITTED',
  'AWARDED'
);

-- CreateEnum
CREATE TYPE "ScraperStatus" AS ENUM (
  'SUCCESS',
  'FAILED',
  'PARTIAL'
);

-- ─────────────────────────────────────────────
-- CreateTable: Tender
-- ─────────────────────────────────────────────
CREATE TABLE "Tender" (
  "id"                 TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "title"              TEXT            NOT NULL,
  "referenceNumber"    TEXT            NOT NULL,
  "description"        TEXT            NOT NULL,
  "issuingAuthority"   TEXT            NOT NULL,
  "department"         TEXT            NOT NULL,
  "category"           "TenderCategory" NOT NULL,
  "state"              TEXT            NOT NULL,
  "district"           TEXT            NOT NULL,
  "city"               TEXT            NOT NULL,
  "estimatedValue"     DECIMAL(18, 2)  NOT NULL,
  "emdAmount"          DECIMAL(18, 2)  NOT NULL,
  "publishedDate"      TIMESTAMP(3)    NOT NULL,
  "submissionDeadline" TIMESTAMP(3)    NOT NULL,
  "prebidMeetingDate"  TIMESTAMP(3),
  "tenderDocUrl"       TEXT            NOT NULL,
  "sourceUrl"          TEXT            NOT NULL,
  "sourcePortal"       "SourcePortal"  NOT NULL,
  "status"             "TenderStatus"  NOT NULL,
  "rawHtml"            TEXT,
  "pdfStorageUrl"      TEXT,
  "scrapedAt"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- CreateTable: User
-- ─────────────────────────────────────────────
CREATE TABLE "User" (
  "id"                  TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"                TEXT              NOT NULL,
  "email"               TEXT              NOT NULL,
  "phone"               TEXT              NOT NULL,
  "password"            TEXT              NOT NULL,
  "companyName"         TEXT              NOT NULL,
  "udyamNumber"         TEXT,
  "gstNumber"           TEXT,
  "turnover"            DECIMAL(18, 2),
  "state"               TEXT              NOT NULL,
  "district"            TEXT              NOT NULL,
  "preferredCategories" "TenderCategory"[],
  "preferredStates"     TEXT[],
  "isVerified"          BOOLEAN           NOT NULL DEFAULT FALSE,
  "createdAt"           TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- CreateTable: Alert
-- ─────────────────────────────────────────────
CREATE TABLE "Alert" (
  "id"         TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"     TEXT              NOT NULL,
  "name"       TEXT              NOT NULL,
  "categories" "TenderCategory"[],
  "states"     TEXT[],
  "minValue"   DECIMAL(18, 2),
  "maxValue"   DECIMAL(18, 2),
  "keywords"   TEXT[],
  "isActive"   BOOLEAN           NOT NULL DEFAULT TRUE,
  "channel"    "AlertChannel"    NOT NULL,
  "frequency"  "AlertFrequency"  NOT NULL,
  "createdAt"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- CreateTable: Bookmark
-- ─────────────────────────────────────────────
CREATE TABLE "Bookmark" (
  "id"        TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT            NOT NULL,
  "tenderId"  TEXT            NOT NULL,
  "stage"     "BookmarkStage" NOT NULL,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- CreateTable: ScraperLog
-- ─────────────────────────────────────────────
CREATE TABLE "ScraperLog" (
  "id"             TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "sourcePortal"   "SourcePortal"  NOT NULL,
  "status"         "ScraperStatus" NOT NULL,
  "tendersFound"   INTEGER         NOT NULL DEFAULT 0,
  "tendersNew"     INTEGER         NOT NULL DEFAULT 0,
  "tendersUpdated" INTEGER         NOT NULL DEFAULT 0,
  "errorMessage"   TEXT,
  "startedAt"      TIMESTAMP(3)    NOT NULL,
  "completedAt"    TIMESTAMP(3)    NOT NULL,
  "duration"       INTEGER         NOT NULL,

  CONSTRAINT "ScraperLog_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- Unique constraints
-- ─────────────────────────────────────────────
CREATE UNIQUE INDEX "User_email_key"    ON "User"     ("email");
CREATE UNIQUE INDEX "User_phone_key"    ON "User"     ("phone");
CREATE UNIQUE INDEX "Bookmark_userId_tenderId_key" ON "Bookmark" ("userId", "tenderId");

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX "Tender_submissionDeadline_idx" ON "Tender" ("submissionDeadline");
CREATE INDEX "Tender_category_idx"           ON "Tender" ("category");
CREATE INDEX "Tender_state_idx"              ON "Tender" ("state");
CREATE INDEX "Tender_sourcePortal_idx"       ON "Tender" ("sourcePortal");
CREATE INDEX "Tender_status_idx"             ON "Tender" ("status");
CREATE INDEX "Tender_publishedDate_idx"      ON "Tender" ("publishedDate");
CREATE INDEX "Tender_category_state_status_idx" ON "Tender" ("category", "state", "status");

CREATE INDEX "Alert_userId_idx"         ON "Alert"      ("userId");
CREATE INDEX "Bookmark_userId_idx"      ON "Bookmark"   ("userId");
CREATE INDEX "Bookmark_tenderId_idx"    ON "Bookmark"   ("tenderId");
CREATE INDEX "ScraperLog_sourcePortal_idx" ON "ScraperLog" ("sourcePortal");
CREATE INDEX "ScraperLog_startedAt_idx"    ON "ScraperLog" ("startedAt");

-- ─────────────────────────────────────────────
-- Foreign keys
-- ─────────────────────────────────────────────
ALTER TABLE "Alert"
  ADD CONSTRAINT "Alert_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookmark"
  ADD CONSTRAINT "Bookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookmark"
  ADD CONSTRAINT "Bookmark_tenderId_fkey"
  FOREIGN KEY ("tenderId") REFERENCES "Tender" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
