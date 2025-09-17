// import { PrismaClient } from "../generated/prisma/client.js";
// import { logger } from "../src/config/index.js";

// let prisma;

// if (!global.prisma) {
//     prisma = new PrismaClient({
//         log: [
//             {
//                 emit: "event",
//                 level: "query",
//             },
//             {
//                 emit: "event",
//                 level: "error",
//             },
//             {
//                 emit: "event",
//                 level: "info",
//             },
//             {
//                 emit: "event",
//                 level: "warn",
//             },
//         ],
//         errorFormat: "pretty",
//     });

//     // Set up event listeners for logging
//     prisma.$on("query", (e) => {
//         logger.debug(
//             `Prisma Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`
//         );
//     });

//     prisma.$on("info", (e) => logger.info(`Prisma: ${e.message}`));
//     prisma.$on("warn", (e) => logger.warn(`Prisma: ${e.message}`));
//     prisma.$on("error", (e) => logger.error(`Prisma: ${e.message}`));

//     global.prisma = prisma;
// } else {
//     prisma = global.prisma;
// }

// export default prisma;


import { PrismaClient } from '../generated/prisma/client.js'

const prisma = new PrismaClient()
export default prisma