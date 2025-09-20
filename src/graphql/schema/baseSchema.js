const baseSchema = `#graphql
  scalar DateTime

  type TestPayload {
    id: ID!
    message: String!
    timestamp: String!
  }


  type Query {
    _: Boolean
    hello: String
  }

  type Mutation {
    _: Boolean
    triggerTestSubscription(message: String!): TestPayload!

    # Root mutation type - extended by other schemas
  }

  type Subscription {
    _: Boolean
    testSubscription: TestPayload!
    # Root subscription type - extended by other schemas
  }
`;

export default baseSchema;