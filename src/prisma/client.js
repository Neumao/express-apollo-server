
import { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import { logger } from '../config/index.js';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Use existing prisma instance if available to prevent multiple instances in development
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query",
        },
        {
            emit: "event",
            level: "error",
        },
        {
            emit: "event",
            level: "info",
        },
        {
            emit: "event",
            level: "warn",
        },
    ],
    errorFormat: "pretty",
});

// Set up event listeners for logging
prisma.$on("query", (e) => {
    logger.debug(
        `Prisma Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`
    );
});

prisma.$on("info", (e) => logger.info(`Prisma: ${e.message}`));
prisma.$on("warn", (e) => logger.warn(`Prisma: ${e.message}`));
prisma.$on("error", (e) => logger.error(`Prisma: ${e.message}`));

// Attach to global object in development
if (process.env.NODE_ENV === 'development') {
    globalForPrisma.prisma = prisma;
}

export default prisma;

