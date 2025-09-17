const baseSchema = `#graphql
  scalar DateTime

  type Query {
    _: Boolean
    hello: String
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

export default baseSchema;