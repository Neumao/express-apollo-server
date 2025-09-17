import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressMiddleware } from '@as-integrations/express5';
import { apolloServer, createContext } from './graphql/server.js';
import expressApp from './express/server.js';
import { logger, config } from './config/index.js';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';

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
        logger.info('Starting server...');

        // Create HTTP server
        const server = http.createServer(expressApp);

        // Create WebSocket server for GraphQL subscriptions
        new WebSocketServer({
            server,
            path: '/graphql',
        });

        // Start Apollo Server
        await apolloServer.start();
        logger.info('Apollo Server started');

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

        server.listen(PORT, () => {
            logger.info(`Server running in ${config.nodeEnv} mode`);
            logger.info(`Express REST API running at http://localhost:${PORT}/api`);
            logger.info(`Apollo GraphQL running at http://localhost:${PORT}/graphql`);
            logger.info(`GraphQL subscriptions running at ws://localhost:${PORT}/graphql`);
        });

        // Handle server shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        async function gracefulShutdown() {
            logger.info('Shutting down server...');
            server.close(() => {
                logger.info('HTTP server shut down successfully');
                apolloServer.stop().then(() => {
                    logger.info('Apollo Server stopped');
                    process.exit(0);
                });
            });
        }
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

await startServer()
    .then(() => {
        logger.info('Server started successfully');
    })
    .catch(error => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });