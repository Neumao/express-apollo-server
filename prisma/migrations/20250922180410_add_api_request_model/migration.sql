-- CreateTable
CREATE TABLE "dev"."ApiRequest" (
    "id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userId" UUID,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "isCached" BOOLEAN NOT NULL DEFAULT false,
    "isError" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiRequest_timestamp_idx" ON "dev"."ApiRequest"("timestamp");

-- CreateIndex
CREATE INDEX "ApiRequest_endpoint_idx" ON "dev"."ApiRequest"("endpoint");

-- AddForeignKey
ALTER TABLE "dev"."ApiRequest" ADD CONSTRAINT "ApiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dev"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
