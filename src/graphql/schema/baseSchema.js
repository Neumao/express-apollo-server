const baseSchema = `#graphql
  scalar DateTime

  type Query {
    _: Boolean
    hello: String
  }

  type Mutation {
    _: Boolean
    # Root mutation type - extended by other schemas
  }

  type Subscription {
    _: Boolean
    # Root subscription type - extended by other schemas
  }
`;

export default baseSchema;