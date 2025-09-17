import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Custom GraphQL type resolvers
 */

// DateTime scalar type
const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime scalar type',

    // Convert outgoing Date to string
    serialize(value) {
        return value instanceof Date ? value.toISOString() : null;
    },

    // Convert incoming string to Date
    parseValue(value) {
        return new Date(value);
    },

    // Convert AST literal to Date
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});

// Type resolvers
const typeResolvers = {
    DateTime: dateTimeScalar,

    // Add any other custom type resolvers here
};

export default typeResolvers;