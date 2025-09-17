import { ApolloServer } from '@apollo/server';
import { logger } from '../config/index.js';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import { createContext } from './context.js';
import { AppError } from '../utils/errors.js';

export const serverStatus = {
    initialized: false,
    startError: null
};

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (formattedError, error) => {
        const errorLevel = error instanceof AppError && error.statusCode < 500 ? 'warn' : 'error';
        try {
            logger[errorLevel](`GraphQL Error: ${formattedError.message}`, {
                path: formattedError.path?.join('.') || 'unknown',
                code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
                operation: formattedError.extensions?.operationName || 'unknown',
                originalError: error
            });
        } catch (logError) {
            logger.error('Error while logging GraphQL error:', logError);
        }
        if (process.env.NODE_ENV === 'production') {
            return {
                message: formattedError.message,
                path: formattedError.path,
                extensions: {
                    code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR'
                }
            };
        }
        return formattedError;
    },
    plugins: [
        {
            async requestDidStart(requestContext) {
                const { request } = requestContext;
                const operationName = request.operationName || 'unnamed operation';
                if (operationName !== 'IntrospectionQuery') {
                    logger.http(`GraphQL request started: ${operationName} (${request.query?.replace(/\s+/g, ' ').substring(0, 100)}...)`);
                }
                return {
                    async didEncounterErrors(ctx) {
                        const { errors } = ctx;
                        if (errors && errors.length > 0) {
                            logger.warn(`GraphQL encountered ${errors.length} errors during execution`, {
                                operation: operationName,
                            });
                        }
                    },
                    async willSendResponse(responseContext) {
                        const { response } = responseContext;
                        const hasErrors = response.body.kind === 'single' &&
                            response.body.singleResult.errors &&
                            response.body.singleResult.errors.length > 0;
                        if (hasErrors) {
                            logger.warn(`GraphQL response with errors: ${operationName}`);
                        } else {
                            if (operationName !== 'IntrospectionQuery') {
                                logger.http(`GraphQL request completed: ${operationName}`);
                            }
                        }
                    }
                };
            }
        }
    ],
});

export { apolloServer, createContext };