const userSchema = `#graphql
  enum UserRole {
    USER
    ADMIN
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
    refreshToken: String!
    user: User!
  }

  type RefreshTokenPayload {
    accessToken: String!
    user: User!
  }

  type UserMutationResponse {
    message: String!
    user: User
  }

  type MessageResponse {
    message: String!
  }

  type UserCreatedPayload {
    user: User!
  }

  type UserUpdatedPayload {
    user: User!
  }

  type UserDeletedPayload {
    userId: ID!
  }

  extend type Query {
    me: User
    user(id: ID!): User
    users: [User!]!
  }

  extend type Mutation {
    register(input: RegisterInput!): UserMutationResponse!
    login(input: LoginInput!): AuthPayload!
    refreshToken(token: String!): RefreshTokenPayload!
    logout: MessageResponse!
    updateUser(id: ID!, input: UpdateUserInput!): UserMutationResponse!
    deleteUser(id: ID!): MessageResponse!
  }

  extend type Subscription {
    userCreated: UserCreatedPayload!
    userUpdated(id: ID!): UserUpdatedPayload!
    userDeleted: UserDeletedPayload!
  }
`;

export default userSchema;