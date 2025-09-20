import { config, logger } from "../config/index.js";
import prisma from "../../prisma/client.js";
import bcrypt from "bcrypt";

class appSeeding {
    static async systemUser() {
        try {
            const adminExist = await prisma.user.findUnique({
                where: {
                    email: config.systemUser.email,
                }
            })
            if (!adminExist) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(config.systemUser.password, saltRounds);
                await prisma.user.create({
                    data: {
                        email: config.systemUser.email,
                        password: hashedPassword,
                        userName: config.systemUser.userName,
                        role: "SYSADMIN",
                        isVerified: true
                    }
                })
                logger.info('System admin user created', {
                    email: config.systemUser.email,
                    userName: config.systemUser.userName,
                });
            }
            else {
                logger.info('System admin user already exists', {
                    email: config.systemUser.email,
                    userName: config.systemUser.userName,
                });
            }
        } catch (error) {
            logger.error('Failed to create system user', {
                error: error.message,
            });
            throw error;
        }
    }
}

export default appSeeding;