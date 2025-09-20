const userSchema = `#graphql
  enum UserRole {
    SYSADMIN
    ADMIN
    USER
    MODERATOR
  }

  type User {
    id: ID!
    email: String!
    userName: String
    firstName: String
    lastName: String
    profileImageUrl: String
    isActive: Boolean!
    isVerified: Boolean!
    phoneNumber: String
    authToken:String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
  }

  input RegisterInput {
    email: String!
    password: String!
    userName: String
    firstName: String
    lastName: String
    profileImageUrl: String
    phoneNumber: String
    role: UserRole!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    id: ID!
    email: String
    userName: String
    firstName: String
    lastName: String
    profileImageUrl: String
    phoneNumber: String
    role: UserRole
  }

  type ResponsePayload {
    status: Boolean!
    message: String!
    data: User
  }
  type ResponsePayloadAllUsers {
    status: Boolean!
    message: String!
    data: [User]
  }
  type ResponseLogout{
    status: Boolean!
    message: String!
  }
  type Query {
    _: Boolean
    me: ResponsePayload
    user(id: ID!): ResponsePayload
    users: ResponsePayloadAllUsers
  }

  type Mutation {
    _: Boolean
    register(input: RegisterInput!): ResponsePayload!
    login(input: LoginInput!): ResponsePayload!
    logout: ResponseLogout!
    updateUser(input: UpdateUserInput!): ResponsePayload!
    deleteUser(id: ID!): ResponsePayload!
  }

  type Subscription {
    _: Boolean
  }
`;

export default userSchema;
