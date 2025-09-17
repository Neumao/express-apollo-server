const userSchema = `#graphql
  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String
    lastName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    email: String
    password: String
    firstName: String
    lastName: String
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type ResponsePayload {
    status: Boolean!
    message: String!
    data: JSON
  }

  scalar JSON

  type UserCreatedPayload {
    user: User!
  }

  type UserUpdatedPayload {
    user: User!
  }

  type UserDeletedPayload {
    user: User!
  }
    user: User!
  }

  type UserDeletedPayload {
    userId: ID!
  }

  # Placeholder field for empty types
  type Query {
    _: Boolean
    me: ResponsePayload
    user(id: ID!): ResponsePayload
    users: ResponsePayload
  }

  # Placeholder field for empty types
  type Mutation {
    _: Boolean
    register(input: RegisterInput!): ResponsePayload!
    login(input: LoginInput!): ResponsePayload!
    refreshToken(token: String!): ResponsePayload!
    logout: ResponsePayload!
    updateUser(id: ID!, input: UpdateUserInput!): ResponsePayload!
    deleteUser(id: ID!): ResponsePayload!
  }

  # Placeholder field for empty types
  type Subscription {
    _: Boolean
    userCreated: UserCreatedPayload!
    userUpdated(id: ID!): UserUpdatedPayload!
    userDeleted: UserDeletedPayload!
  }
`;

export default userSchema;