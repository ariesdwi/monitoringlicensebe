-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teamId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tlName" TEXT NOT NULL,
    "maxQuota" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "TeamAiToolQuota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "aiTool" TEXT NOT NULL,
    "maxQuota" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TeamAiToolQuota_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "departemen" TEXT NOT NULL,
    "aplikasi" TEXT NOT NULL,
    CONSTRAINT "TeamApp_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL DEFAULT 'Gemini',
    "userType" TEXT NOT NULL DEFAULT 'Internal',
    "departemen" TEXT NOT NULL,
    "aplikasi" TEXT NOT NULL,
    "squad" TEXT NOT NULL,
    "tlName" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userName" TEXT NOT NULL,
    "email" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'Internal',
    "tlName" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "departemen" TEXT NOT NULL,
    "aplikasi" TEXT NOT NULL,
    "squad" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL DEFAULT 'Gemini',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Request_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "History" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "icon" TEXT NOT NULL,
    "cls" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AiImpact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "tlName" TEXT NOT NULL,
    "squad" TEXT NOT NULL,
    "aplikasi" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL DEFAULT 'Gemini',
    "period" TEXT NOT NULL,
    "manCount" INTEGER NOT NULL,
    "daysWithAI" REAL NOT NULL,
    "daysWithoutAI" REAL NOT NULL,
    "sqBugs" INTEGER NOT NULL DEFAULT 0,
    "sqVulnerabilities" INTEGER NOT NULL DEFAULT 0,
    "sqCodeSmells" INTEGER NOT NULL DEFAULT 0,
    "sqCoverage" REAL NOT NULL DEFAULT 0,
    "sqDuplications" REAL NOT NULL DEFAULT 0,
    "sqRating" TEXT NOT NULL DEFAULT 'A',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiImpact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiTool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "totalQuota" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GitHubOrganization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationName" TEXT NOT NULL,
    "personalAccessToken" TEXT NOT NULL,
    "enterpriseSlug" TEXT,
    "teamId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GitHubOrganization_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CopilotSeatUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "totalSeatsPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalSeatsConsumed" INTEGER NOT NULL DEFAULT 0,
    "activeSeats" INTEGER NOT NULL DEFAULT 0,
    "pendingSeats" INTEGER NOT NULL DEFAULT 0,
    "unusedSeats" INTEGER NOT NULL DEFAULT 0,
    "usagePercentage" REAL NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CopilotSeatUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "GitHubOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CopilotSeatDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "name" TEXT,
    "lastActivityAt" DATETIME,
    "licenseType" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CopilotSeatDetail_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "GitHubOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GitHubMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "hasCopilotLicense" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GitHubMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "GitHubOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GitHubAuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    CONSTRAINT "GitHubAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "GitHubOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAiToolQuota_teamId_aiTool_key" ON "TeamAiToolQuota"("teamId", "aiTool");

-- CreateIndex
CREATE UNIQUE INDEX "TeamApp_teamId_departemen_aplikasi_key" ON "TeamApp"("teamId", "departemen", "aplikasi");

-- CreateIndex
CREATE UNIQUE INDEX "AiTool_name_key" ON "AiTool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubOrganization_organizationName_key" ON "GitHubOrganization"("organizationName");

-- CreateIndex
CREATE UNIQUE INDEX "CopilotSeatUsage_organizationId_month_key" ON "CopilotSeatUsage"("organizationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CopilotSeatDetail_organizationId_githubLogin_key" ON "CopilotSeatDetail"("organizationId", "githubLogin");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubMember_githubId_key" ON "GitHubMember"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubMember_organizationId_githubLogin_key" ON "GitHubMember"("organizationId", "githubLogin");
