import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { apolloServer, createContext, schema } from './graphql/server.js';
import { verifyToken, extractTokenFromHeader, generateAccessToken, generateRefreshToken } from './utils/jwtUtils.js';
import expressApp from './express/server.js';
import { logger, config } from './config/index.js';
import prisma from '../prisma/client.js';
import path from 'path';
import fs from 'fs';

import appSeeding from './seeding/appSeeding.js';

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED REJECTION:', reason);
});

// Create logs directory if it doesn't exist
try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
        logger.info(`Created logs directory: ${logDir}`);
    }
} catch (fsError) {
    logger.error('Error creating logs directory:', fsError);
}

async function startServer() {
    try {
        logger.info('Starting Apollo Server v5 with native subscriptions...');

        // Create HTTP server
        const httpServer = http.createServer(expressApp);

        // Create WebSocket server for subscriptions (schema is already created in server.js)
        const wsServer = new WebSocketServer({
            server: httpServer,
            path: '/graphql',
        });

        // Hand in the schema and have the WebSocketServer start listening
        const serverCleanup = useServer({
            schema,
            context: async (ctx, msg, args) => {
                // Extract authentication tokens from connection params
                const connectionParams = ctx.connectionParams || {};
                const authorization = connectionParams.authorization || connectionParams.Authorization;
                const refreshToken = connectionParams.refreshToken || connectionParams.refresh_token;

                try {
                    if (authorization) {
                        const token = extractTokenFromHeader(authorization);
                        if (token) {
                            try {
                                const user = verifyToken(token);
                                logger.debug(`🔐 WebSocket authenticated for user: ${user.id}`);
                                return { user, authenticated: true };
                            } catch (tokenError) {
                                // If access token expired, try refresh token (same logic as context.js)
                                if (tokenError.name === 'TokenExpiredError' && refreshToken) {
                                    logger.warn('🔄 Access token expired, attempting refresh for WebSocket');

                                    try {
                                        // Verify refresh token (using same logic as context.js)
                                        const user = verifyToken(refreshToken);

                                        // Generate new tokens
                                        const newAccessToken = generateAccessToken(user);
                                        const newRefreshToken = generateRefreshToken(user);
                                        const expirationTime = config.jwt.accessExpiration || 3600;

                                        if (isNaN(expirationTime) || expirationTime <= 0) {
                                            logger.error(`Invalid JWT access expiration time: ${config.jwt.accessExpiration}`);
                                            throw new Error('Invalid JWT access expiration time');
                                        }

                                        // Update database with new token (same as context.js)
                                        await prisma.user.update({
                                            where: { id: user.id },
                                            data: {
                                                authToken: newAccessToken,
                                                authTokenExpiry: new Date(Date.now() + expirationTime * 1000).toISOString(),
                                            },
                                        });

                                        logger.info(`🔄 Refreshed tokens for WebSocket user: ${user.id}`);
                                        return {
                                            user,
                                            authenticated: true,
                                            newAccessToken,
                                            newRefreshToken,
                                            tokenRefreshed: true
                                        };
                                    } catch (refreshError) {
                                        logger.error('🚫 Refresh token invalid for WebSocket:', refreshError.message);
                                        return { user: null, authenticated: false, authError: 'Invalid refresh token' };
                                    }
                                } else {
                                    logger.warn('🚫 Token expired and no refresh token provided for WebSocket');
                                    return { user: null, authenticated: false, authError: tokenError.message };
                                }
                            }
                        }
                    }

                    logger.debug('🔓 WebSocket connection without authentication');
                    return { user: null, authenticated: false };
                } catch (error) {
                    logger.warn('🚫 WebSocket authentication failed:', error.message);
                    return { user: null, authenticated: false, authError: error.message };
                }
            },
            onConnect: async (ctx) => {
                logger.info('🔌 WebSocket client connected for subscriptions');
                return true; // Allow connection (authentication handled in context)
            },
            onDisconnect: (ctx, code, reason) => {
                logger.info('🔌 WebSocket client disconnected', { code, reason });
            },
            onSubscribe: (ctx, message) => {
                logger.info('📡 New subscription started:', {
                    operationName: message.payload?.operationName || 'unnamed',
                    query: message.payload?.query?.substring(0, 100) + '...'
                });
            },
            onNext: (ctx, message, args, result) => {
                logger.info('📤 Sending subscription data to client');
            },
            onError: (ctx, message, errors) => {
                logger.error('❌ Subscription error:', errors);
            },
            onComplete: (ctx, message) => {
                logger.info('✅ Subscription completed');
            }
        }, wsServer);

        // Start Apollo Server (plugins are configured in server.js)
        await apolloServer.start();
        logger.info('Apollo Server v5 started successfully');

        // Apply Apollo middleware to Express with context function
        expressApp.use(
            '/graphql',
            cors(),
            bodyParser.json(),
            expressMiddleware(apolloServer, {
                context: createContext
            })
        );

        const PORT = config.port;

        httpServer.listen(PORT, () => {
            logger.info(`🚀 Apollo Server v5 running in ${config.nodeEnv} mode`);
            logger.info(`📡 Express REST API: http://localhost:${PORT}/api`);
            logger.info(`🎯 Apollo GraphQL: http://localhost:${PORT}/graphql`);
            logger.info(`🔌 WebSocket Subscriptions: ws://localhost:${PORT}/graphql`);
        });

        // Handle server shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        async function gracefulShutdown() {
            logger.info('Shutting down Apollo Server v5...');
            await serverCleanup.dispose();
            httpServer.close(() => {
                logger.info('HTTP server shut down successfully');
                apolloServer.stop().then(() => {
                    logger.info('Apollo Server stopped');
                    process.exit(0);
                });
            });
        }
    } catch (error) {
        logger.error(`Failed to start Apollo Server v5: ${error.message}`);
        process.exit(1);
    }
}

await startServer()
    .then(async () => {
        logger.info('Server started successfully');
        await appSeeding.systemUser(); // Corrected to call the static method directly

    })
    .catch(error => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });