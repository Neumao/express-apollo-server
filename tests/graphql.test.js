const { ApolloServer } = require('@apollo/server');
const { makeExecutableSchema } = require('@graphql-tools/schema');

// Mock schema for testing
const typeDefs = `
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

describe('Basic Apollo Server', () => {
  let testServer;

  beforeAll(async () => {
    // Create a test server with mock schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    testServer = new ApolloServer({ schema });
    await testServer.start();
  });

  afterAll(async () => {
    await testServer.stop();
  });

  it('should resolve hello query correctly', async () => {
    const response = await testServer.executeOperation({
      query: 'query { hello }',
    });

    expect(response.body.singleResult.data.hello).toBe('Hello world!');
    expect(response.body.singleResult.errors).toBeUndefined();
  });
});
