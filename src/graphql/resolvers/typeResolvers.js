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

// JSON scalar type for flexible data structures
const jsonScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',

    serialize(value) {
        return value;
    },

    parseValue(value) {
        return value;
    },

    parseLiteral(ast) {
        switch (ast.kind) {
            case Kind.STRING:
            case Kind.BOOLEAN:
                return ast.value;
            case Kind.INT:
            case Kind.FLOAT:
                return Number(ast.value);
            case Kind.OBJECT:
                return parseObject(ast);
            case Kind.LIST:
                return ast.values.map(n => parseLiteral(n));
            case Kind.NULL:
                return null;
            default:
                return null;
        }
    },
});

// Helper function for JSON scalar
function parseObject(ast) {
    const value = Object.create(null);
    ast.fields.forEach(field => {
        value[field.name.value] = parseLiteral(field.value);
    });
    return value;
}

function parseLiteral(ast) {
    switch (ast.kind) {
        case Kind.STRING:
        case Kind.BOOLEAN:
            return ast.value;
        case Kind.INT:
        case Kind.FLOAT:
            return Number(ast.value);
        case Kind.OBJECT:
            return parseObject(ast);
        case Kind.LIST:
            return ast.values.map(n => parseLiteral(n));
        case Kind.NULL:
            return null;
        default:
            return null;
    }
}

// Type resolvers
const typeResolvers = {
    DateTime: dateTimeScalar,
    // JSON: jsonScalar,
};

export default typeResolvers;